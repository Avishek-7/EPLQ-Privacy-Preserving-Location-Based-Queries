import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { BrutalistButton } from '../ui';
import type { EPLQUserProfiles } from '../../context/AuthContext';

const UserManagement: React.FC = () => {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<EPLQUserProfiles[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersQuery = query(
                collection(db, 'userProfiles'),
                orderBy('createdAt', 'desc')
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            const usersData: EPLQUserProfiles[] = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                const userData = {
                    ...data,
                    role: data.role || 'user', // Ensure role has a default value
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    queryHistory: data.queryHistory?.map((record: any) => ({
                        ...record,
                        timestamp: record.timestamp?.toDate() || new Date()
                    })) || []
                } as EPLQUserProfiles;
                
                // Debug logging
                console.log('User data loaded:', {
                    email: userData.email,
                    role: userData.role,
                    displayName: userData.displayName
                });
                
                return userData;
            });
            
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (uid: string, newRole: 'user' | 'admin') => {
        // Prevent self-demotion
        if (uid === userProfile?.uid && newRole === 'user') {
            alert('⚠️ You cannot remove your own admin privileges!');
            return;
        }

        try {
            setUpdating(uid);
            const userDocRef = doc(db, 'userProfiles', uid);
            await updateDoc(userDocRef, {
                role: newRole,
                updatedAt: new Date()
            });
            
            setUsers(users.map(user => 
                user.uid === uid ? { ...user, role: newRole, updatedAt: new Date() } : user
            ));
            
            console.log(`✅ User role updated: ${newRole}`);
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    const deleteUser = async (uid: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await deleteDoc(doc(db, 'userProfiles', uid));
            setUsers(users.filter(user => user.uid !== uid));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // Calculate role statistics
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;

    const getPrivacyBadgeColor = (level: string) => {
        switch (level) {
            case 'high': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">👥 User Management</h2>
                <p className="text-gray-600">
                    Manage users, roles, and permissions across the EPLQ system
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                    <h3 className="font-black text-sm uppercase text-emerald-700 mb-1">Filtered</h3>
                    <p className="text-2xl font-black text-emerald-900">{filteredUsers.length}</p>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search users by email or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                            />
                        </div>
                        <div>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as any)}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                            >
                                <option value="all">All Roles ({users.length})</option>
                                <option value="user">Users ({userCount})</option>
                                <option value="admin">Admins ({adminCount})</option>
                            </select>
                        </div>
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

            {/* Users Table */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-gray-200">
                    <h3 className="text-xl font-black text-gray-900">
                        Users List ({filteredUsers.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Privacy Level
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Queries
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                                            }`}></div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-sm font-black text-gray-900">
                                                        {user.displayName || 'No Name'}
                                                    </div>
                                                    {user.uid === userProfile?.uid && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <select
                                                value={user.role || 'user'}
                                                onChange={(e) => updateUserRole(user.uid, e.target.value as 'user' | 'admin')}
                                                disabled={updating === user.uid}
                                                className="text-sm border-2 border-gray-300 rounded px-3 py-2 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                            >
                                                <option value="user">👤 User</option>
                                                <option value="admin">👨‍💼 Admin</option>
                                            </select>
                                            {updating === user.uid && (
                                                <span className="text-xs text-gray-500">⏳</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrivacyBadgeColor(user.privacyLevel)}`}>
                                            {user.privacyLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.queryHistory?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.createdAt.toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <BrutalistButton
                                            onClick={() => deleteUser(user.uid)}
                                            variant="secondary"
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white border-red-600"
                                        >
                                            🗑️ Delete
                                        </BrutalistButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 font-semibold">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                    <div className="flex space-x-4 text-xs text-gray-500">
                        <span>👥 Total: {users.length}</span>
                        <span>👨‍💼 Admins: {adminCount}</span>
                        <span>👤 Users: {userCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
