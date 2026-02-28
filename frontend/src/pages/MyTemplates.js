import React, { useState, useEffect } from 'react';
import './MyTemplates.css';
import { useNavigate } from 'react-router-dom';
import ProfileIcon from '../components/ProfileIcon';
import { STORAGE_KEYS } from '../constants';

// Default template data for display (Fallback)
const defaultTemplates = [
  {
    id: 1,
    title: 'Hackathon Participation',
    lastEdited: 'Just now',
    variables: ['name', 'date', 'role'],
    elements: [
      { id: 'bg', type: 'rect', x: 20, y: 20, width: 760, height: 460, fill: '#FAFAFA', stroke: '#1A73E8', strokeWidth: 4, opacity: 1 },
      { id: 'border_inner', type: 'rect', x: 35, y: 35, width: 730, height: 430, fill: 'transparent', stroke: '#E8EAED', strokeWidth: 2, opacity: 1 },
      { id: 'title', type: 'text', x: 0, y: 80, width: 800, text: 'CERTIFICATE OF PARTICIPATION', fontSize: 32, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },
      { id: 'presented', type: 'text', x: 0, y: 140, width: 800, text: 'This certificate is proudly presented to', fontSize: 16, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'italic', textDecoration: '', opacity: 1 },
      { id: 'name_var', type: 'text', x: 0, y: 190, width: 800, text: '{{name}}', fontSize: 44, fontFamily: 'Times New Roman', fill: '#1A73E8', align: 'center', fontStyle: 'bold italic', textDecoration: '', opacity: 1 },
      { id: 'reason', type: 'text', x: 0, y: 270, width: 800, text: 'For outstanding effort and participation as a', fontSize: 16, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'role_var', type: 'text', x: 0, y: 300, width: 800, text: '{{role}}', fontSize: 22, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },
      { id: 'date_var', type: 'text', x: 100, y: 380, width: 200, text: '{{date}}', fontSize: 16, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'date_line', type: 'line', x: 100, y: 410, width: 200, height: 2, fill: '#BDC1C6', filled: true },
      { id: 'date_label', type: 'text', x: 100, y: 420, width: 200, text: 'Date', fontSize: 12, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'sig_var', type: 'text', x: 500, y: 380, width: 200, text: 'GDGoC Organizer', fontSize: 16, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'italic', textDecoration: '', opacity: 1 },
      { id: 'sig_line', type: 'line', x: 500, y: 410, width: 200, height: 2, fill: '#BDC1C6', filled: true },
      { id: 'sig_label', type: 'text', x: 500, y: 420, width: 200, text: 'Signature', fontSize: 12, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'star_icon', type: 'star', x: 400, y: 390, radius: 25, innerRadius: 10, fill: '#FBBC04', strokeWidth: 0, opacity: 1 }
    ]
  },
  {
    id: 2,
    title: 'Modern Tech Badge',
    lastEdited: 'Just now',
    variables: ['name', 'event_name'],
    elements: [
      { id: 'bg', type: 'rect', x: 0, y: 0, width: 800, height: 500, fill: '#0B0F19', strokeWidth: 0, opacity: 1 },
      { id: 'accent_blob', type: 'circle', x: 800, y: 0, radius: 250, fill: '#1A73E8', strokeWidth: 0, opacity: 0.2 },
      { id: 'accent_blob2', type: 'circle', x: 0, y: 500, radius: 200, fill: '#EA4335', strokeWidth: 0, opacity: 0.15 },
      { id: 'header', type: 'text', x: 50, y: 80, width: 700, text: '{{event_name}}', fontSize: 28, fontFamily: 'Arial', fill: '#34A853', align: 'left', fontStyle: 'bold', textDecoration: '', opacity: 1 },
      { id: 'sub', type: 'text', x: 50, y: 130, width: 700, text: 'OFFICIAL ATTENDEE BADGE', fontSize: 42, fontFamily: 'Arial', fill: '#FFFFFF', align: 'left', fontStyle: 'bold', textDecoration: '', opacity: 1 },
      { id: 'divider', type: 'line', x: 50, y: 200, width: 100, height: 4, fill: '#FBBC04', filled: true },
      { id: 'name_label', type: 'text', x: 50, y: 240, width: 700, text: 'GRANTED TO', fontSize: 14, fontFamily: 'Arial', fill: '#9AA0A6', align: 'left', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'name_var', type: 'text', x: 50, y: 270, width: 700, text: '{{name}}', fontSize: 56, fontFamily: 'Arial', fill: '#F8F9FA', align: 'left', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'tech_poly', type: 'triangle', x: 650, y: 350, radius: 80, fill: 'transparent', stroke: '#1A73E8', strokeWidth: 6, opacity: 0.4 }
    ]
  },
  {
    id: 3,
    title: 'Minimalist Award',
    lastEdited: 'Just now',
    variables: ['name', 'award_title'],
    elements: [
      { id: 'bg', type: 'rect', x: 0, y: 0, width: 800, height: 500, fill: '#FFFFFF', strokeWidth: 0, opacity: 1 },
      { id: 'top_bar', type: 'rect', x: 0, y: 0, width: 800, height: 20, fill: '#EA4335', strokeWidth: 0, opacity: 1 },
      { id: 'bottom_bar', type: 'rect', x: 0, y: 480, width: 800, height: 20, fill: '#34A853', strokeWidth: 0, opacity: 1 },
      { id: 'title', type: 'text', x: 0, y: 150, width: 800, text: '{{award_title}}', fontSize: 36, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'bold', textDecoration: 'underline', opacity: 1 },
      { id: 'awarded_to', type: 'text', x: 0, y: 230, width: 800, text: 'AWARDED TO', fontSize: 14, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'name_var', type: 'text', x: 0, y: 260, width: 800, text: '{{name}}', fontSize: 40, fontFamily: 'Times New Roman', fill: '#1A73E8', align: 'center', fontStyle: 'italic', textDecoration: '', opacity: 1 },
      { id: 'deco_diamond', type: 'diamond', x: 400, y: 80, radius: 20, fill: '#FBBC04', strokeWidth: 0, opacity: 1 }
    ]
  },
  {
    id: 4,
    title: 'GDGoC FPTU Certificate',
    lastEdited: 'Just now',
    variables: ['name', 'event_name', 'date'],
    elements: [
      { id: 'bg', type: 'rect', x: 0, y: 0, width: 800, height: 500, fill: '#FFFFFF', stroke: '#E3E3E3', strokeWidth: 8, opacity: 1 },

      { id: 'bg_circle_blue', type: 'circle', x: 0, y: 500, radius: 250, fill: '#4285F4', strokeWidth: 0, opacity: 0.1 },
      { id: 'bg_circle_red', type: 'circle', x: 800, y: 0, radius: 300, fill: '#DB4437', strokeWidth: 0, opacity: 0.08 },
      { id: 'bg_circle_yellow', type: 'circle', x: 0, y: 0, radius: 150, fill: '#F4B400', strokeWidth: 0, opacity: 0.15 },
      { id: 'bg_circle_green', type: 'circle', x: 800, y: 500, radius: 200, fill: '#0F9D58', strokeWidth: 0, opacity: 0.1 },

      { id: 'top_left_blue', type: 'rect', x: 0, y: 0, width: 150, height: 20, fill: '#4285F4', strokeWidth: 0, opacity: 1 },
      { id: 'top_left_red', type: 'rect', x: 150, y: 0, width: 100, height: 20, fill: '#DB4437', strokeWidth: 0, opacity: 1 },
      { id: 'top_left_yellow', type: 'rect', x: 250, y: 0, width: 80, height: 20, fill: '#F4B400', strokeWidth: 0, opacity: 1 },
      { id: 'top_left_green', type: 'rect', x: 330, y: 0, width: 120, height: 20, fill: '#0F9D58', strokeWidth: 0, opacity: 1 },

      { id: 'fptu_orange_bar', type: 'rect', x: 600, y: 0, width: 200, height: 20, fill: '#F27024', strokeWidth: 0, opacity: 1 },

      { id: 'org_name', type: 'text', x: 40, y: 60, width: 720, text: 'Google Developer Groups On Campus', fontSize: 24, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },
      { id: 'uni_name', type: 'text', x: 40, y: 90, width: 720, text: 'FPT University', fontSize: 18, fontFamily: 'Arial', fill: '#F27024', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },

      { id: 'title', type: 'text', x: 0, y: 150, width: 800, text: 'CERTIFICATE OF APPRECIATION', fontSize: 32, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },

      { id: 'presented', type: 'text', x: 0, y: 210, width: 800, text: 'This is proudly presented to', fontSize: 16, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'italic', textDecoration: '', opacity: 1 },

      { id: 'name_var', type: 'text', x: 0, y: 250, width: 800, text: '{{name}}', fontSize: 48, fontFamily: 'Times New Roman', fill: '#4285F4', align: 'center', fontStyle: 'bold italic', textDecoration: '', opacity: 1 },

      { id: 'reason', type: 'text', x: 0, y: 330, width: 800, text: 'in recognition of their active participation and contribution to', fontSize: 16, fontFamily: 'Arial', fill: '#5F6368', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },

      { id: 'event_var', type: 'text', x: 0, y: 360, width: 800, text: '{{event_name}}', fontSize: 22, fontFamily: 'Arial', fill: '#DB4437', align: 'center', fontStyle: 'bold', textDecoration: '', opacity: 1 },

      { id: 'date_var', type: 'text', x: 100, y: 430, width: 200, text: '{{date}}', fontSize: 16, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'normal', textDecoration: '', opacity: 1 },
      { id: 'date_line', type: 'line', x: 100, y: 460, width: 200, height: 2, fill: '#BDC1C6', filled: true },

      { id: 'sig_var', type: 'text', x: 500, y: 430, width: 200, text: 'GDGoC FPTU Lead', fontSize: 16, fontFamily: 'Arial', fill: '#202124', align: 'center', fontStyle: 'italic', textDecoration: '', opacity: 1 },
      { id: 'sig_line', type: 'line', x: 500, y: 460, width: 200, height: 2, fill: '#BDC1C6', filled: true }
    ]
  }
];

const MyTemplates = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTemplates = templates.filter((template) =>
    (template.title || '').toLowerCase().includes(normalizedQuery)
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (stored && stored !== '[]') {
        setTemplates(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(defaultTemplates));
        setTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(defaultTemplates);
    }
  }, []);

  const saveToStorage = (newTemplates) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // Toggle dropdown menu (Edit, Duplicate, Delete)
  const toggleMenu = (id) => {
    if (activeMenu === id) {
      setActiveMenu(null);
    } else {
      setActiveMenu(id);
    }
  };

  const duplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      title: `${template.title} (Copy)`,
      lastEdited: 'Just now'
    };
    saveToStorage([newTemplate, ...templates]);
    setActiveMenu(null);
  };

  const deleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const newTemplates = templates.filter(t => t.id !== id);
      saveToStorage(newTemplates);
      setActiveMenu(null);
    }
  };

  return (
    <div className="my-templates-container">
      <nav className="top-navbar">
        <div className="nav-logo" style={{ background: 'none', padding: 0, width: '40px' }}>
          <div className="home-logo-icon" style={{ width: '40px', height: '40px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/assets/bugkathon_logo.svg" alt="Bugkathon Logo" style={{ width: "100%", height: "100%" }} className="bugkathon-logo" />
          </div>
        </div>
        <h1 className="nav-title">Bugkathon</h1>
        <div className="nav-avatar" style={{ background: 'none', padding: 0 }}>
          <ProfileIcon />
        </div>
      </nav>

      <main className="main-content">
        {/* Tiêu đề & Công cụ tìm kiếm/tạo mới */}
        <header className="page-header">
          <div className="header-titles">
            <h2>My Templates</h2>
            <p>Manage and reuse your certificate designs.</p>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.0961 17.4388C14.1513 17.4388 17.4387 14.1514 17.4387 10.0962C17.4387 6.04091 14.1513 2.75349 10.0961 2.75349C6.04084 2.75349 2.75342 6.04091 2.75342 10.0962C2.75342 14.1514 6.04084 17.4388 10.0961 17.4388Z" stroke="#99A1AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M19.2743 19.2745L15.3276 15.3278" stroke="#99A1AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="btn-ghost" onClick={() => {
              if (window.confirm("This will erase any custom templates and restore the 4 default designs. Continue?")) {
                localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(defaultTemplates));
                setTemplates(defaultTemplates);
              }
            }} style={{ marginRight: '12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
              Reset to Defaults
            </button>
            <button className="btn-primary" onClick={() => navigate('/create')}>
              <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.58936 11.014H17.439" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M11.0142 4.58916V17.4388" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              Create New Template
            </button>
          </div>
        </header>

        {/* Danh sách các mẫu (Grid) */}
        <div className="template-grid">
          {filteredTemplates.length === 0 && (
            <div className="templates-empty">No templates match your search.</div>
          )}
          {filteredTemplates.map((template) => (
            <div className="template-card" key={template.id}>
              <div
                className="card-preview"
                onClick={() => navigate(`/create?id=${template.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="preview-placeholder">
                  <div className="mock-document"></div>
                  <span>Certificate Preview</span>
                </div>
              </div>

              <div className="card-footer">
                <div className="card-info">
                  <h3>{template.name}</h3>
                  <p>{template.created_at ? new Date(template.created_at).toLocaleDateString() : ''}</p>
                </div>

                <div className="card-menu-wrapper">
                  <button className="btn-menu" onClick={() => toggleMenu(template.id)}>
                    <svg width="24" height="24" viewBox="0 0 34 34" fill="none">
                      <g opacity="0.6">
                        <circle cx="16.5" cy="10.5" r="1.5" fill="black" />
                        <circle cx="16.5" cy="16.5" r="1.5" fill="black" />
                        <circle cx="16.5" cy="22.5" r="1.5" fill="black" />
                      </g>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === template.id && (
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => navigate(`/create?id=${template.id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                      </button>
                      <button className="dropdown-item" onClick={() => duplicateTemplate(template)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Duplicate
                      </button>
                      <button className="dropdown-item text-danger" onClick={() => deleteTemplate(template.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        <span style={{ color: '#EA4335' }}>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MyTemplates;