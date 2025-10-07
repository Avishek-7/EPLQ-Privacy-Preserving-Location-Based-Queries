import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceBenchmark } from '../utils/performance';

describe('Performance Benchmarking', () => {
    let benchmark: PerformanceBenchmark;

    beforeEach(() => {
        benchmark = new PerformanceBenchmark();
    });

    describe('Timer functionality', () => {
        it('should measure elapsed time correctly', async () => {
            benchmark.startTimer();
            await new Promise(resolve => setTimeout(resolve, 100));
            const elapsed = benchmark.endTimer();
            
            expect(elapsed).toBeGreaterThan(0.09);
            expect(elapsed).toBeLessThan(0.15);
        });
    });

    describe('Query generation benchmarking', () => {
        it('should benchmark query generation within target time', async () => {
            const mockQueryFunction = vi.fn().mockResolvedValue('query result');
            
            const queryTime = await benchmark.benchmarkQueryGeneration(mockQueryFunction);
            
            expect(mockQueryFunction).toHaveBeenCalledOnce();
            expect(queryTime).toBeGreaterThan(0);
            expect(queryTime).toBeLessThan(1); // Should be much faster in tests
        });

        it('should log performance against 0.9s target', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const fastQuery = vi.fn().mockResolvedValue('result');
            
            await benchmark.benchmarkQueryGeneration(fastQuery);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Query Generation Time:')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Target: 0.9s')
            );
        });
    });

    describe('POI search benchmarking', () => {
        it('should benchmark POI search within target time', async () => {
            const mockSearchFunction = vi.fn().mockResolvedValue(['poi1', 'poi2']);
            
            const searchTime = await benchmark.benchmarkPOISearch(mockSearchFunction);
            
            expect(mockSearchFunction).toHaveBeenCalledOnce();
            expect(searchTime).toBeGreaterThan(0);
        });

        it('should log performance against 3s target', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const fastSearch = vi.fn().mockResolvedValue([]);
            
            await benchmark.benchmarkPOISearch(fastSearch);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('POI Search Time:')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Target: <3s')
            );
        });
    });

    describe('Full benchmark suite', () => {
        it('should run complete performance benchmark', async () => {
            const operations = {
                queryGeneration: vi.fn().mockResolvedValue('query'),
                encryption: vi.fn().mockResolvedValue('encrypted'),
                search: vi.fn().mockResolvedValue(['results']),
                decryption: vi.fn().mockResolvedValue('decrypted')
            };

            const metrics = await benchmark.runFullBenchmark(operations);

            expect(operations.queryGeneration).toHaveBeenCalledOnce();
            expect(operations.encryption).toHaveBeenCalledOnce();
            expect(operations.search).toHaveBeenCalledOnce();
            expect(operations.decryption).toHaveBeenCalledOnce();

            expect(metrics).toHaveProperty('queryGenerationTime');
            expect(metrics).toHaveProperty('encryptionTime');
            expect(metrics).toHaveProperty('searchTime');
            expect(metrics).toHaveProperty('decryptionTime');
            expect(metrics).toHaveProperty('totalTime');
            expect(metrics).toHaveProperty('timestamp');

            expect(metrics.totalTime).toBe(
                metrics.queryGenerationTime + 
                metrics.encryptionTime + 
                metrics.searchTime + 
                metrics.decryptionTime
            );
        });
    });

    describe('Statistics calculation', () => {
        it('should return zero statistics for empty metrics', () => {
            const stats = benchmark.getStatistics();
            
            expect(stats.averageQueryTime).toBe(0);
            expect(stats.averageSearchTime).toBe(0);
            expect(stats.averageTotalTime).toBe(0);
            expect(stats.totalTests).toBe(0);
            expect(stats.passRate).toBe(0);
        });

        it('should calculate statistics correctly with metrics', async () => {
            // Run a few benchmark tests
            const operations = {
                queryGeneration: vi.fn().mockResolvedValue('query'),
                encryption: vi.fn().mockResolvedValue('encrypted'),
                search: vi.fn().mockResolvedValue(['results']),
                decryption: vi.fn().mockResolvedValue('decrypted')
            };

            await benchmark.runFullBenchmark(operations);
            await benchmark.runFullBenchmark(operations);

            const stats = benchmark.getStatistics();
            
            expect(stats.totalTests).toBe(2);
            expect(stats.averageQueryTime).toBeGreaterThan(0);
            expect(stats.averageSearchTime).toBeGreaterThan(0);
            expect(stats.averageTotalTime).toBeGreaterThan(0);
            expect(stats.passRate).toBeGreaterThanOrEqual(0);
            expect(stats.passRate).toBeLessThanOrEqual(100);
        });
    });

    describe('Metrics export', () => {
        it('should export metrics in correct JSON format', async () => {
            const operations = {
                queryGeneration: vi.fn().mockResolvedValue('query'),
                encryption: vi.fn().mockResolvedValue('encrypted'),
                search: vi.fn().mockResolvedValue(['results']),
                decryption: vi.fn().mockResolvedValue('decrypted')
            };

            await benchmark.runFullBenchmark(operations);
            const exported = benchmark.exportMetrics();
            const parsed = JSON.parse(exported);

            expect(parsed).toHaveProperty('metrics');
            expect(parsed).toHaveProperty('statistics');
            expect(parsed).toHaveProperty('exportDate');
            expect(parsed).toHaveProperty('projectInfo');
            
            expect(parsed.projectInfo.name).toContain('EPLQ');
            expect(parsed.projectInfo.requirements.queryGenerationTarget).toBe('0.9 seconds');
            expect(parsed.projectInfo.requirements.searchTarget).toBe('few seconds (<3s)');
        });
    });
});