import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EPLQUserProfiles } from '../../context/AuthContext';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<EPLQUserProfiles[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');

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
                return {
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    queryHistory: data.queryHistory?.map((record: any) => ({
                        ...record,
                        timestamp: record.timestamp?.toDate() || new Date()
                    })) || []
                } as EPLQUserProfiles;
            });
            
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (uid: string, newRole: 'user' | 'admin') => {
        try {
            const userDocRef = doc(db, 'userProfiles', uid);
            await updateDoc(userDocRef, {
                role: newRole,
                updatedAt: new Date()
            });
            
            setUsers(users.map(user => 
                user.uid === uid ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Error updating user role:', error);
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
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
                <button
                    onClick={loadUsers}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search users by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Privacy Level
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Queries
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.displayName || 'No Name'}
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => updateUserRole(user.uid, e.target.value as 'user' | 'admin')}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
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
                                        <button
                                            onClick={() => deleteUser(user.uid)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                </p>
            </div>
        </div>
    );
};

export default UserManagement;
