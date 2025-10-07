/**
 * Admin Role Management Component
 * Allows super admins to manage user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { BrutalistButton, BrutalistSelect } from '../ui';
import { logger } from '../../utils/logger';
import type { EPLQUserProfiles } from '../../context/AuthContext';

interface UserRoleItem extends EPLQUserProfiles {
    id: string;
}

export const AdminRoleManagement: React.FC = () => {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserRoleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');

    // Load all users
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            logger.info('AdminRoleManagement', '👥 Loading all users...');

            const usersQuery = query(
                collection(db, 'userProfiles'),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(usersQuery);
            const usersList: UserRoleItem[] = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data() as EPLQUserProfiles;
                usersList.push({
                    id: doc.id,
                    ...data
                });
            });

            setUsers(usersList);
            logger.success('AdminRoleManagement', `✅ Loaded ${usersList.length} users`);
        } catch (error) {
            logger.error('AdminRoleManagement', '❌ Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    // Update user role
    const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
        if (userId === userProfile?.uid && newRole === 'user') {
            alert('⚠️ You cannot remove your own admin privileges!');
            return;
        }

        try {
            setUpdating(userId);
            logger.info('AdminRoleManagement', `🔄 Updating user role: ${userId} → ${newRole}`);

            const userDocRef = doc(db, 'userProfiles', userId);
            await updateDoc(userDocRef, {
                role: newRole,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId 
                        ? { ...user, role: newRole, updatedAt: new Date() }
                        : user
                )
            );

            logger.success('AdminRoleManagement', `✅ User role updated: ${newRole}`);
        } catch (error) {
            logger.error('AdminRoleManagement', '❌ Failed to update user role', error);
            alert('Failed to update user role. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    // Filter users based on role
    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.role === filter;
    });

    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">👥 User Role Management</h2>
                <p className="text-gray-600">
                    Manage admin privileges and user permissions across the EPLQ system
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h3 className="font-black text-sm uppercase text-blue-700 mb-1">Total Users</h3>
                    <p className="text-2xl font-black text-blue-900">{users.length}</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <h3 className="font-black text-sm uppercase text-purple-700 mb-1">Admins</h3>
                    <p className="text-2xl font-black text-purple-900">{adminCount}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <h3 className="font-black text-sm uppercase text-green-700 mb-1">Regular Users</h3>
                    <p className="text-2xl font-black text-green-900">{userCount}</p>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-black text-gray-700">Filter by Role:</label>
                        <BrutalistSelect
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'all' | 'admin' | 'user')}
                            className="w-auto"
                        >
                            <option value="all">All Users ({users.length})</option>
                            <option value="admin">Admins ({adminCount})</option>
                            <option value="user">Users ({userCount})</option>
                        </BrutalistSelect>
                    </div>
                    <BrutalistButton
                        onClick={loadUsers}
                        variant="secondary"
                        size="sm"
                    >
                        🔄 Refresh
                    </BrutalistButton>
                </div>
            </div>

            {/* Warning for Admin Changes */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <span className="text-yellow-500 text-lg">⚠️</span>
                    <div className="text-yellow-800">
                        <p className="font-semibold mb-1">Admin Role Management Guidelines</p>
                        <ul className="text-sm space-y-1">
                            <li>• Admin users can access /admin routes and manage all data</li>
                            <li>• Regular users can only access /dashboard and their own data</li>
                            <li>• You cannot remove your own admin privileges</li>
                            <li>• Admin role changes take effect immediately</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">
                    User List ({filteredUsers.length})
                </h3>
                
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">👤</div>
                        <p className="text-gray-500">No users found for the selected filter</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map((user) => (
                            <div 
                                key={user.id} 
                                className="border-2 border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${
                                                user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                                            }`}></div>
                                            <h4 className="font-black text-gray-900">{user.displayName}</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-black uppercase ${
                                                user.role === 'admin' 
                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                    : 'bg-green-100 text-green-800 border border-green-200'
                                            }`}>
                                                {user.role === 'admin' ? '👨‍💼 Admin' : '👤 User'}
                                            </span>
                                            {user.id === userProfile?.uid && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                                    (You)
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600 font-semibold">Email:</span>
                                                <p className="text-gray-900">{user.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-semibold">Privacy Level:</span>
                                                <p className="text-gray-900 capitalize">{user.privacyLevel}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 font-semibold">Joined:</span>
                                                <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Role Change Controls */}
                                    <div className="flex items-center space-x-2">
                                        {user.role === 'user' ? (
                                            <BrutalistButton
                                                onClick={() => updateUserRole(user.id, 'admin')}
                                                disabled={updating === user.id}
                                                variant="primary"
                                                size="sm"
                                                className="bg-purple-500 hover:bg-purple-600"
                                            >
                                                {updating === user.id ? '⏳' : '⬆️'} Make Admin
                                            </BrutalistButton>
                                        ) : (
                                            <BrutalistButton
                                                onClick={() => updateUserRole(user.id, 'user')}
                                                disabled={updating === user.id || user.id === userProfile?.uid}
                                                variant="secondary"
                                                size="sm"
                                                className={user.id === userProfile?.uid ? 'opacity-50' : ''}
                                            >
                                                {updating === user.id ? '⏳' : '⬇️'} Remove Admin
                                            </BrutalistButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Admin Setup */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <h3 className="font-black text-emerald-900 mb-2">🚀 Quick Admin Setup</h3>
                <p className="text-sm text-emerald-800 mb-3">
                    To make yourself an admin, update your user document in Firestore:
                </p>
                <div className="bg-emerald-100 p-3 rounded border border-emerald-300 font-mono text-xs">
                    <p className="text-emerald-900">
                        1. Go to Firebase Console → Firestore Database<br/>
                        2. Find userProfiles collection → your user document<br/>
                        3. Edit the 'role' field from 'user' to 'admin'<br/>
                        4. Save and refresh the page
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminRoleManagement;
