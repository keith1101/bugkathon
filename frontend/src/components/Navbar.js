import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileIcon from './ProfileIcon';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('current_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link
                    to="/generator"
                    className={`navbar-link${location.pathname === '/' || location.pathname === '/generator' ? ' active' : ''}`}
                >
                    Generator
                </Link>
                <Link to="/create" className={`navbar-link${location.pathname === '/create' ? ' active' : ''}`}>
                    Create New
                </Link>
                <Link to="/templates" className={`navbar-link${location.pathname === '/templates' ? ' active' : ''}`}>
                    My Templates
                </Link>
            </div>
            <div className="navbar-right">
                {user ? (
                    <ProfileIcon />
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn btn-primary">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
