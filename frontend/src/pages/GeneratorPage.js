import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import generationLogService from '../services/generationLogService';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ProfileIcon from '../components/ProfileIcon';
import { Stage, Layer, Rect, Text, Transformer, Circle, RegularPolygon, Star, Line as KonvaLine, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_TEMPLATE_VARIABLES, STORAGE_KEYS } from '../constants';
import './GeneratorPage.css';

const TEMPLATE_VARIABLES = DEFAULT_TEMPLATE_VARIABLES;

// Custom lightweight Image Renderer for Generator
const GeneratorImage = ({ shapeProps }) => {
    const [image] = useImage(shapeProps.src);
    return (
        <KonvaImage
            image={image}
            x={shapeProps.x}
            y={shapeProps.y}
            width={shapeProps.width}
            height={shapeProps.height}
            opacity={shapeProps.opacity != null ? shapeProps.opacity : 1}
        />
    );
};


const GeneratorPage = () => {
    const navigate = useNavigate();
    const [sheetsUrl, setSheetsUrl] = useState('');
    const [sheetColumns, setSheetColumns] = useState([]);
    const [sheetData, setSheetData] = useState([]);
    const [mappings, setMappings] = useState({});

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateStartIndex, setTemplateStartIndex] = useState(0);

    const handleNextTemplates = () => {
        if (templates.length > 3) {
            setTemplateStartIndex((prev) => (prev + 1) % templates.length);
        }
    };

    const handlePrevTemplates = () => {
        if (templates.length > 3) {
            setTemplateStartIndex((prev) => (prev - 1 + templates.length) % templates.length);
        }
    };

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
            if (stored && stored !== '[]') {
                const parsed = JSON.parse(stored);
                setTemplates(parsed);
                if (parsed.length > 0) setSelectedTemplate(parsed[0]);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates([]);
        }
    }, []);

    const [logs, setLogs] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewRowIndex, setPreviewRowIndex] = useState(0);
    const csvInputRef = useRef(null);
    const offscreenStageRef = useRef(null);

    const [processingRowIndex, setProcessingRowIndex] = useState(-1);
    const [execOptions, setExecOptions] = useState({ pdf: true, drive: false, email: false });
    const [emailColumn, setEmailColumn] = useState('');
    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    }

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        addLog(`Parsing CSV: ${file.name}`);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const columns = Object.keys(results.data[0]);
                    setSheetColumns(columns);
                    setSheetData(results.data);

                    // Auto-map if column names match template variables exactly
                    const autoMap = {};
                    (selectedTemplate?.variables || TEMPLATE_VARIABLES).forEach(v => {
                        const match = columns.find(c => c.toLowerCase().includes(v.toLowerCase()));
                        if (match) autoMap[v] = match;
                    });
                    setMappings(autoMap);

                    setPreviewRowIndex(0);
                    addLog(`Successfully loaded ${results.data.length} records.`);
                } else {
                    addLog('Error: CSV file is empty or invalid.');
                }
            },
            error: (err) => {
                addLog(`CSV Parse Error: ${err.message}`);
            }
        });
        e.target.value = ''; // Reset input
    };

    const handleFetchFromGoogleSheets = () => {
        if (!sheetsUrl || !sheetsUrl.includes('docs.google.com/spreadsheets/d/')) {
            addLog('Error: Please enter a valid Google Sheets link.');
            return;
        }

        try {
            // Extract the Sheet ID from the URL
            const matches = sheetsUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (!matches || matches.length < 2) {
                addLog('Error: Invalid Google Sheets URL format.');
                return;
            }

            const sheetId = matches[1];
            // Construct the CSV export URL
            const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

            addLog('Fetching data from Google Sheets...');

            Papa.parse(csvExportUrl, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        const columns = Object.keys(results.data[0]);
                        setSheetColumns(columns);
                        setSheetData(results.data);

                        // Auto-map if column names match template variables exactly
                        const autoMap = {};
                        (selectedTemplate?.variables || TEMPLATE_VARIABLES).forEach(v => {
                            const match = columns.find(c => c.toLowerCase().includes(v.toLowerCase()));
                            if (match) autoMap[v] = match;
                        });
                        setMappings(autoMap);

                        setPreviewRowIndex(0);
                        addLog(`Successfully loaded ${results.data.length} records from Google Sheets.`);
                    } else {
                        addLog('Error: Google Sheet is empty or could not be parsed.');
                    }
                },
                error: (err) => {
                    addLog(`Fetch Error: Make sure the Google Sheet is set to "Anyone with the link can view".`);
                    console.error('Papa Parse Error:', err);
                }
            });
        } catch (error) {
            addLog(`Error parsing URL: ${error.message}`);
        }
    };

    const handleMappingChange = (variable, column) => {
        setMappings(prev => ({ ...prev, [variable]: column }));
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setProgress(0);
        setLogs([]);
        addLog('Initializing GDGoC Asset Generator...');

        setTimeout(() => addLog('Fetching data from Google Sheets...'), 800);
        setTimeout(() => addLog('Loading template SVG...'), 1600);
        setTimeout(() => addLog(`Processing ${sheetData.length || 50} records...`), 2400);

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 8 + 2;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                addLog('Generating PDFs... Done');
                addLog('Ready for generation.');
                setTimeout(() => setIsGenerating(false), 1000);
            }
            setProgress(Math.min(p, 100));
        }, 150);
    };

    return (
        <React.Fragment>
            <div className="generator-page">
                {/* Header */}
                <header className="gen-header">
                    <div className="gen-header-left" onClick={() => navigate(-1)} style={{ cursor: 'pointer', paddingLeft: '8px' }}>
                        <div className="home-logo-icon" style={{ width: '40px', height: '40px' }}>
                            <img src="/assets/bugkathon_logo.svg" alt="Bugkathon Logo" style={{ width: "100%", height: "100%" }} className="bugkathon-logo" />
                        </div>
                    </div>
                    <h1 className="gen-header-title">Bugkathon</h1>
                    <div className="gen-header-right">
                        <div className="profile-icon" style={{ background: 'none', padding: 0 }}>
                            <ProfileIcon />
                        </div>
                    </div>
                </header>

                <div className="gen-columns">
                    {/* ===== LEFT COLUMN ===== */}
                    <div className="gen-col-left">

                        {/* DATA SOURCE */}
                        <div className="gen-card">
                            <div className="gen-card-title">DATA SOURCE</div>

                            {/* Option 1: Google Sheets URL */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5F6368', marginBottom: '8px', display: 'block' }}>Option 1: Google Sheets Link</label>
                                <div className="url-input-wrap">
                                    <div className="url-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#99A1AF" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        className="url-input"
                                        placeholder="Paste a public Google Sheets link..."
                                        value={sheetsUrl}
                                        onChange={e => setSheetsUrl(e.target.value)}
                                    />
                                </div>
                                <button className="btn-primary" style={{ width: '100%', marginTop: '8px', background: '#34A853' }} onClick={handleFetchFromGoogleSheets}>
                                    Fetch from Google Sheets
                                </button>
                                <p style={{ fontSize: '11px', color: '#99A1AF', marginTop: '4px' }}>* Ensure link sharing is set to "Anyone with the link can view".</p>
                            </div>

                            <div style={{ width: '100%', height: '1px', background: '#E8EAED', margin: '20px 0' }}></div>

                            {/* Option 2: CSV Upload */}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5F6368', marginBottom: '8px', display: 'block' }}>Option 2: Upload CSV File</label>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => csvInputRef.current?.click()}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    Upload Local CSV
                                </button>
                                <input
                                    type="file"
                                    accept=".csv"
                                    ref={csvInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleCSVUpload}
                                />
                            </div>
                        </div>

                        {/* TEMPLATE */}
                        <div className="gen-card">
                            <div className="gen-card-title">TEMPLATE</div>
                            <div className="template-carousel-wrapper">
                                <button
                                    className={`carousel-arrow ${templates.length <= 3 ? 'disabled' : ''}`}
                                    onClick={handlePrevTemplates}
                                    disabled={templates.length <= 3}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                </button>
                                <div className="template-cards">
                                    {templates.length > 0 && Array.from({ length: Math.min(3, templates.length) }).map((_, i) => {
                                        const tpl = templates[(templateStartIndex + i) % templates.length];
                                        return (
                                            <div key={tpl.id} className="template-card-small" onClick={() => setSelectedTemplate(tpl)} style={{ cursor: 'pointer' }}>
                                                <div className={`tpl-mock-preview ${selectedTemplate?.id === tpl.id ? 'active' : ''}`}>
                                                    <div className="tpl-mock-inner">
                                                        <div className="tpl-mock-box"></div>
                                                        <div className="tpl-mock-txt">Certificate</div>
                                                    </div>
                                                </div>
                                                <div className="tpl-name-small">{tpl.title}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <button
                                    className={`carousel-arrow ${templates.length <= 3 ? 'disabled' : ''}`}
                                    onClick={handleNextTemplates}
                                    disabled={templates.length <= 3}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </button>
                            </div>
                            <button className="browse-templates-btn" onClick={() => setIsTemplateModalOpen(true)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>
                                Browse My Templates
                            </button>
                        </div>

                        {/* DATA MAPPING */}
                        <div className="gen-card">
                            <div className="gen-card-title">DATA MAPPING</div>
                            <div className="mapping-grid">
                                <div className="mapping-col-headers">
                                    <span>Variable</span>
                                    <span>Maps to</span>
                                </div>
                                {(selectedTemplate?.variables || TEMPLATE_VARIABLES).map(v => (
                                    <div className="mapping-row" key={v}>
                                        <div className="mapping-var-pill">{`{{${v}}}`}</div>
                                        <select className="mapping-select-box" value={mappings[v] || ''} onChange={e => handleMappingChange(v, e.target.value)}>
                                            <option value=""></option>
                                            {sheetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* ===== RIGHT COLUMN ===== */}
                    <div className="gen-col-right">

                        {/* LIVE PREVIEW */}
                        <div className="gen-card live-preview-section">
                            <div className="gen-card-title">LIVE PREVIEW</div>

                            <div className="cert-live-frame-wrapper">
                                <div className="cert-live-frame" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0' }}>
                                    {selectedTemplate ? (
                                        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ transform: 'scale(0.55)', transformOrigin: 'center center' }}>
                                            <Layer>
                                                <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
                                                {selectedTemplate.elements?.map(el => {
                                                    const isFilled = el.filled !== false;
                                                    const fillOpt = isFilled ? el.fill : undefined;
                                                    const strokeOpt = isFilled ? undefined : el.fill;
                                                    const strokeWidthOpt = isFilled ? 0 : (el.strokeWidth || 2);

                                                    if (el.type === 'rect') return <Rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} cornerRadius={el.cornerRadius || 0} opacity={el.opacity != null ? el.opacity : 1} />;
                                                    if (el.type === 'circle') return <Circle key={el.id} x={el.x} y={el.y} radius={el.radius} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                                    if (el.type === 'triangle') return <RegularPolygon key={el.id} sides={3} x={el.x} y={el.y} radius={el.radius} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                                    if (el.type === 'star') return <Star key={el.id} numPoints={5} innerRadius={el.innerRadius} outerRadius={el.radius} x={el.x} y={el.y} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                                    if (el.type === 'image') return <GeneratorImage key={el.id} shapeProps={el} />;

                                                    if (el.type === 'text') {
                                                        let displayTxt = el.text;
                                                        if (sheetData[previewRowIndex]) {
                                                            const rowData = sheetData[previewRowIndex];
                                                            const currentTemplateVars = selectedTemplate?.variables || TEMPLATE_VARIABLES;
                                                            currentTemplateVars.forEach(v => {
                                                                const token = `{{${v}}}`;
                                                                if (displayTxt.includes(token) && mappings[v]) {
                                                                    displayTxt = displayTxt.split(token).join(rowData[mappings[v]] || '');
                                                                }
                                                            });
                                                        }
                                                        return (
                                                            <Text key={el.id} x={el.x} y={el.y} text={displayTxt} fontSize={el.fontSize} fontFamily={el.fontFamily} fill={el.fill} align={el.align} fontStyle={el.fontStyle} textDecoration={el.textDecoration} opacity={el.opacity != null ? el.opacity : 1} width={el.width} />
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </Layer>
                                        </Stage>
                                    ) : (
                                        <div style={{ color: '#5F6368', fontSize: '14px', textAlign: 'center' }}>No Template Selected</div>
                                    )}
                                </div>
                            </div>

                            <div className="preview-pagination">
                                <button className="page-btn" onClick={() => setPreviewRowIndex(Math.max(0, previewRowIndex - 1))}>
                                    &lt; Previous
                                </button>
                                <span className="page-info">{sheetData.length ? previewRowIndex + 1 : 1} of {sheetData.length || 50}</span>
                                <button className="page-btn" onClick={() => setPreviewRowIndex(Math.min((sheetData.length || 50) - 1, previewRowIndex + 1))}>
                                    Next &gt;
                                </button>
                            </div>
                        </div>

                        {/* EXECUTION OPTIONS */}
                        <div className="gen-card">
                            <div className="gen-card-title">EXECUTION OPTIONS</div>
                            <div className="execution-options" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px' }}>
                                <label className="exec-opt" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={execOptions.pdf} onChange={e => setExecOptions({ ...execOptions, pdf: e.target.checked })} />
                                    <span style={{ color: '#EA4335' }}>📄</span> Create PDF Archive
                                </label>
                                <label className="exec-opt" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={execOptions.drive} onChange={e => setExecOptions({ ...execOptions, drive: e.target.checked })} />
                                    <span style={{ color: '#FBBC04' }}>🗂️</span> Save to Drive <span style={{ fontSize: '10px', color: '#9CA3AF' }}>(Mock)</span>
                                </label>
                                <label className="exec-opt" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={execOptions.email} onChange={e => setExecOptions({ ...execOptions, email: e.target.checked })} />
                                    <span style={{ color: '#34A853' }}>✉️</span> Send Email <span style={{ fontSize: '10px', color: '#9CA3AF' }}>(Mock)</span>
                                </label>
                            </div>

                            {execOptions.email && (
                                <div style={{ marginTop: '16px', padding: '12px', background: '#F8F9FA', borderRadius: '6px', border: '1px solid #E8EAED' }}>
                                    <label style={{ fontSize: '11px', color: '#5F6368', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Select Email Column:</label>
                                    <select value={emailColumn} onChange={e => setEmailColumn(e.target.value)} className="mapping-select-box" style={{ width: '100%' }}>
                                        <option value="">-- Choose Column --</option>
                                        {sheetColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}

                            <button className="start-gen-btn" onClick={handleGenerate} disabled={isGenerating} style={{ marginTop: '16px' }}>
                                Execute Workflow
                            </button>
                        </div>

                        {/* SYSTEM LOG */}
                        <div className="gen-card card-no-padding">
                            <div className="gen-card-title pad-title">SYSTEM LOG</div>
                            <div className="sys-log-box">
                                {logs.map((log, i) => (
                                    <div key={i} className="sys-log-line">
                                        <span className="sys-log-time">{log.split(']')[0] + ']'}</span>
                                        <span className={`sys-log-msg ${log.toLowerCase().includes('done') || log.toLowerCase().includes('ready') ? 'success' : ''}`}>
                                            {log.split(']')[1]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="progress-container">
                                <div className="progress-labels">
                                    <span className="prog-text">Processing...</span>
                                    <span className="prog-pct">{Math.round(progress)}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {
                isTemplateModalOpen && (
                    <div className="template-modal-overlay" onClick={() => setIsTemplateModalOpen(false)}>
                        <div className="template-modal" onClick={e => e.stopPropagation()}>
                            <div className="template-modal-header">
                                <h2>Select a Template</h2>
                                <button className="close-modal-btn" onClick={() => setIsTemplateModalOpen(false)}>&times;</button>
                            </div>
                            <div className="template-modal-grid">
                                {templates.map(tpl => (
                                    <div
                                        key={tpl.id}
                                        className={`modal-tpl-card ${selectedTemplate?.id === tpl.id ? 'selected' : ''}`}
                                        onClick={() => { setSelectedTemplate(tpl); setIsTemplateModalOpen(false); }}
                                    >
                                        <div className="modal-tpl-preview"></div>
                                        <div className="modal-tpl-title">{tpl.title}</div>
                                    </div>
                                ))}
                                {templates.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.5 }}>No templates found. Go to My Templates to create one.</div>}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* HIDDEN OFFSCREEN STAGE FOR BATCH GENERATION */}
            {isGenerating && processingRowIndex >= 0 && selectedTemplate && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                    <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={offscreenStageRef}>
                        <Layer>
                            <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
                            {selectedTemplate.elements?.map(el => {
                                const isFilled = el.filled !== false;
                                const fillOpt = isFilled ? el.fill : undefined;
                                const strokeOpt = isFilled ? undefined : el.fill;
                                const strokeWidthOpt = isFilled ? 0 : (el.strokeWidth || 2);

                                if (el.type === 'rect') return <Rect key={`gen_${el.id}`} x={el.x} y={el.y} width={el.width} height={el.height} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} cornerRadius={el.cornerRadius || 0} opacity={el.opacity != null ? el.opacity : 1} />;
                                if (el.type === 'circle') return <Circle key={`gen_${el.id}`} x={el.x} y={el.y} radius={el.radius} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                if (el.type === 'triangle') return <RegularPolygon key={`gen_${el.id}`} sides={3} x={el.x} y={el.y} radius={el.radius} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                if (el.type === 'star') return <Star key={`gen_${el.id}`} numPoints={5} innerRadius={el.innerRadius} outerRadius={el.radius} x={el.x} y={el.y} fill={fillOpt} stroke={strokeOpt} strokeWidth={strokeWidthOpt} opacity={el.opacity != null ? el.opacity : 1} />;
                                if (el.type === 'image') return <GeneratorImage key={`gen_${el.id}`} shapeProps={el} />;

                                if (el.type === 'text') {
                                    let displayTxt = el.text;
                                    const rowData = sheetData[processingRowIndex];
                                    if (rowData) {
                                        const currentTemplateVars = selectedTemplate?.variables || TEMPLATE_VARIABLES;
                                        currentTemplateVars.forEach(v => {
                                            const token = `{{${v}}}`;
                                            if (displayTxt.includes(token) && mappings[v]) {
                                                displayTxt = displayTxt.split(token).join(rowData[mappings[v]] || '');
                                            }
                                        });
                                    }
                                    return (
                                        <Text key={`gen_${el.id}`} x={el.x} y={el.y} text={displayTxt} fontSize={el.fontSize} fontFamily={el.fontFamily} fill={el.fill} align={el.align} fontStyle={el.fontStyle} textDecoration={el.textDecoration} opacity={el.opacity != null ? el.opacity : 1} width={el.width} />
                                    );
                                }
                                return null;
                            })}
                        </Layer>
                    </Stage>
                </div>
            )}
        </React.Fragment >
    );
};

export default GeneratorPage;
