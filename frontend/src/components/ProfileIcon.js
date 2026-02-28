import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileIcon = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('current_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    if (user) {
        return (
            <div
                style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#1A73E8', color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                    userSelect: 'none'
                }}
                onClick={() => navigate('/profile')}
                title="Profile Settings"
            >
                {getInitials(user.fullName)}
            </div>
        );
    }

    return (
        <div
            style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#E8EAED', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
            }}
            onClick={() => navigate('/login')}
            title="Sign In"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#9AA0A6"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
        </div>
    );
};

export default ProfileIcon;
