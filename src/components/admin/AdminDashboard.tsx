import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../Toast';
import { logger } from '../../utils/logger';
import DataUpload from './DataUpload';
import UserManagement from './UserManagement';
import SystemStats from './SystemStats';
import EncryptedDataViewer from './EncryptedDataViewer';
import AdminSettings from './AdminSettings';

interface AdminStats {
    totalUsers: number;
    totalQueries: number;
    totalPOIs: number;
    activeUsers: number;   
}

const AdminDashboard: React.FC = () => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'data' | 'upload' | 'settings'>('overview');
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalQueries: 0,
        totalPOIs: 0,
        activeUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/');
        } catch (error) {
            logger.error('AdminDashboard', 'Logout failed', error as Error);
            addToast({
                type: 'error',
                title: 'Logout Failed',
                message: 'Please try again.',
                duration: 4000
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        if (userProfile?.role !== 'admin') {
            // Redirect non-admin users
            return;
        }
        loadAdminStats();
    }, [userProfile]);

    const loadAdminStats = async () => {
        try {
            setLoading(true);
            
            // Get total users count
            const usersQuery = query(collection(db, 'userProfiles'));
            const usersSnapshot = await getDocs(usersQuery);
            const totalUsers = usersSnapshot.size;

            // Get total POIs count
            const poisQuery = query(collection(db, 'encryptedPOIs'));
            const poisSnapshot = await getDocs(poisQuery);
            const totalPOIs = poisSnapshot.size;

            // Calculate total queries from all users
            let totalQueries = 0;
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                totalQueries += userData.queryHistory?.length || 0;
            });

            // Get active users (logged in within last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const activeUsersQuery = query(
                collection(db, 'userProfiles'),
                where('updatedAt', '>=', yesterday)
            );
            const activeUsersSnapshot = await getDocs(activeUsersQuery);
            const activeUsers = activeUsersSnapshot.size;

            setStats({
                totalUsers,
                totalQueries,
                totalPOIs,
                activeUsers
            });
        } catch (error) {
            console.error('Error loading admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (userProfile?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🚫</div>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                        <p className="text-gray-600 mb-6">
                            You don't have administrator privileges to access this page.
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Current role: <span className="font-semibold">{userProfile?.role || 'Unknown'}</span>
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-10 left-10 w-60 h-60 bg-emerald-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl"></div>
            
            {/* Header */}
            <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b-2 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">EPLQ Admin Dashboard</h1>
                            <p className="text-sm text-gray-600 font-semibold">Privacy-Preserving Location Query Management System</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-700">
                                    Welcome, {userProfile?.displayName || userProfile?.email}
                                </p>
                                <p className="text-xs text-gray-500 font-semibold">Administrator</p>
                            </div>
                            <div className="h-10 w-10 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                                <span className="text-black text-sm font-black">
                                    {(userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'A').toUpperCase()}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className={`bg-red-500 text-white px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-red-600 transition-all duration-200 font-black text-sm uppercase tracking-wide flex items-center ${isLoggingOut ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <span className="mr-2">🚪</span>
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="relative z-10 bg-white/80 backdrop-blur-lg border-b-2 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap justify-center gap-4 py-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'users', label: 'User Management', icon: '👥' },
                            { id: 'data', label: 'Data Viewer', icon: '🔒' },
                            { id: 'upload', label: 'Upload POIs', icon: '📤' },
                            { id: 'settings', label: 'Settings', icon: '⚙️' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'data' | 'upload' | 'settings')}
                                className={`px-6 py-3 font-black text-sm uppercase tracking-wide border-2 border-black rounded-lg transition-all duration-200 ${
                                    activeTab === tab.id 
                                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-white text-gray-700 hover:bg-emerald-100 hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                            >
                                <span className="flex items-center space-x-2">
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 relative z-10 py-6 px-4 sm:px-6 lg:px-8 w-full">
                {loading && activeTab === 'overview' ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading admin dashboard...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <SystemStats stats={stats} onRefresh={loadAdminStats} />
                        )}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'data' && <EncryptedDataViewer />}
                        {activeTab === 'upload' && <DataUpload onUploadSuccess={loadAdminStats} />}
                        {activeTab === 'settings' && <AdminSettings />}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-white/80 backdrop-blur-lg border-t-2 border-black shadow-[0_-4px_0px_0px_rgba(0,0,0,1)] mt-12">
                <div className="w-full py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center text-sm text-gray-600 font-semibold">
                        <div>
                            <p>&copy; 2025 EPLQ - Privacy-Preserving Location-Based Queries</p>
                        </div>
                        <div className="flex space-x-6">
                            <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                System Online
                            </span>
                            <span>Version 1.0.0</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AdminDashboard;