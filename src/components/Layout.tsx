import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'EPLQ' }) => {
    const { user, userProfile, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            logger.error('Logout failed:', error as Error);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            
        </div>
    )
}