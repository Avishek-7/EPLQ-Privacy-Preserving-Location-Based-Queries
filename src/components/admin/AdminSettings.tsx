import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BrutalistButton } from '../ui';

const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        maxQueryRadius: 5000, // meters
        queryRateLimit: 100, // per hour
        encryptionLevel: 'maximum',
        indexRefreshInterval: 24, // hours
        logRetentionDays: 30,
        enableQueryLogging: true,
        maxConcurrentQueries: 10,
        privacyAuditEnabled: true
    });
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const handleSettingChange = (
        key: keyof typeof settings,
        value: number | string | boolean
    ) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);
            
            // Save settings to Firestore
            const settingsDocRef = doc(db, 'systemSettings', 'main');
            await setDoc(settingsDocRef, {
                ...settings,
                updatedAt: new Date(),
                updatedBy: 'admin'
            });
            
            setSaveMessage('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveMessage('Error saving settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = () => {
        setSettings({
            maxQueryRadius: 5000,
            queryRateLimit: 100,
            encryptionLevel: 'maximum',
            indexRefreshInterval: 24,
            logRetentionDays: 30,
            enableQueryLogging: true,
            maxConcurrentQueries: 10,
            privacyAuditEnabled: true
        });
        setSaveMessage(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">⚙️ System Settings</h2>
                    <p className="text-gray-600 font-semibold">Configure EPLQ system parameters and privacy settings</p>
                </div>
                <div className="flex space-x-3">
                    <BrutalistButton
                        onClick={resetToDefaults}
                        variant="secondary"
                        size="sm"
                    >
                        🔄 Reset to Defaults
                    </BrutalistButton>
                    <BrutalistButton
                        onClick={saveSettings}
                        disabled={saving}
                        variant="primary"
                        size="sm"
                    >
                        {saving ? '⏳ Saving...' : '💾 Save Settings'}
                    </BrutalistButton>
                </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded-xl border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    saveMessage.includes('Error')
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                    <p className="font-black">{saveMessage}</p>
                </div>
            )}

            {/* Query Configuration */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔍</span>
                    Query Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">
                            Maximum Query Radius (meters)
                        </label>
                        <input
                            type="number"
                            min="100"
                            max="50000"
                            value={settings.maxQueryRadius}
                            onChange={(e) => handleSettingChange('maxQueryRadius', Number(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum distance for spatial range queries</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Query Rate Limit (per hour per user)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={settings.queryRateLimit}
                            onChange={(e) => handleSettingChange('queryRateLimit', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Prevent abuse and ensure fair usage</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Concurrent Queries
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={settings.maxConcurrentQueries}
                            onChange={(e) => handleSettingChange('maxConcurrentQueries', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum simultaneous queries per user</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Index Refresh Interval (hours)
                        </label>
                        <select
                            value={settings.indexRefreshInterval}
                            onChange={(e) => handleSettingChange('indexRefreshInterval', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={1}>1 hour</option>
                            <option value={6}>6 hours</option>
                            <option value={12}>12 hours</option>
                            <option value={24}>24 hours</option>
                            <option value={48}>48 hours</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">How often to rebuild privacy-preserving indexes</p>
                    </div>
                </div>
            </div>

            {/* Privacy & Security Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔐</span>
                    Privacy & Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Encryption Level
                        </label>
                        <select
                            value={settings.encryptionLevel}
                            onChange={(e) => handleSettingChange('encryptionLevel', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="maximum">Maximum Security (Slowest)</option>
                            <option value="high">High Security (Balanced)</option>
                            <option value="standard">Standard Security (Fastest)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Higher levels provide better privacy but slower queries</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Log Retention Period (days)
                        </label>
                        <select
                            value={settings.logRetentionDays}
                            onChange={(e) => handleSettingChange('logRetentionDays', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={90}>90 days</option>
                            <option value={365}>1 year</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">How long to keep query logs for analysis</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Enable Query Logging
                            </label>
                            <p className="text-xs text-gray-500">Log encrypted queries for system analysis</p>
                        </div>
                        <button
                            onClick={() => handleSettingChange('enableQueryLogging', !settings.enableQueryLogging)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                settings.enableQueryLogging ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                    settings.enableQueryLogging ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Privacy Audit Enabled
                            </label>
                            <p className="text-xs text-gray-500">Regular privacy compliance checks</p>
                        </div>
                        <button
                            onClick={() => handleSettingChange('privacyAuditEnabled', !settings.privacyAuditEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                settings.privacyAuditEnabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                    settings.privacyAuditEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* System Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚡</span>
                    Performance Targets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">~0.9s</div>
                        <div className="text-sm text-green-800">Query Generation</div>
                        <div className="text-xs text-green-600">Mobile Android Target</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">~2-3s</div>
                        <div className="text-sm text-blue-800">POI Search</div>
                        <div className="text-xs text-blue-600">Commodity Workstation</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">100%</div>
                        <div className="text-sm text-purple-800">Privacy Level</div>
                        <div className="text-xs text-purple-600">Zero Location Exposure</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">24/7</div>
                        <div className="text-sm text-orange-800">Availability</div>
                        <div className="text-xs text-orange-600">High Availability Target</div>
                    </div>
                </div>
            </div>

            {/* EPLQ Algorithm Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🧮</span>
                    EPLQ Algorithm Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Predicate-Only Encryption</h4>
                        <p className="text-sm text-gray-600">
                            First system supporting inner product range queries on encrypted spatial data without revealing location information.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Privacy-Preserving Tree Index</h4>
                        <p className="text-sm text-gray-600">
                            Optimized spatial indexing structure that enables fast queries while maintaining complete location privacy.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Circular Range Queries</h4>
                        <p className="text-sm text-gray-600">
                            Determine if a position is within a specific circular area without exposing the center or radius.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Secure Multi-Party Computation</h4>
                        <p className="text-sm text-gray-600">
                            Advanced cryptographic protocols ensure server cannot learn anything about user locations or queries.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;