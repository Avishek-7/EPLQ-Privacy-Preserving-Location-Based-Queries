import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DataUpload from './DataUpload';
import UserManagement from './UserManagement';
import SystemStats from './SystemStats';
import EncryptedDataViewer from './EncryptedDataViewer';
import AdminSettings from './AdminSettings';
import AdminRoleManagement from './AdminRoleManagement';

interface AdminStats {
    totalUsers: number;
    totalQueries: number;
    totalPOIs: number;
    activeUsers: number;   
}

const AdminDashboard: React.FC = () => {
    const { userProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'data' | 'upload' | 'settings'>('overview');
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalQueries: 0,
        totalPOIs: 0,
        activeUsers: 0
    });
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">EPLQ Admin Dashboard</h1>
                            <p className="text-sm text-gray-500">Privacy-Preserving Location Query Management System</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">
                                    Welcome, {userProfile?.displayName || userProfile?.email}
                                </p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {(userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'A').toUpperCase()}
                            </div>
                            <button
                                onClick={logout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                            >
                                <span className="mr-2">🚪</span>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊', description: 'System statistics' },
                            { id: 'users', label: 'User Management', icon: '👥', description: 'Manage users' },
                            { id: 'roles', label: 'Role Management', icon: '🔑', description: 'Admin privileges' },
                            { id: 'data', label: 'Data Viewer', icon: '🔒', description: 'View encrypted data' },
                            { id: 'upload', label: 'Upload POIs', icon: '📤', description: 'Upload POI data' },
                            { id: 'settings', label: 'Settings', icon: '⚙️', description: 'System configuration' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'data' | 'upload' | 'settings')}
                                className={`group py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    <span className="mr-2 text-lg">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {tab.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
                        {activeTab === 'roles' && <AdminRoleManagement />}
                        {activeTab === 'data' && <EncryptedDataViewer />}
                        {activeTab === 'upload' && <DataUpload onUploadSuccess={loadAdminStats} />}
                        {activeTab === 'settings' && <AdminSettings />}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center text-sm text-gray-500">
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