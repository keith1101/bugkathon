import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'Student'
    });

    // Status messages (success/error)
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Load current user from local storage
        const currentUserData = localStorage.getItem('current_user');
        if (currentUserData) {
            try {
                const parsedUser = JSON.parse(currentUserData);
                setUser((prev) => ({
                    ...prev,
                    fullName: parsedUser.fullName || '',
                    email: parsedUser.email || '',
                    password: parsedUser.password || '',
                    role: parsedUser.role || 'Student'
                }));
            } catch (e) {
                console.error("Could not parse current user info");
            }
        } else {
            // Not logged in, redirect to login page
            navigate('/login');
        }
    }, [navigate]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleSignOut = () => {
        localStorage.removeItem('current_user');
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {

            // --- BACKEND INTEGRATION PLACEHOLDER ---
            /*
            try {
                // Example API endpoint to delete user account
                const response = await fetch('https://api.bugkathon.com/users/delete', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}` // Or your preferred auth header
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to delete account on the server.");
                }
            } catch (error) {
                console.error("API Error:", error);
                setMessage({ type: 'error', text: 'Failed to delete account from server.' });
                return;
            }
            */
            // ---------------------------------------

            // Remove from mock_users
            const mockUsersStr = localStorage.getItem('mock_users');
            if (mockUsersStr) {
                try {
                    let mockUsers = JSON.parse(mockUsersStr);
                    mockUsers = mockUsers.filter(u => u.email !== user.email);
                    localStorage.setItem('mock_users', JSON.stringify(mockUsers));
                } catch (e) {
                    console.error('Error updating mock_users:', e);
                }
            }

            // Sign out
            handleSignOut();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (!user.fullName || !user.email) {
            setMessage({ type: 'error', text: 'Name and Email are required.' });
            return;
        }

        // 1. Update current_user
        localStorage.setItem('current_user', JSON.stringify(user));

        // 2. Update mock_users array
        const mockUsersStr = localStorage.getItem('mock_users');
        if (mockUsersStr) {
            try {
                let mockUsers = JSON.parse(mockUsersStr);
                const userIndex = mockUsers.findIndex(u => u.email === user.email);
                if (userIndex !== -1) {
                    mockUsers[userIndex] = user;
                } else {
                    // It shouldn't get here typically unless they changed their email to something completely new, 
                    // but we will just add them as a fallback.
                    mockUsers.push(user);
                }
                localStorage.setItem('mock_users', JSON.stringify(mockUsers));
            } catch (e) {
                console.error('Error updating mock_users:', e);
            }
        }

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
    };

    // Helper for initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="profile-header-left" onClick={handleBack} style={{ cursor: 'pointer' }}>
                    <div className="home-logo-icon" style={{ width: '40px', height: '40px' }}>
                        <img src="/assets/bugkathon_logo.svg" alt="Bugkathon Logo" style={{ width: "100%", height: "100%" }} />
                    </div>
                    <span style={{ fontSize: '15px', color: '#5F6368', fontWeight: 500 }}>&larr; Back</span>
                </div>
                <h1 className="profile-header-title">Bugkathon</h1>
                <div style={{ width: 100 }}></div> {/* spacer */}
            </header>

            <main className="profile-content">
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-titles">
                            <h2>Profile Settings</h2>
                            <p>Manage your account configuration</p>
                        </div>
                        <div className="profile-avatar-section">
                            <div className="profile-avatar-large">
                                {getInitials(user.fullName)}
                            </div>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSave}>
                        <div className="profile-form-group">
                            <label className="profile-form-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                className="profile-form-input"
                                value={user.fullName}
                                onChange={handleChange}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="profile-form-group">
                            <label className="profile-form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="profile-form-input"
                                value={user.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                disabled // we typically don't let them change email easily, or we do. Let's let them for the mock.
                            />
                        </div>

                        <div className="profile-form-group">
                            <label className="profile-form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="profile-form-input"
                                value={user.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="profile-form-group">
                            <label className="profile-form-label">Account Role</label>
                            <select
                                name="role"
                                className="profile-form-select"
                                value={user.role}
                                onChange={handleChange}
                            >
                                <option value="Student">Student</option>
                                <option value="Core Team">Core Team</option>
                                <option value="Organizer">Organizer</option>
                            </select>
                        </div>

                        {message && (
                            <div className={`profile-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="profile-actions">
                            <button type="button" className="btn-signout" onClick={handleSignOut}>
                                Sign Out
                            </button>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-delete-account" onClick={handleDeleteAccount}>
                                    Delete Account
                                </button>
                                <button type="submit" className="btn-save-profile">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
