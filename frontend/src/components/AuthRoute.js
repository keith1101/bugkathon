import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }) => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('current_user');

    if (!currentUser) {
        // If not logged in, redirect to login page replacing the history state
        return <Navigate to="/login" replace />;
    }

    // If logged in, render the protected component
    return children;
};

export default AuthRoute;
