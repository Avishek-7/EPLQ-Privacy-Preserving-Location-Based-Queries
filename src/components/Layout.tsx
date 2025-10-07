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
            logger.error('Layout', 'Logout failed', error as Error);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden flex flex-col">
            {/* Background decorative elements */}
            <div className="absolute top-10 left-10 w-60 h-60 bg-emerald-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl"></div>
            
            {/* Navigation Header */}
            <nav className="relative z-10 bg-white/80 backdrop-blur-lg border-b-2 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all duration-200">
                                <span className="text-black text-xl font-black">E</span>
                            </div>
                            <div>
                                <h1 className="text-xl lg:text-2xl font-black text-black tracking-tight">
                                    EPLQ
                                </h1>
                                <p className="text-xs text-gray-700 font-medium -mt-1 hidden sm:block uppercase tracking-wider">Empowering Personal Legal Queries</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2">
                            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all duration-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                                isActive('/')
                                    ? 'bg-emerald-400 text-black'
                                    : 'bg-white text-black hover:bg-emerald-100'
                                }`}
                            >
                                🏠 Home
                            </Link>
                            {user && userProfile?.role === 'admin' && (
                                <Link 
                                    to="/admin"
                                    className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all duration-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                                        isActive('/admin')
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-white text-black hover:bg-emerald-100'
                                        }`}
                                >
                                    ⚙️ Admin
                                </Link>
                            )}
                            
                            {user ? (
                                <div className="flex items-center space-x-3 ml-4 pl-4 border-l-2 border-black">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-10 h-10 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                                            <span className="text-black text-sm font-black">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-black font-medium hidden xl:block">
                                            {userProfile?.displayName || user?.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-400 text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-red-300 transition-all duration-200 uppercase tracking-wide"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 ml-4 pl-4 border-l-2 border-black">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 bg-white text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-gray-100 transition-all duration-200 uppercase tracking-wide"
                                    >
                                        🔑 Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 bg-emerald-400 text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-emerald-300 transition-all duration-200 uppercase tracking-wide"
                                    >
                                        🛡️ Register
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                            >
                                <svg className="w-6 h-6 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden border-t-2 border-black bg-white/90 backdrop-blur-lg shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="px-4 py-3 space-y-3">
                                <Link
                                    to="/"
                                    className={`block px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all duration-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                        isActive('/')
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-white text-black hover:bg-emerald-100'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    🏠 Home
                                </Link>
                                
                                {user && userProfile?.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className={`block px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all duration-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                            isActive('/admin')
                                                ? 'bg-emerald-400 text-black'
                                                : 'bg-white text-black hover:bg-emerald-100'
                                        }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        ⚙️ Admin Dashboard
                                    </Link>
                                )}

                                {user ? (
                                    <div className="pt-2 border-t-2 border-black space-y-3">
                                        <div className="flex items-center space-x-3 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="w-8 h-8 bg-emerald-400 border-2 border-black rounded-lg flex items-center justify-center">
                                                <span className="text-black text-sm font-black">
                                                    {user?.email?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-sm text-black font-medium">
                                                {userProfile?.displayName || user?.email}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-2 bg-red-400 text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-300 transition-all duration-200 uppercase tracking-wide"
                                        >
                                            🚪 Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t-2 border-black space-y-3">
                                        <Link
                                            to="/login"
                                            className="block px-4 py-2 bg-white text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 transition-all duration-200 uppercase tracking-wide text-center"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            🔑 Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="block px-4 py-2 bg-emerald-400 text-black text-sm font-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 transition-all duration-200 uppercase tracking-wide text-center"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            🛡️ Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 relative z-10 flex flex-col">
                {children}
            </main>
        </div>
    );
};