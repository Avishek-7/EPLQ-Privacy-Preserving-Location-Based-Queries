import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BrutalistButton, BrutalistSelect, LoadingButton, LoadingCard } from '../ui';
import POISearch from './POISearch';
import { AdminSetupGuide } from '../admin/AdminSetupGuide';
import { logger } from '../../utils/logger';
import { useToast } from '../Toast';
import type { PrivacySettings } from '../../context/AuthContext';

interface UserDashboardStats {
    totalQueries: number;
    privacyLevel: string;
    locationPermissions: number;
    accountAge: string;
}

export const UserDashboard: React.FC = () => {
    const { user, userProfile, updateUserProfile, requestLocationAccess, logout, addQueryToHistory } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'privacy' | 'search' | 'queries' | 'settings'>('overview');
    const [stats, setStats] = useState<UserDashboardStats>({
        totalQueries: 0,
        privacyLevel: 'medium',
        locationPermissions: 0,
        accountAge: '0 days'
    });

    // Privacy settings form
    const [privacyForm, setPrivacyForm] = useState<PrivacySettings>({
        privacyLevel: userProfile?.privacyLevel || 'medium',
        locationDataPermission: userProfile?.locationDataPermission || []
    });

    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
    const [locationAccess, setLocationAccess] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isAdminUser = userProfile?.role === 'admin';
    const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'Explorer';

    // Set document title
    useEffect(() => {
        document.title = 'Dashboard - EPLQ';
    }, []);

    // Calculate dashboard stats
    useEffect(() => {
        if (userProfile) {
            setIsLoadingStats(true);
            
            // Simulate loading time for better UX
            setTimeout(() => {
                const accountCreated = userProfile.createdAt;
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - accountCreated.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                setStats({
                    totalQueries: userProfile.queryHistory?.length || 0,
                    privacyLevel: userProfile.privacyLevel,
                    locationPermissions: userProfile.locationDataPermission.length,
                    accountAge: diffDays === 1 ? '1 day' : `${diffDays} days`
                });

                // Check if location is already enabled
                setLocationAccess(userProfile.locationDataPermission.includes('geolocation'));
                setIsLoadingStats(false);
            }, 500);
        }
    }, [userProfile]);

    const handlePrivacyChange = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔧 [UserDashboard] Starting privacy settings update...', privacyForm);
        setIsUpdatingPrivacy(true);

        try {
            console.log('📝 [UserDashboard] Calling updateUserProfile...');
            console.log('📝 [UserDashboard] Calling updateUserProfile...');
            await updateUserProfile(privacyForm);
            console.log('✅ [UserDashboard] Privacy settings updated successfully');
            addToast({
                type: 'success',
                title: 'Privacy Settings Updated',
                message: 'Your privacy preferences have been saved successfully.',
                duration: 4000
            });
        } catch (error) {
            
            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Failed to update privacy settings';
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: errorMessage,
                duration: 5000
            });
        } finally {
            setIsUpdatingPrivacy(false);
            console.log('🏁 [UserDashboard] Privacy update process completed');
        }
    };

    const handleLocationRequest = async () => {
        console.log('🌍 [UserDashboard] Requesting location access...');
        setIsRequestingLocation(true);
        setLocationError(null);
        
        try {
            const granted = await requestLocationAccess(['geolocation', 'gps']);
            console.log('📍 [UserDashboard] Location access result:', granted ? 'GRANTED' : 'DENIED');
            
            setLocationAccess(granted);

            if (granted) {
                console.log('✅ [UserDashboard] Location granted, updating privacy form...');
                setPrivacyForm(prev => ({
                    ...prev,
                    locationDataPermission: [...prev.locationDataPermission, 'geolocation']
                }));
                setLocationError(null);
            } else {
                console.log('❌ [UserDashboard] Location access was denied by user');
                setLocationError('Location access was denied. To enable location services:\n\n1. Click the location icon in your browser\'s address bar\n2. Select "Allow" for location access\n3. Refresh the page and try again\n\nLocation services help provide more accurate and personalized results.');
            }
        } catch (error) {
            console.error('❌ [UserDashboard] Error requesting location access:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setLocationError(`Error requesting location access: ${errorMessage}\n\nThis might be due to:\n• Browser security settings\n• Location services being disabled\n• Network connectivity issues\n\nPlease check your browser settings and try again.`);
        } finally {
            setIsRequestingLocation(false);
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/');
        } catch (error) {
            logger.error('UserDashboard', 'Logout failed', error as Error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Function to export user data
    const exportUserData = () => {
        if (!userProfile) return;

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                email: user?.email,
                displayName: userProfile.displayName,
                createdAt: userProfile.createdAt,
                role: userProfile.role,
            },
            privacy: {
                privacyLevel: userProfile.privacyLevel,
                locationDataPermission: userProfile.locationDataPermission,
            },
            statistics: stats,
            queryHistory: userProfile.queryHistory || [],
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `eplq-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        addToast({
            type: 'success',
            title: 'Data Exported Successfully',
            message: 'Your EPLQ data has been downloaded to your device.',
            duration: 4000
        });
    };

    // Function to add sample queries for demonstration
    const addSampleQueries = async () => {
        if (!addQueryToHistory) return;
        
        const sampleQueries = [
            { query: "POI Search: restaurants within 1000m of 40.7128, -74.0060", response: "Found 12 POIs in 245ms" },
            { query: "POI Search: hotels within 2000m of 34.0522, -118.2437", response: "Found 8 POIs in 189ms" },
            { query: "POI Search: all categories within 500m of 51.5074, -0.1278", response: "Found 25 POIs in 312ms" },
            { query: "POI Search: parks within 1500m of 25.5924, 84.9567", response: "Found 3 POIs in 156ms" },
            { query: "POI Search: gas stations within 3000m of 40.7128, -74.0060", response: "Found 5 POIs in 201ms" }
        ];

        for (const sampleQuery of sampleQueries) {
            await addQueryToHistory(sampleQuery.query, sampleQuery.response);
            // Small delay to make it more realistic
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    // Helper component for browser-specific location instructions
    const LocationHelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-gray-900">📍 How to Enable Location Services</h3>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-black">×</button>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-black text-blue-900 mb-2">🌐 Chrome / Edge</h4>
                                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                                    <li>Click the location icon (🛡️) in the address bar</li>
                                    <li>Select "Always allow" for location access</li>
                                    <li>Refresh the page and try again</li>
                                </ol>
                            </div>
                            
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h4 className="font-black text-orange-900 mb-2">🦊 Firefox</h4>
                                <ol className="list-decimal list-inside space-y-1 text-orange-800">
                                    <li>Click the shield icon in the address bar</li>
                                    <li>Click "Turn off blocking for this site"</li>
                                    <li>Refresh and allow location when prompted</li>
                                </ol>
                            </div>
                            
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="font-black text-gray-900 mb-2">🍎 Safari</h4>
                                <ol className="list-decimal list-inside space-y-1 text-gray-800">
                                    <li>Go to Safari → Settings → Websites</li>
                                    <li>Click "Location" in the left sidebar</li>
                                    <li>Set this website to "Allow"</li>
                                </ol>
                            </div>

                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-800 text-xs">
                                    <strong>🔒 Privacy Note:</strong> Your location data is encrypted and only used to provide 
                                    relevant, privacy-preserving location-based query results. We never store or share 
                                    your exact location.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const [showLocationHelp, setShowLocationHelp] = useState(false);

    const TabButton: React.FC<{ tab: typeof activeTab; icon: string; label: string }> = ({ tab, icon, label }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-black text-sm uppercase tracking-wide border-2 border-black rounded-lg transition-all duration-200 ${
                activeTab === tab 
                ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-gray-700 hover:bg-emerald-100 hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
        >
            <span className="flex items-center space-x-2">
                <span>{icon}</span>
                <span>{label}</span>
            </span>
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 bg-blue-200/30 rounded-full blur-3xl"></div>

            {/* Header */}
            <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b-2 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-gray-900">EPLQ User Dashboard</h1>
                                <p className="text-sm text-gray-600 font-semibold">Privacy-Preserving Location Query Management System</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-700">
                                        Welcome, {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 font-semibold">{isAdminUser ? 'Administrator' : 'User'}</p>
                                </div>
                                <div className="h-10 w-10 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                                    <span className="text-black text-sm font-black">
                                        {(displayName?.[0] || 'U').toUpperCase()}
                                    </span>
                                </div>
                                <LoadingButton
                                    onClick={handleLogout}
                                    isLoading={isLoggingOut}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-red-600 transition-all duration-200 font-black text-sm uppercase tracking-wide flex items-center"
                                >
                                    <span className="mr-2">🚪</span>
                                    Logout
                                </LoadingButton>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="relative z-10 bg-white/80 backdrop-blur-lg border-b-2 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap justify-center gap-4 py-4">
                            <TabButton tab="overview" icon="📊" label="Overview" />
                            <TabButton tab="privacy" icon="🔒" label="Privacy" />
                            <TabButton tab="search" icon="🔍" label="POI Search" />
                            <TabButton tab="queries" icon="❓" label="Queries" />
                            <TabButton tab="settings" icon="⚙️" label="Settings" />
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 relative z-10 py-6 px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex-1 flex flex-col space-y-8">
                        {/* Account Statistics - Only show on Overview tab */}
                        {activeTab === 'overview' && (
                            <LoadingCard 
                                isLoading={isLoadingStats}
                                className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 animate-fade-in"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-black text-gray-900">📊 Account Statistics</h2>
                                            {isAdminUser && (
                                                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                                    👨‍💼 ADMIN
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-600 font-medium">
                                            Real-time user activity and privacy metrics
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        {/* <BrutalistButton
                                            onClick={addSampleQueries}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            📝 Add Samples
                                        </BrutalistButton> */}
                                        {isAdminUser && (
                                            <a href="/admin">
                                                <BrutalistButton
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    🔑 Admin Panel
                                                </BrutalistButton>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="bg-emerald-200 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <h3 className="font-black text-sm uppercase text-emerald-800 mb-1">Total Queries</h3>
                                        <p className="text-2xl font-black text-emerald-900">{stats.totalQueries}</p>
                                    </div>
                                    <div className="bg-blue-200 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <h3 className="font-black text-sm uppercase text-blue-800 mb-1">Privacy Level</h3>
                                        <p className="text-2xl font-black text-blue-900 capitalize">{stats.privacyLevel}</p>
                                    </div>
                                    <div className="bg-purple-200 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <h3 className="font-black text-sm uppercase text-purple-800 mb-1">Location Permissions</h3>
                                        <p className="text-2xl font-black text-purple-900">{stats.locationPermissions}</p>
                                    </div>
                                    <div className="bg-amber-200 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <h3 className="font-black text-sm uppercase text-amber-800 mb-1">Account Age</h3>
                                        <p className="text-2xl font-black text-amber-900">{stats.accountAge}</p>
                                    </div>
                                </div>
                            </LoadingCard>
                        )}

                        <section className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 flex-1 flex flex-col">
                            {activeTab === 'overview' && (
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6">Account Overview</h2>

                                    {/* Admin Setup Guide - only show for non-admin users */}
                                    {!isAdminUser && <AdminSetupGuide />}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-black text-gray-800">Recent Activity</h3>
                                            <div className="space-y-2">
                                                {userProfile?.queryHistory?.slice(0, 5).map((query, index) => (
                                                    <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <p className="font-semibold text-sm text-gray-700">{query.query}</p>
                                                        <p className="text-xs text-gray-500">{new Date(query.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                )) || <p className="text-gray-500">No recent queries</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-black text-gray-800">Privacy Summary</h3>
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                <p className="text-sm text-gray-700 mb-2">
                                                    <span className="font-semibold">Current Level:</span> {userProfile?.privacyLevel}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Location Access:</span> {(userProfile?.locationDataPermission?.length || 0) > 0 ? 'Enabled' : 'Disabled'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6">Privacy Settings</h2>
                                    <form onSubmit={handlePrivacyChange} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2">Privacy Level</label>
                                            <BrutalistSelect
                                                value={privacyForm.privacyLevel}
                                                onChange={(e) => setPrivacyForm(prev => ({ ...prev, privacyLevel: e.target.value as 'low' | 'medium' | 'high' }))}
                                                className="w-full"
                                            >
                                                <option value="low">Low - More personalized results</option>
                                                <option value="medium">Medium - Balanced privacy</option>
                                                <option value="high">High - Maximum privacy</option>
                                            </BrutalistSelect>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-4">Location Permissions</label>
                                            <div className="space-y-3">
                                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-semibold">Geolocation Access</span>
                                                        <BrutalistButton
                                                            type="button"
                                                            onClick={handleLocationRequest}
                                                            variant={locationAccess ? 'primary' : 'secondary'}
                                                            size="sm"
                                                            disabled={isRequestingLocation}
                                                        >
                                                            {isRequestingLocation ? 'Requesting...' : locationAccess ? 'Enabled ✓' : 'Enable Location'}
                                                        </BrutalistButton>
                                                    </div>

                                                    <div className={`p-2 rounded-lg text-xs font-semibold ${
                                                        locationAccess
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    }`}>
                                                        {locationAccess
                                                            ? '✅ Location services are enabled for more accurate results'
                                                            : '⚠️ Location services disabled - results may be less personalized'}
                                                    </div>

                                                    {locationError && (
                                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <div className="flex items-start space-x-2">
                                                                <span className="text-red-500 text-sm">❌</span>
                                                                <div className="text-xs text-red-700 flex-1">
                                                                    <p className="font-semibold mb-1">Location Access Denied</p>
                                                                    <div className="whitespace-pre-line text-xs leading-relaxed mb-2">
                                                                        {locationError}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setShowLocationHelp(true)}
                                                                        className="text-blue-600 hover:text-blue-800 underline text-xs font-semibold"
                                                                    >
                                                                        📖 View detailed instructions for your browser
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!locationError && !locationAccess && (
                                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <div className="flex items-start space-x-2">
                                                                <span className="text-blue-500 text-sm">ℹ️</span>
                                                                <div className="text-xs text-blue-700">
                                                                    <p className="font-semibold mb-1">Why enable location?</p>
                                                                    <p className="text-xs leading-relaxed">
                                                                        Location services enable privacy-preserving location-based queries. Your location data is encrypted and only used to provide relevant results.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <BrutalistButton type="submit" disabled={isUpdatingPrivacy} className="w-full">
                                            {isUpdatingPrivacy ? 'Updating...' : 'Update Privacy Settings'}
                                        </BrutalistButton>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'search' && (
                                <div className="flex-1 flex flex-col">
                                    <POISearch />
                                </div>
                            )}

                            {activeTab === 'queries' && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-black text-gray-900">Query History</h2>
                                        {(!userProfile?.queryHistory || userProfile.queryHistory.length === 0) && (
                                            <BrutalistButton onClick={addSampleQueries} variant="secondary" size="sm">
                                                📝 Add Sample Queries
                                            </BrutalistButton>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {userProfile?.queryHistory?.map((query, index) => (
                                            <div key={index} className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-black text-gray-800">{query.query}</h3>
                                                    <span className="text-xs text-gray-500 font-semibold">{new Date(query.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{query.response || 'No response recorded'}</p>
                                            </div>
                                        )) || (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 text-lg">No queries yet</p>
                                                <p className="text-gray-400 text-sm">Start asking questions to see your history here</p>
                                                <div className="mt-4">
                                                    <BrutalistButton onClick={addSampleQueries} variant="primary">
                                                        📝 Add Sample Queries for Demo
                                                    </BrutalistButton>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="flex-1 flex flex-col">
                                    <h2 className="text-2xl font-black text-gray-900 mb-6">Account Settings</h2>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <h3 className="font-black text-gray-800 mb-2">Account Information</h3>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-semibold">Email:</span> {user?.email}
                                            </p>
                                            <p className="text-sm text-gray-600 mb-4">
                                                <span className="font-semibold">Member since:</span> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                                            </p>
                                            <div className="flex justify-center">
                                                <BrutalistButton
                                                    onClick={exportUserData}
                                                    variant="primary"
                                                >
                                                    📥 Export My Data
                                                </BrutalistButton>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <h3 className="font-black text-red-800 mb-2">Danger Zone</h3>
                                            <p className="text-sm text-red-600 mb-4">
                                                Deleting your account will permanently remove all your data and cannot be undone.
                                            </p>
                                            <div className="flex justify-center">
                                                <BrutalistButton
                                                    variant="secondary"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                                                            console.log('Account deletion requested');
                                                        }
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600 text-white border-red-600"
                                                >
                                                    Delete Account
                                                </BrutalistButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                {/* Location Help Modal */}
                <LocationHelpModal
                    isOpen={showLocationHelp}
                    onClose={() => setShowLocationHelp(false)}
                />

                {/* Footer */}
                <footer className="relative z-10 bg-white/80 backdrop-blur-lg border-t-2 border-black shadow-[0_-4px_0px_0px_rgba(0,0,0,1)] mt-auto">
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

export default UserDashboard;
