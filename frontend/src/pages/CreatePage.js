import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Transformer, Circle, RegularPolygon, Star, Line as KonvaLine, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_TEMPLATE_VARIABLES, STORAGE_KEYS } from '../constants';
import './CreatePage.css';

// Custom Image Component to handle useImage hook cleanly inside the Konva Stage
const URLImage = ({ shapeProps, isSelected, onSelect, onChange, common }) => {
    const [image] = useImage(shapeProps.src);
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <KonvaImage
                {...common}
                image={image}
                x={shapeProps.x}
                y={shapeProps.y}
                width={shapeProps.width}
                height={shapeProps.height}
                opacity={shapeProps.opacity != null ? shapeProps.opacity : 1}
                ref={shapeRef}
                onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
                onTransformEnd={() => {
                    const node = shapeRef.current;
                    const sx = node.scaleX();
                    const sy = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(), y: node.y(),
                        width: Math.max(5, node.width() * sx),
                        height: Math.max(5, node.height() * sy),
                    });
                }}
            />
            {isSelected && (
                <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox} />
            )}
        </React.Fragment>
    );
};

const ElementComponent = ({ shapeProps, isSelected, onSelect, onChange, onDoubleClick }) => {
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleDragEnd = (e) => {
        onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        if (shapeProps.type === 'circle') {
            onChange({ ...shapeProps, x: node.x(), y: node.y(), radius: Math.max(5, node.radius() * scaleX) });
        } else if (shapeProps.type === 'triangle') {
            onChange({ ...shapeProps, x: node.x(), y: node.y(), radius: Math.max(5, node.radius() * scaleX), scaleX: 1, scaleY: 1 });
        } else {
            onChange({
                ...shapeProps,
                x: node.x(), y: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
                ...(shapeProps.type === 'text' && { fontSize: shapeProps.fontSize * Math.max(scaleX, scaleY) })
            });
        }
    };

    // Compute fill/stroke props based on the `filled` flag
    const isFilled = shapeProps.filled !== false; // default to filled
    const renderFill = isFilled ? shapeProps.fill : 'transparent';
    const renderStroke = isFilled ? undefined : (shapeProps.fill || '#000000');
    const renderStrokeWidth = isFilled ? 0 : (shapeProps.strokeWidth || 2);

    const common = { onClick: onSelect, onTap: onSelect, ref: shapeRef, draggable: true, onDragEnd: handleDragEnd, onTransformEnd: handleTransformEnd };

    const renderShape = () => {
        const p = { ...shapeProps, fill: renderFill, stroke: renderStroke, strokeWidth: renderStrokeWidth };
        switch (shapeProps.type) {
            case 'rect': return <Rect {...common} {...p} />;
            case 'text': return <Text {...common} {...p} fill={shapeProps.fill} stroke={undefined} strokeWidth={0} onDblClick={(e) => onDoubleClick && onDoubleClick(e, shapeRef.current)} />;
            case 'circle': return <Circle {...common} {...p} />;
            case 'triangle': return <RegularPolygon sides={3} {...common} {...p} />;
            case 'pentagon': return <RegularPolygon sides={5} {...common} {...p} />;
            case 'hexagon': return <RegularPolygon sides={6} {...common} {...p} />;
            case 'star': return <Star numPoints={5} innerRadius={shapeProps.innerRadius || shapeProps.radius * 0.4} outerRadius={shapeProps.radius} {...common} {...p} />;
            case 'diamond': return <KonvaLine closed points={[0, -(shapeProps.radius || 50), (shapeProps.radius || 50), 0, 0, (shapeProps.radius || 50), -(shapeProps.radius || 50), 0]} {...common} {...p} x={shapeProps.x} y={shapeProps.y} />;
            case 'arrow': return <KonvaLine closed points={[-20, -15, 20, -15, 20, -25, 40, 0, 20, 25, 20, 15, -20, 15]} {...common} {...p} x={shapeProps.x} y={shapeProps.y} scaleX={shapeProps.scaleVal || 1} scaleY={shapeProps.scaleVal || 1} />;
            case 'line': return <Rect {...common} {...p} cornerRadius={shapeProps.height / 2} />;
            case 'image': return <URLImage shapeProps={shapeProps} common={common} isSelected={isSelected} onSelect={onSelect} onChange={onChange} />;
            default: return null;
        }
    };

    return (
        <React.Fragment>
            {renderShape()}
            {isSelected && shapeProps.type !== 'image' && ( // Image transformer is handled within URLImage
                <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox} />
            )}
        </React.Fragment>
    );
};

// Undo/Redo History Hook
const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [step, setStep] = useState(0);
    const setState = useCallback((newState, overwrite = false) => {
        const val = typeof newState === 'function' ? newState(history[step]) : newState;
        if (overwrite) {
            const copy = [...history]; copy[step] = val; setHistory(copy);
        } else {
            const next = [...history.slice(0, step + 1), val];
            setHistory(next); setStep(next.length - 1);
        }
    }, [history, step]);
    const undo = useCallback(() => setStep(Math.max(0, step - 1)), [step]);
    const redo = useCallback(() => setStep(Math.min(history.length - 1, step + 1)), [history, step]);
    return [history[step], setState, undo, redo, step > 0, step < history.length - 1];
};

const CreatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const stageWidth = CANVAS_WIDTH;
    const stageHeight = CANVAS_HEIGHT;
    const stageRef = useRef();

    const [designName, setDesignName] = useState('Untitled Template');
    const [templateVars, setTemplateVars] = useState(DEFAULT_TEMPLATE_VARIABLES);
    const [isElementsMenuOpen, setIsElementsMenuOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Blank canvas init with undo/redo
    const [elements, setElements, undo, redo, canUndo, canRedo] = useHistory([]);
    const [selectedId, selectShape] = useState(null);
    const [editingTextNode, setEditingTextNode] = useState(null);

    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('id');

    const [loadedId, setLoadedId] = useState(null);

    useEffect(() => {
        if (templateId && templateId !== loadedId) {
            try {
                const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
                if (stored && stored !== '[]') {
                    const templates = JSON.parse(stored);
                    const t = templates.find(temp => temp.id === Number(templateId));
                    if (t) {
                        setDesignName(t.title);
                        if (t.elements && t.elements.length > 0) {
                            setElements(t.elements);
                        }
                        if (t.variables) {
                            setTemplateVars(t.variables);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading template:', error);
                alert('Failed to load template. Please try again.');
            }
            setLoadedId(templateId);
        }
    }, [templateId, loadedId, setElements]);

    const handleSave = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
            let templates = stored && stored !== '[]' ? JSON.parse(stored) : [];
            if (templateId) {
                templates = templates.map(t => t.id === Number(templateId) ? { ...t, title: designName, elements, variables: templateVars, lastEdited: 'Just now' } : t);
            } else {
                const newTpl = {
                    id: Date.now(),
                    title: designName,
                    lastEdited: 'Just now',
                    elements,
                    variables: templateVars
                };
                templates = [newTpl, ...templates];
                navigate(`/create?id=${newTpl.id}`, { replace: true });
            }
            localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
            alert('Template saved successfully!');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template. Please try again.');
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedId) { setElements(prev => prev.filter(el => el.id !== selectedId)); selectShape(null); }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); e.shiftKey ? (canRedo && redo()) : (canUndo && undo());
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault(); canRedo && redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, canUndo, canRedo, undo, redo, setElements]);

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.id() === 'bg';
        if (clickedOnEmpty) { selectShape(null); finishTextEdit(); setIsElementsMenuOpen(false); setIsExportMenuOpen(false); }
    };

    const addShape = (type, filled = true) => {
        const base = { id: `${type}_${Date.now()}`, type, x: 200, y: 200, filled, fill: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'), strokeWidth: 2, opacity: 1 };
        switch (type) {
            case 'rect': setElements([...elements, { ...base, width: 100, height: 100, cornerRadius: 4 }]); break;
            case 'circle': setElements([...elements, { ...base, radius: 50 }]); break;
            case 'triangle': setElements([...elements, { ...base, radius: 60 }]); break;
            case 'pentagon': setElements([...elements, { ...base, radius: 55 }]); break;
            case 'hexagon': setElements([...elements, { ...base, radius: 50 }]); break;
            case 'star': setElements([...elements, { ...base, radius: 55, innerRadius: 22 }]); break;
            case 'diamond': setElements([...elements, { ...base, radius: 50 }]); break;
            case 'arrow': setElements([...elements, { ...base, radius: 40, scaleVal: 1 }]); break;
            case 'line': setElements([...elements, { ...base, width: 150, height: 8, fill: '#333', filled: true }]); break;
            default: break;
        }
        setIsElementsMenuOpen(false);
    };

    const addText = () => {
        setElements([...elements, {
            id: `text_${Date.now()}`, type: 'text', text: 'New Text', x: 150, y: 150,
            fontSize: 28, fontFamily: 'sans-serif', align: 'left', fill: '#000000',
            opacity: 1, fontStyle: 'normal', textDecoration: ''
        }]);
        setIsElementsMenuOpen(false);
    };

    const addVariable = (varKey) => {
        setElements([...elements, {
            id: `text_${Date.now()}`, type: 'text', text: `{{${varKey}}}`, x: 200, y: 200,
            fontSize: 28, fontFamily: 'sans-serif', align: 'left', fill: '#4285F4'
        }]);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            const image = new window.Image();
            image.onload = () => {
                const maxW = 300;
                const ratio = image.width / image.height;
                const w = image.width > maxW ? maxW : image.width;
                const h = w / ratio;
                const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
                const newImage = {
                    id: `image_${Date.now()}`, type: 'image', x: 100, y: 100,
                    width: w, height: h, opacity: 1,
                    src: dataUrl, fileName: file.name,
                    imgFormat: isSvg ? 'svg' : 'png',
                };
                setElements(prev => [...prev, newImage]);
                selectShape(newImage.id);
            };
            image.src = dataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        setIsElementsMenuOpen(false);
    };

    const deleteSelected = () => {
        if (selectedId) { setElements(elements.filter(el => el.id !== selectedId)); selectShape(null); }
    };

    // Layer ordering functions
    const bringToFront = () => {
        if (!selectedId) return;
        setElements(prev => {
            const idx = prev.findIndex(el => el.id === selectedId);
            if (idx < 0 || idx === prev.length - 1) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.push(item);
            return copy;
        });
    };
    const sendToBack = () => {
        if (!selectedId) return;
        setElements(prev => {
            const idx = prev.findIndex(el => el.id === selectedId);
            if (idx <= 0) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.unshift(item);
            return copy;
        });
    };
    const moveUp = () => {
        if (!selectedId) return;
        setElements(prev => {
            const idx = prev.findIndex(el => el.id === selectedId);
            if (idx < 0 || idx === prev.length - 1) return prev;
            const copy = [...prev];
            [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
            return copy;
        });
    };
    const moveDown = () => {
        if (!selectedId) return;
        setElements(prev => {
            const idx = prev.findIndex(el => el.id === selectedId);
            if (idx <= 0) return prev;
            const copy = [...prev];
            [copy[idx], copy[idx - 1]] = [copy[idx - 1], copy[idx]];
            return copy;
        });
    };

    const getLayerLabel = (el) => {
        if (el.type === 'text') return el.text.length > 14 ? el.text.slice(0, 14) + '...' : el.text;
        if (el.type === 'image') return el.fileName || 'Image';
        return el.type.charAt(0).toUpperCase() + el.type.slice(1);
    };
    const getLayerIcon = (type) => {
        switch (type) {
            case 'text': return 'T';
            case 'rect': return '▮';
            case 'circle': return '●';
            case 'triangle': return '▲';
            case 'star': return '★';
            case 'pentagon': return '⬠';
            case 'hexagon': return '⬡';
            case 'diamond': return '◆';
            case 'arrow': return '▸';
            case 'line': return '—';
            case 'image': return '🖼';
            default: return '■';
        }
    };

    const handleTextDoubleClick = (e, node) => {
        const pos = node.absolutePosition();
        node.hide();
        setEditingTextNode({
            id: node.attrs.id, node, x: pos.x, y: pos.y,
            text: node.text(), fontSize: node.fontSize(),
            width: node.width() * node.scaleX(), height: node.height() * node.scaleY(),
            color: node.fill(), fontFamily: node.fontFamily(), align: node.align()
        });
    };

    const finishTextEdit = () => {
        if (!editingTextNode) return;
        setElements(elements.map(el => el.id === editingTextNode.id ? { ...el, text: editingTextNode.text } : el));
        editingTextNode.node.show();
        editingTextNode.node.getLayer().batchDraw();
        setEditingTextNode(null);
    };

    const handlePropertyChange = (property, value) => {
        if (!selectedId) return;
        setElements(elements.map(el => el.id === selectedId ? { ...el, [property]: value } : el));
    };

    const escapeSvgText = (value) => {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const downloadImage = (format) => {
        const fileName = `${designName.replace(/\s+/g, '-').toLowerCase() || 'design'}.${format}`;
        if (format === 'png') {
            const old = selectedId; selectShape(null);
            setTimeout(() => {
                const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
                const link = document.createElement('a');
                link.download = fileName; link.href = uri;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
                selectShape(old); setIsExportMenuOpen(false);
            }, 100);
            return;
        }
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${stageWidth}" height="${stageHeight}" viewBox="0 0 ${stageWidth} ${stageHeight}">`;
        svg += `<rect x="0" y="0" width="${stageWidth}" height="${stageHeight}" fill="#ffffff" />`;
        elements.forEach(el => {
            const isFilled = el.filled !== false;
            const svgFill = isFilled ? el.fill : 'none';
            const svgStroke = isFilled ? 'none' : el.fill;
            const svgSW = isFilled ? 0 : (el.strokeWidth || 2);
            const attrs = `fill="${svgFill}" stroke="${svgStroke}" stroke-width="${svgSW}"`;

            if (el.type === 'rect') svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${attrs} rx="${el.cornerRadius || 0}" />`;
            else if (el.type === 'line') svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}" rx="${el.height / 2}" />`;
            else if (el.type === 'text') {
                const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
                let sx = el.x; if (el.align === 'center') sx += (el.width / 2); if (el.align === 'right') sx += el.width;
                svg += `<text x="${sx}" y="${el.y + el.fontSize * 0.8}" font-family="${el.fontFamily || 'sans-serif'}" font-size="${el.fontSize}px" fill="${el.fill}" text-anchor="${anchor}">${escapeSvgText(el.text)}</text>`;
            } else if (el.type === 'circle') svg += `<circle cx="${el.x}" cy="${el.y}" r="${el.radius}" ${attrs} />`;
            else if (el.type === 'triangle' || el.type === 'pentagon' || el.type === 'hexagon') {
                const sides = el.type === 'triangle' ? 3 : el.type === 'pentagon' ? 5 : 6;
                const r = el.radius;
                const pts = Array.from({ length: sides }, (_, i) => {
                    const a = (Math.PI * 2 * i / sides) - Math.PI / 2;
                    return `${el.x + r * Math.cos(a)},${el.y + r * Math.sin(a)}`;
                }).join(' ');
                svg += `<polygon points="${pts}" ${attrs} />`;
            } else if (el.type === 'star') {
                const r = el.radius; const ir = el.innerRadius || r * 0.4;
                const pts = Array.from({ length: 10 }, (_, i) => {
                    const a = (Math.PI * 2 * i / 10) - Math.PI / 2;
                    const cr = i % 2 === 0 ? r : ir;
                    return `${el.x + cr * Math.cos(a)},${el.y + cr * Math.sin(a)}`;
                }).join(' ');
                svg += `<polygon points="${pts}" ${attrs} />`;
            } else if (el.type === 'diamond') {
                const r = el.radius || 50;
                svg += `<polygon points="${el.x},${el.y - r} ${el.x + r},${el.y} ${el.x},${el.y + r} ${el.x - r},${el.y}" ${attrs} />`;
            } else if (el.type === 'arrow') {
                svg += `<polygon points="${el.x - 20},${el.y - 15} ${el.x + 20},${el.y - 15} ${el.x + 20},${el.y - 25} ${el.x + 40},${el.y} ${el.x + 20},${el.y + 25} ${el.x + 20},${el.y + 15} ${el.x - 20},${el.y + 15}" ${attrs} />`;
            } else if (el.type === 'image' && el.src) {
                svg += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" opacity="${el.opacity != null ? el.opacity : 1}" />`;
            }
        });
        svg += `</svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.download = fileName; link.href = url;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url); setIsExportMenuOpen(false);
    };

    const sel = elements.find(el => el.id === selectedId);

    return (
        <div className="create-page-container">
            {/* ===== TOPBAR ===== */}
            <header className="create-topbar">
                <div className="topbar-left">
                    <button className="icon-btn" onClick={() => navigate('/templates')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18L9 12L15 6" /></svg>
                    </button>
                    <span className="back-label">Back to My Templates</span>
                </div>

                <div className="topbar-center">
                    <input className="file-name-input" value={designName} onChange={(e) => setDesignName(e.target.value)} placeholder="Untitled Template" onFocus={() => selectShape(null)} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', marginLeft: -8 }}>
                        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>

                    <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" /></svg>
                        </button>
                        <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" /></svg>
                        </button>
                    </div>
                </div>

                <div className="topbar-right">
                    {selectedId && (
                        <button className="icon-btn danger-text" onClick={deleteSelected} title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                            </svg>
                        </button>
                    )}
                    <div className="export-wrapper">
                        <button className="action-btn" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
                            Export (SVG/PNG)
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5 5 5-5z" /></svg>
                        </button>
                        {isExportMenuOpen && (
                            <div className="export-dropdown">
                                <div className="export-option" onClick={() => downloadImage('svg')}>Download SVG</div>
                                <div className="export-option" onClick={() => downloadImage('png')}>Download PNG</div>
                            </div>
                        )}
                    </div>
                    <button className="action-btn primary" onClick={handleSave}>Save Template</button>
                </div>
            </header>

            {/* ===== MAIN AREA ===== */}
            <div className="create-main">
                {/* Left Sidebar */}
                <aside className="create-sidebar">
                    <div className="sidebar-section-label">Insert</div>

                    <div className="sidebar-item" onClick={() => addText()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
                        <span>Text</span>
                    </div>

                    <div className={`sidebar-item ${isElementsMenuOpen ? 'active' : ''}`} onClick={() => setIsElementsMenuOpen(!isElementsMenuOpen)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><circle cx="17.5" cy="6.5" r="3.5" /><path d="M14 14l3.5 7 3.5-7z" /></svg>
                        <span>Shapes</span>
                    </div>

                    <div className="sidebar-item" onClick={() => { setIsElementsMenuOpen(false); fileInputRef.current && fileInputRef.current.click(); }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
                        <span>Uploads</span>
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/svg+xml,.svg" style={{ display: 'none' }} onChange={handleImageUpload} />

                    <div className="sidebar-divider" />
                    <div className="sidebar-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Variables
                        <button
                            style={{ background: 'none', border: 'none', color: '#1A73E8', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => {
                                const newVar = window.prompt("Enter new variable name (e.g. date, award_title):");
                                if (newVar && newVar.trim() !== '' && !templateVars.includes(newVar.trim())) {
                                    setTemplateVars([...templateVars, newVar.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')]);
                                }
                            }}
                        >+ Add</button>
                    </div>

                    {templateVars.map(v => (
                        <div key={v} className="var-pill">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }} onClick={() => addVariable(v)}>
                                <span className="var-pill-icon">{'{}'}</span>
                                <span>{v}</span>
                            </div>
                            <span
                                style={{ marginLeft: 'auto', color: '#9CA3AF', cursor: 'pointer', padding: '0 4px', fontSize: '14px', lineHeight: 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTemplateVars(templateVars.filter(tv => tv !== v));
                                }}
                            >&times;</span>
                        </div>
                    ))}

                    <div className="sidebar-divider" />
                    <div className="sidebar-section-label">Layers</div>
                    <div className="layers-list">
                        {elements.length === 0 && <div className="layers-empty">No elements</div>}
                        {[...elements].reverse().map((el, ri) => (
                            <div key={el.id} className={`layer-item ${el.id === selectedId ? 'active' : ''}`} onClick={() => selectShape(el.id)}>
                                <span className="layer-icon">{getLayerIcon(el.type)}</span>
                                <span className="layer-name">{getLayerLabel(el)}</span>
                                <span className="layer-index">{elements.length - ri}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Shapes Popup */}
                {isElementsMenuOpen && (
                    <div className="shapes-menu-panel">
                        <div className="shapes-menu-header">Filled Shapes</div>
                        <div className="shapes-grid">
                            <div className="shape-btn" onClick={() => addShape('rect', true)} title="Rectangle"><div className="shape-icon-rect filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('circle', true)} title="Circle"><div className="shape-icon-circle filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('triangle', true)} title="Triangle"><div className="shape-icon-triangle filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('star', true)} title="Star"><div className="shape-icon-star filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('pentagon', true)} title="Pentagon"><div className="shape-icon-pentagon filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('hexagon', true)} title="Hexagon"><div className="shape-icon-hexagon filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('diamond', true)} title="Diamond"><div className="shape-icon-diamond filled" /></div>
                            <div className="shape-btn" onClick={() => addShape('arrow', true)} title="Arrow"><div className="shape-icon-arrow filled" /></div>
                        </div>
                        <div className="shapes-menu-header" style={{ marginTop: 12 }}>Outline Shapes</div>
                        <div className="shapes-grid">
                            <div className="shape-btn" onClick={() => addShape('rect', false)} title="Rectangle"><div className="shape-icon-rect" /></div>
                            <div className="shape-btn" onClick={() => addShape('circle', false)} title="Circle"><div className="shape-icon-circle" /></div>
                            <div className="shape-btn" onClick={() => addShape('triangle', false)} title="Triangle"><div className="shape-icon-triangle" /></div>
                            <div className="shape-btn" onClick={() => addShape('star', false)} title="Star"><div className="shape-icon-star" /></div>
                            <div className="shape-btn" onClick={() => addShape('pentagon', false)} title="Pentagon"><div className="shape-icon-pentagon" /></div>
                            <div className="shape-btn" onClick={() => addShape('hexagon', false)} title="Hexagon"><div className="shape-icon-hexagon" /></div>
                            <div className="shape-btn" onClick={() => addShape('diamond', false)} title="Diamond"><div className="shape-icon-diamond" /></div>
                            <div className="shape-btn" onClick={() => addShape('arrow', false)} title="Arrow"><div className="shape-icon-arrow" /></div>
                        </div>
                        <div className="shapes-menu-header" style={{ marginTop: 12 }}>Other</div>
                        <div className="shapes-grid">
                            <div className="shape-btn" onClick={() => addShape('line', true)} title="Line"><div className="shape-icon-line" /></div>
                        </div>
                        <div className="elements-divider" style={{ margin: '16px 0', borderTop: '1px solid #E8EAED' }}></div>
                        <button
                            className="btn-upload-image"
                            style={{ width: '100%', padding: '10px', background: '#F8F9FA', border: '1px dashed #DADCE0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1A73E8', fontWeight: 500, transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FA'}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                            Upload Image
                        </button>
                    </div>
                )}

                {/* Canvas */}
                <main className="create-workspace" style={{ position: 'relative' }}>
                    <div className="canvas-wrapper" style={{ position: 'relative' }}>
                        <Stage width={stageWidth} height={stageHeight} className="konva-stage" ref={stageRef} onMouseDown={checkDeselect} onTouchStart={checkDeselect}>
                            <Layer>
                                <Rect x={0} y={0} id="bg" width={stageWidth} height={stageHeight} fill="#ffffff" cornerRadius={10} shadowColor="#000" shadowBlur={10} shadowOpacity={0.1} shadowOffsetY={4} />
                                {elements.map((el, i) => (
                                    <ElementComponent key={el.id} shapeProps={el} isSelected={el.id === selectedId}
                                        onSelect={() => selectShape(el.id)}
                                        onChange={(newAttrs) => { const copy = elements.slice(); copy[i] = newAttrs; setElements(copy); }}
                                        onDoubleClick={handleTextDoubleClick}
                                    />
                                ))}
                            </Layer>
                        </Stage>

                        {editingTextNode && (
                            <textarea value={editingTextNode.text}
                                onChange={(e) => setEditingTextNode({ ...editingTextNode, text: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) finishTextEdit(); }}
                                onBlur={finishTextEdit} autoFocus
                                style={{
                                    position: 'absolute', top: editingTextNode.y, left: editingTextNode.x,
                                    width: Math.max(150, editingTextNode.width), height: Math.max(editingTextNode.fontSize * 1.5, editingTextNode.height + 20),
                                    fontSize: editingTextNode.fontSize, fontFamily: editingTextNode.fontFamily || 'sans-serif',
                                    textAlign: editingTextNode.align || 'left', border: '2px solid #4285F4',
                                    padding: 0, margin: 0, background: 'rgba(255,255,255,0.95)', outline: 'none',
                                    resize: 'none', lineHeight: 1, color: editingTextNode.color,
                                    transformOrigin: 'left top', zIndex: 100, borderRadius: 4
                                }}
                            />
                        )}
                    </div>
                </main>

                {/* Right Properties Panel */}
                <div className="properties-panel">
                    <div className="properties-header">Properties</div>
                    <div className="prop-divider" />

                    {sel ? (
                        <>
                            {/* Image-specific properties */}
                            {sel.type === 'image' && (
                                <>
                                    <div className="prop-row">
                                        <div className="prop-label">File</div>
                                        <div style={{ fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>{sel.fileName || 'Uploaded image'}</div>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-label">Format</div>
                                        <span className="img-format-badge">{(sel.imgFormat || 'png').toUpperCase()}</span>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-label">Size</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <input type="number" className="prop-number" style={{ width: '50%' }} value={Math.round(sel.width)} onChange={(e) => handlePropertyChange('width', parseInt(e.target.value) || 10)} placeholder="W" />
                                            <input type="number" className="prop-number" style={{ width: '50%' }} value={Math.round(sel.height)} onChange={(e) => handlePropertyChange('height', parseInt(e.target.value) || 10)} placeholder="H" />
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* Fill Toggle — for shapes only (not text, line, or image) */}
                            {sel.type !== 'text' && sel.type !== 'line' && sel.type !== 'image' && (
                                <div className="prop-row">
                                    <div className="prop-label">Style</div>
                                    <div className="align-group">
                                        <button className={`align-btn ${sel.filled !== false ? 'active' : ''}`} onClick={() => handlePropertyChange('filled', true)}>Filled</button>
                                        <button className={`align-btn ${sel.filled === false ? 'active' : ''}`} onClick={() => handlePropertyChange('filled', false)}>Outline</button>
                                    </div>
                                </div>
                            )}
                            {/* Color — not for images */}
                            {sel.type !== 'image' && (
                                <div className="prop-row">
                                    <div className="prop-label">{sel.filled === false ? 'Stroke Color' : 'Color'}</div>
                                    <div className="prop-row-inline" style={{ padding: 0 }}>
                                        <input type="color" className="color-picker" value={sel.fill} onChange={(e) => handlePropertyChange('fill', e.target.value)} />
                                        <input className="color-hex" style={{ width: '67.6px' }} value={sel.fill} onChange={(e) => handlePropertyChange('fill', e.target.value)} />
                                    </div>
                                </div>
                            )}
                            {/* Stroke Width — for outline shapes */}
                            {sel.filled === false && sel.type !== 'image' && (
                                <div className="prop-row">
                                    <div className="prop-label">Stroke Width</div>
                                    <input type="number" className="prop-number" min="1" max="20" value={sel.strokeWidth || 2} onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value) || 2)} />
                                </div>
                            )}

                            {sel.type === 'text' && (
                                <>
                                    <div className="prop-divider" />
                                    <div className="prop-row">
                                        <div className="prop-label">Font Family</div>
                                        <select className="prop-select" value={sel.fontFamily || 'sans-serif'} onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}>
                                            <option value="sans-serif">Sans-serif</option>
                                            <option value="serif">Serif</option>
                                            <option value="monospace">Monospace</option>
                                            <option value="Inter">Inter</option>
                                            <option value="Roboto">Roboto</option>
                                            <option value="Comic Sans MS">Comic Sans</option>
                                        </select>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-label">Font Size</div>
                                        <input type="number" className="prop-number" value={Math.round(sel.fontSize)} onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 12)} />
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-label">Text Style</div>
                                        <div className="align-group">
                                            <button className={`align-btn style-toggle ${(sel.fontStyle || '').includes('bold') ? 'active' : ''}`} onClick={() => { const cur = sel.fontStyle || 'normal'; const isBold = cur.includes('bold'); const isItalic = cur.includes('italic'); handlePropertyChange('fontStyle', isBold ? (isItalic ? 'italic' : 'normal') : (isItalic ? 'bold italic' : 'bold')); }} title="Bold"><strong>B</strong></button>
                                            <button className={`align-btn style-toggle ${(sel.fontStyle || '').includes('italic') ? 'active' : ''}`} onClick={() => { const cur = sel.fontStyle || 'normal'; const isBold = cur.includes('bold'); const isItalic = cur.includes('italic'); handlePropertyChange('fontStyle', isItalic ? (isBold ? 'bold' : 'normal') : (isBold ? 'bold italic' : 'italic')); }} title="Italic"><em>I</em></button>
                                            <button className={`align-btn style-toggle ${(sel.textDecoration || '').includes('underline') ? 'active' : ''}`} onClick={() => { const cur = sel.textDecoration || ''; const hasU = cur.includes('underline'); const hasS = cur.includes('line-through'); handlePropertyChange('textDecoration', hasU ? (hasS ? 'line-through' : '') : (hasS ? 'underline line-through' : 'underline')); }} title="Underline"><span style={{ textDecoration: 'underline' }}>U</span></button>
                                            <button className={`align-btn style-toggle ${(sel.textDecoration || '').includes('line-through') ? 'active' : ''}`} onClick={() => { const cur = sel.textDecoration || ''; const hasU = cur.includes('underline'); const hasS = cur.includes('line-through'); handlePropertyChange('textDecoration', hasS ? (hasU ? 'underline' : '') : (hasU ? 'underline line-through' : 'line-through')); }} title="Strikethrough"><span style={{ textDecoration: 'line-through' }}>S</span></button>
                                        </div>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-label">Alignment</div>
                                        <div className="align-group">
                                            <button className={`align-btn ${sel.align === 'left' ? 'active' : ''}`} onClick={() => handlePropertyChange('align', 'left')}>L</button>
                                            <button className={`align-btn ${sel.align === 'center' ? 'active' : ''}`} onClick={() => handlePropertyChange('align', 'center')}>C</button>
                                            <button className={`align-btn ${sel.align === 'right' ? 'active' : ''}`} onClick={() => handlePropertyChange('align', 'right')}>R</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="prop-divider" />
                            <div className="prop-row">
                                <div className="prop-label">Opacity</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="range" min="0" max="1" step="0.05" className="opacity-slider" value={sel.opacity != null ? sel.opacity : 1} onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))} />
                                    <span style={{ fontSize: 12, color: '#6B7280', minWidth: 32 }}>{Math.round((sel.opacity != null ? sel.opacity : 1) * 100)}%</span>
                                </div>
                            </div>
                            <div className="prop-divider" />
                            <div className="prop-row">
                                <div className="prop-label">Layer Order</div>
                                <div className="layer-controls">
                                    <button className="layer-ctrl-btn" onClick={sendToBack} title="Send to Back">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 18l5 5 5-5" /><path d="M12 23V7" /><path d="M3 3h18" /></svg>
                                    </button>
                                    <button className="layer-ctrl-btn" onClick={moveDown} title="Move Down">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 13l5 5 5-5" /><path d="M12 18V2" /></svg>
                                    </button>
                                    <button className="layer-ctrl-btn" onClick={moveUp} title="Move Up">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 11l-5-5-5 5" /><path d="M12 6v16" /></svg>
                                    </button>
                                    <button className="layer-ctrl-btn" onClick={bringToFront} title="Bring to Front">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 6l-5-5-5 5" /><path d="M12 1v16" /><path d="M3 21h18" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="prop-divider" />
                            <div className="prop-row">
                                <div className="prop-label">Position</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="number" className="prop-number" style={{ width: '50%' }} value={Math.round(sel.x)} onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)} placeholder="X" />
                                    <input type="number" className="prop-number" style={{ width: '50%' }} value={Math.round(sel.y)} onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)} placeholder="Y" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="properties-empty">Select an element on the canvas to view its properties.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePage;
