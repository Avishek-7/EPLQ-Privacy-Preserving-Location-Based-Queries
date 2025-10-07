/**
 * Performance benchmarking utilities for EPLQ
 * Measures query generation and search performance as per project requirements
 */

export interface PerformanceMetrics {
    queryGenerationTime: number;
    encryptionTime: number;
    searchTime: number;
    decryptionTime: number;
    totalTime: number;
    timestamp: number;
}

export class PerformanceBenchmark {
    private startTime: number = 0;
    private metrics: PerformanceMetrics[] = [];

    /**
     * Start timing a specific operation
     */
    startTimer(): void {
        this.startTime = performance.now();
    }

    /**
     * End timer and return elapsed time in seconds
     */
    endTimer(): number {
        const endTime = performance.now();
        return (endTime - this.startTime) / 1000; // Convert to seconds
    }

    /**
     * Benchmark query generation performance
     * Target: ~0.9 seconds for mobile devices
     */
    async benchmarkQueryGeneration(queryFunction: () => Promise<unknown>): Promise<number> {
        this.startTimer();
        await queryFunction();
        const queryTime = this.endTimer();
        
        console.log(`📊 Query Generation Time: ${queryTime.toFixed(3)}s`);
        console.log(`🎯 Target: 0.9s | Status: ${queryTime <= 0.9 ? '✅ PASS' : '⚠️ NEEDS OPTIMIZATION'}`);
        
        return queryTime;
    }

    /**
     * Benchmark encryption performance
     */
    async benchmarkEncryption(encryptFunction: () => Promise<unknown>): Promise<number> {
        this.startTimer();
        await encryptFunction();
        const encryptTime = this.endTimer();
        
        console.log(`🔒 Encryption Time: ${encryptTime.toFixed(3)}s`);
        return encryptTime;
    }

    /**
     * Benchmark POI search performance
     * Target: Few seconds on commodity hardware
     */
    async benchmarkPOISearch(searchFunction: () => Promise<unknown>): Promise<number> {
        this.startTimer();
        await searchFunction();
        const searchTime = this.endTimer();
        
        console.log(`🔍 POI Search Time: ${searchTime.toFixed(3)}s`);
        console.log(`🎯 Target: <3s | Status: ${searchTime <= 3.0 ? '✅ PASS' : '⚠️ NEEDS OPTIMIZATION'}`);
        
        return searchTime;
    }

    /**
     * Benchmark decryption performance
     */
    async benchmarkDecryption(decryptFunction: () => Promise<unknown>): Promise<number> {
        this.startTimer();
        await decryptFunction();
        const decryptTime = this.endTimer();
        
        console.log(`🔓 Decryption Time: ${decryptTime.toFixed(3)}s`);
        return decryptTime;
    }

    /**
     * Run comprehensive performance test
     */
    async runFullBenchmark(operations: {
        queryGeneration: () => Promise<unknown>;
        encryption: () => Promise<unknown>;
        search: () => Promise<unknown>;
        decryption: () => Promise<unknown>;
    }): Promise<PerformanceMetrics> {
        console.log('🚀 Starting EPLQ Performance Benchmark...');
        
        const queryTime = await this.benchmarkQueryGeneration(operations.queryGeneration);
        const encryptTime = await this.benchmarkEncryption(operations.encryption);
        const searchTime = await this.benchmarkPOISearch(operations.search);
        const decryptTime = await this.benchmarkDecryption(operations.decryption);
        
        const totalTime = queryTime + encryptTime + searchTime + decryptTime;
        
        const metrics: PerformanceMetrics = {
            queryGenerationTime: queryTime,
            encryptionTime: encryptTime,
            searchTime: searchTime,
            decryptionTime: decryptTime,
            totalTime,
            timestamp: Date.now()
        };
        
        this.metrics.push(metrics);
        
        console.log('📊 Performance Summary:');
        console.log(`├── Query Generation: ${queryTime.toFixed(3)}s`);
        console.log(`├── Encryption: ${encryptTime.toFixed(3)}s`);
        console.log(`├── Search: ${searchTime.toFixed(3)}s`);
        console.log(`├── Decryption: ${decryptTime.toFixed(3)}s`);
        console.log(`└── Total Time: ${totalTime.toFixed(3)}s`);
        
        return metrics;
    }

    /**
     * Get performance statistics
     */
    getStatistics(): {
        averageQueryTime: number;
        averageSearchTime: number;
        averageTotalTime: number;
        totalTests: number;
        passRate: number;
    } {
        if (this.metrics.length === 0) {
            return {
                averageQueryTime: 0,
                averageSearchTime: 0,
                averageTotalTime: 0,
                totalTests: 0,
                passRate: 0
            };
        }

        const avgQueryTime = this.metrics.reduce((sum, m) => sum + m.queryGenerationTime, 0) / this.metrics.length;
        const avgSearchTime = this.metrics.reduce((sum, m) => sum + m.searchTime, 0) / this.metrics.length;
        const avgTotalTime = this.metrics.reduce((sum, m) => sum + m.totalTime, 0) / this.metrics.length;
        
        const passCount = this.metrics.filter(m => 
            m.queryGenerationTime <= 0.9 && m.searchTime <= 3.0
        ).length;
        
        return {
            averageQueryTime: avgQueryTime,
            averageSearchTime: avgSearchTime,
            averageTotalTime: avgTotalTime,
            totalTests: this.metrics.length,
            passRate: (passCount / this.metrics.length) * 100
        };
    }

    /**
     * Export metrics to JSON for analysis
     */
    exportMetrics(): string {
        return JSON.stringify({
            metrics: this.metrics,
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString(),
            projectInfo: {
                name: 'EPLQ - Efficient Privacy-Preserving Location-Based Query',
                version: '1.0.0',
                requirements: {
                    queryGenerationTarget: '0.9 seconds',
                    searchTarget: 'few seconds (<3s)'
                }
            }
        }, null, 2);
    }
}

// Global benchmark instance
export const benchmark = new PerformanceBenchmark();