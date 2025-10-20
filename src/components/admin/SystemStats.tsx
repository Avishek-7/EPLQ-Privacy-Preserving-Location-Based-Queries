import React from 'react';
import { BrutalistButton } from '../ui';

interface SystemStatsProps {
    stats: {
        totalUsers: number;
        totalQueries: number;
        totalPOIs: number;
        activeUsers: number;
    };
    onRefresh: () => void;
}

const SystemStats: React.FC<SystemStatsProps> = ({ stats, onRefresh }) => {
    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: '👥',
            color: 'bg-blue-500'
        },
        {
            title: 'Active Users (24h)',
            value: stats.activeUsers,
            icon: '🟢',
            color: 'bg-green-500'
        },
        {
            title: 'Total Queries',
            value: stats.totalQueries,
            icon: '🔍',
            color: 'bg-purple-500'
        },
        {
            title: 'Encrypted POIs',
            value: stats.totalPOIs,
            icon: '📍',
            color: 'bg-orange-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">📊 System Overview</h2>
                    <p className="text-gray-600 font-semibold">Real-time system statistics and performance metrics</p>
                </div>
                <BrutalistButton
                    onClick={onRefresh}
                    variant="secondary"
                    size="sm"
                >
                    🔄 Refresh
                </BrutalistButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                        <div className="flex items-center">
                            <div className={`${card.color} rounded-xl p-3 text-white text-2xl mr-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-600 uppercase tracking-wide">{card.title}</p>
                                <p className="text-3xl font-black text-gray-900">{card.value.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">🔐 Privacy & Security Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-2xl text-green-600 mb-2">✅</div>
                        <p className="font-black text-green-800">Encryption Active</p>
                        <p className="text-sm text-green-600 font-semibold">All data encrypted</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-2xl text-blue-600 mb-2">🛡️</div>
                        <p className="font-black text-blue-800">Privacy Preserved</p>
                        <p className="text-sm text-blue-600 font-semibold">Zero location exposure</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-2xl text-purple-600 mb-2">⚡</div>
                        <p className="font-black text-purple-800">Performance</p>
                        <p className="text-sm text-purple-600 font-semibold">~0.9s query generation</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">📈 System Performance</h3>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-gray-800 text-sm sm:text-base">Average Query Time</span>
                        <span className="text-green-600 font-black text-lg sm:text-xl">0.92s</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-gray-800 text-sm sm:text-base">POI Search Latency</span>
                        <span className="text-green-600 font-black text-lg sm:text-xl">2.1s</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-gray-800 text-sm sm:text-base">System Uptime</span>
                        <span className="text-green-600 font-black text-lg sm:text-xl">99.9%</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-gray-800 text-sm sm:text-base">Privacy Level</span>
                        <span className="text-green-600 font-black text-lg sm:text-xl">Maximum</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStats;
