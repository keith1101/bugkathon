import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePage from './pages/CreatePage'; // added CreatePage
import GeneratorPage from './pages/GeneratorPage';
import './App.css';
import MyTemplates from './pages/MyTemplates';
import ProfilePage from './pages/ProfilePage';
import AuthRoute from './components/AuthRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<AuthRoute><CreatePage /></AuthRoute>} />
        <Route path="/generator" element={<AuthRoute><GeneratorPage /></AuthRoute>} />
        <Route path="/templates" element={<AuthRoute><MyTemplates /></AuthRoute>} />
        <Route path="/profile" element={<AuthRoute><ProfilePage /></AuthRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
