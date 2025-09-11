import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        document.title = title;
    }, [title]);

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
            {/* Navigation Header */}
            <nav className="bg-white/90 background-blur-md shadow-soft border-b border-blue-100 stricky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m4-4h1m-1 4h1M9 16h6" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    EPLQ
                                </h1>
                                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Empowering Personal Legal Queries</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2">
                            <Link to="/" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive('/')
                                    ? 'bg-blue-100 text-blue-700 shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                            >
                                Home
                            </Link>
                            {user && userProfile?.role === 'admin' && (
                                <Link 
                                    to="/AdminDashboard"
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive('/AdminDashboard')
                                            ? 'bg-blue-100 text-blue-700 shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                            
                            {user ? (
                                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-700 hidden xl:block">
                                            {userProfile?.displayName || user?.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
                            <div className="px-4 py-3 space-y-2">
                                <Link
                                    to="/"
                                    className={`block px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive('/')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Home
                                </Link>
                                
                                {user && userProfile?.role === 'admin' && (
                                    <Link
                                        to="/AdminDashboard"
                                        className={`block px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive('/AdminDashboard')
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}

                                {user ? (
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-center space-x-3 px-4 py-2">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">
                                                    {user?.email?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-700">
                                                {userProfile?.displayName || user?.email}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-all duration-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t border-gray-200 space-y-2">
                                        <Link
                                            to="/login"
                                            className="block px-4 py-2 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-center"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};