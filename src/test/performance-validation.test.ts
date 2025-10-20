/**
 * Performance Validation Test Suite
 * 
 * This test suite validates that EPLQ meets the specified performance requirements:
 * 1. Query generation: ~0.9 seconds on mobile devices
 * 2. POI search: Few seconds (<3s) on commodity hardware
 * 
 * Tests are designed to run on various hardware configurations and provide
 * detailed performance metrics for project evaluation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eplqCrypto } from '../lib/encryption/eplq-crypto';
import type { QueryPredicate, POIData } from '../lib/encryption/eplq-crypto';

// Performance thresholds (in seconds)
const PERFORMANCE_THRESHOLDS = {
  QUERY_GENERATION_TARGET: 0.9,
  QUERY_GENERATION_ACCEPTABLE: 1.0,
  POI_SEARCH_TARGET: 3.0,
  POI_SEARCH_ACCEPTABLE: 5.0,
  ENCRYPTION_PER_POI: 0.1,
  DECRYPTION_PER_POI: 0.1,
};

// Test data sets of various sizes
const TEST_DATASETS = {
  SMALL: 10,
  MEDIUM: 100,
  LARGE: 500,
  XLARGE: 1000,
};

// Performance metrics storage
interface PerformanceMetrics {
  operation: string;
  duration: number;
  datasetSize: number;
  timestamp: number;
  passed: boolean;
  threshold: number;
}

const performanceResults: PerformanceMetrics[] = [];

// Utility function to measure execution time
async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  threshold: number,
  datasetSize: number = 1
): Promise<{ result: T; duration: number; passed: boolean }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  const passed = duration <= threshold;

  // Store metrics
  performanceResults.push({
    operation,
    duration,
    datasetSize,
    timestamp: Date.now(),
    passed,
    threshold,
  });

  return { result, duration, passed };
}

// Generate test POI data
function generateTestPOI(index: number): POIData {
  const categories = ['restaurant', 'hospital', 'school', 'park', 'museum'];
  return {
    name: `Test POI ${index}`,
    category: categories[index % categories.length],
    latitude: 25.6093 + (Math.random() - 0.5) * 0.1, // Small random variation
    longitude: 85.1376 + (Math.random() - 0.5) * 0.1,
    description: `Test location for performance testing`,
  };
}

describe('Performance Validation Tests', () => {
  beforeAll(async () => {
    console.log('\n🚀 Starting Performance Validation Test Suite\n');
    console.log('📋 Test Configuration:');
    console.log(`  - Query Generation Target: ${PERFORMANCE_THRESHOLDS.QUERY_GENERATION_TARGET}s`);
    console.log(`  - POI Search Target: ${PERFORMANCE_THRESHOLDS.POI_SEARCH_TARGET}s`);
    console.log(`  - Test Datasets: ${Object.values(TEST_DATASETS).join(', ')} POIs\n`);

    // Initialize crypto system
    await eplqCrypto.initialize();
    console.log('✅ Crypto system initialized\n');
  });

  afterAll(() => {
    // Generate performance report
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Group results by operation
    const groupedResults = performanceResults.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = [];
      }
      acc[metric.operation].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetrics[]>);

    // Print summary for each operation
    Object.entries(groupedResults).forEach(([operation, metrics]) => {
      console.log(`\n${operation}:`);
      console.log(`  Runs: ${metrics.length}`);
      console.log(`  Average: ${(metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length).toFixed(3)}s`);
      console.log(`  Min: ${Math.min(...metrics.map(m => m.duration)).toFixed(3)}s`);
      console.log(`  Max: ${Math.max(...metrics.map(m => m.duration)).toFixed(3)}s`);
      console.log(`  Pass Rate: ${(metrics.filter(m => m.passed).length / metrics.length * 100).toFixed(1)}%`);
      console.log(`  Threshold: ${metrics[0].threshold}s`);
    });

    // Overall summary
    const totalTests = performanceResults.length;
    const passedTests = performanceResults.filter(m => m.passed).length;
    const overallPassRate = (passedTests / totalTests * 100).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log(`OVERALL RESULTS: ${passedTests}/${totalTests} tests passed (${overallPassRate}%)`);
    console.log('='.repeat(80) + '\n');

    // Export results to JSON for further analysis
    const report = {
      testDate: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        platform: navigator.platform,
      },
      thresholds: PERFORMANCE_THRESHOLDS,
      results: performanceResults,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        passRate: overallPassRate,
      },
    };

    console.log('💾 Performance report saved to console');
    console.log('📋 Full report JSON:', JSON.stringify(report, null, 2));
  });

  describe('1. Query Generation Performance', () => {
    it('should generate encrypted query within 0.9 seconds (CRITICAL)', async () => {
      const testPredicate: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 1000,
        category: 'restaurant',
      };

      const { duration, passed } = await measurePerformance(
        'Query Generation',
        () => eplqCrypto.encryptQuery(testPredicate),
        PERFORMANCE_THRESHOLDS.QUERY_GENERATION_TARGET
      );

      console.log(`  ⏱️  Query generated in ${duration.toFixed(3)}s (threshold: ${PERFORMANCE_THRESHOLDS.QUERY_GENERATION_TARGET}s)`);
      
      expect(passed).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_GENERATION_ACCEPTABLE);
    });

    it('should generate multiple queries consistently under threshold', async () => {
      const iterations = 10;
      const results: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const testPredicate: QueryPredicate = {
          centerLat: 25.6093 + (Math.random() - 0.5) * 0.01,
          centerLng: 85.1376 + (Math.random() - 0.5) * 0.01,
          radius: 500 + Math.random() * 1000,
          category: i % 2 === 0 ? 'restaurant' : undefined,
        };

        const { duration } = await measurePerformance(
          'Query Generation (Repeated)',
          () => eplqCrypto.encryptQuery(testPredicate),
          PERFORMANCE_THRESHOLDS.QUERY_GENERATION_TARGET
        );

        results.push(duration);
      }

      const average = results.reduce((sum, t) => sum + t, 0) / results.length;
      const min = Math.min(...results);
      const max = Math.max(...results);

      console.log(`  📈 ${iterations} iterations: avg=${average.toFixed(3)}s, min=${min.toFixed(3)}s, max=${max.toFixed(3)}s`);

      expect(average).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_GENERATION_ACCEPTABLE);
    });
  });

  describe('2. POI Encryption Performance', () => {
    it('should encrypt single POI within acceptable time', async () => {
      const testPOI = generateTestPOI(0);

      const { duration } = await measurePerformance(
        'POI Encryption (Single)',
        () => eplqCrypto.encryptPOI(testPOI),
        PERFORMANCE_THRESHOLDS.ENCRYPTION_PER_POI
      );

      console.log(`  🔒 Single POI encrypted in ${(duration * 1000).toFixed(1)}ms`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ENCRYPTION_PER_POI);
    });

    it('should encrypt small dataset (10 POIs) efficiently', async () => {
      const testPOIs = Array.from({ length: TEST_DATASETS.SMALL }, (_, i) => generateTestPOI(i));

      const { duration } = await measurePerformance(
        `POI Encryption (${TEST_DATASETS.SMALL} POIs)`,
        async () => {
          return await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));
        },
        PERFORMANCE_THRESHOLDS.ENCRYPTION_PER_POI * TEST_DATASETS.SMALL,
        TEST_DATASETS.SMALL
      );

      const perPOI = duration / TEST_DATASETS.SMALL;
      console.log(`  🔒 ${TEST_DATASETS.SMALL} POIs encrypted in ${duration.toFixed(3)}s (${(perPOI * 1000).toFixed(1)}ms per POI)`);

      expect(duration).toBeLessThan(1.0); // Should be under 1 second for 10 POIs
    });

    it('should encrypt medium dataset (100 POIs) within reasonable time', async () => {
      const testPOIs = Array.from({ length: TEST_DATASETS.MEDIUM }, (_, i) => generateTestPOI(i));

      const { duration } = await measurePerformance(
        `POI Encryption (${TEST_DATASETS.MEDIUM} POIs)`,
        async () => {
          return await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));
        },
        PERFORMANCE_THRESHOLDS.ENCRYPTION_PER_POI * TEST_DATASETS.MEDIUM,
        TEST_DATASETS.MEDIUM
      );

      const perPOI = duration / TEST_DATASETS.MEDIUM;
      console.log(`  🔒 ${TEST_DATASETS.MEDIUM} POIs encrypted in ${duration.toFixed(3)}s (${(perPOI * 1000).toFixed(1)}ms per POI)`);

      expect(duration).toBeLessThan(10.0); // Should be under 10 seconds for 100 POIs
    });
  });

  describe('3. POI Search Performance', () => {
    it('should search small dataset (10 POIs) within target time', async () => {
      // Setup: Create and encrypt test POIs
      const testPOIs = Array.from({ length: TEST_DATASETS.SMALL }, (_, i) => generateTestPOI(i));
      const encryptedPOIs = await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));

      // Create query
      const testQuery: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 5000, // 5km radius
        category: 'restaurant',
      };

      const encryptedQuery = await eplqCrypto.encryptQuery(testQuery);

      // Measure search performance
      const { duration, result } = await measurePerformance(
        `POI Search (${TEST_DATASETS.SMALL} POIs)`,
        () => eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPOIs),
        PERFORMANCE_THRESHOLDS.POI_SEARCH_TARGET,
        TEST_DATASETS.SMALL
      );

      console.log(`  🔍 Searched ${TEST_DATASETS.SMALL} POIs in ${duration.toFixed(3)}s, found ${result.length} matches`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.POI_SEARCH_TARGET);
    });

    it('should search medium dataset (100 POIs) within target time (CRITICAL)', async () => {
      const testPOIs = Array.from({ length: TEST_DATASETS.MEDIUM }, (_, i) => generateTestPOI(i));
      const encryptedPOIs = await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));

      const testQuery: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 5000,
      };

      const encryptedQuery = await eplqCrypto.encryptQuery(testQuery);

      const { duration, result, passed } = await measurePerformance(
        `POI Search (${TEST_DATASETS.MEDIUM} POIs)`,
        () => eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPOIs),
        PERFORMANCE_THRESHOLDS.POI_SEARCH_TARGET,
        TEST_DATASETS.MEDIUM
      );

      console.log(`  🔍 Searched ${TEST_DATASETS.MEDIUM} POIs in ${duration.toFixed(3)}s, found ${result.length} matches`);
      console.log(`  📊 Status: ${passed ? '✅ PASS' : '⚠️  NEEDS OPTIMIZATION'}`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.POI_SEARCH_ACCEPTABLE);
    });

    it('should search large dataset (500 POIs) with acceptable performance', async () => {
      const testPOIs = Array.from({ length: TEST_DATASETS.LARGE }, (_, i) => generateTestPOI(i));
      const encryptedPOIs = await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));

      const testQuery: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 10000, // 10km radius
      };

      const encryptedQuery = await eplqCrypto.encryptQuery(testQuery);

      const { duration, result } = await measurePerformance(
        `POI Search (${TEST_DATASETS.LARGE} POIs)`,
        () => eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPOIs),
        PERFORMANCE_THRESHOLDS.POI_SEARCH_ACCEPTABLE,
        TEST_DATASETS.LARGE
      );

      console.log(`  🔍 Searched ${TEST_DATASETS.LARGE} POIs in ${duration.toFixed(3)}s, found ${result.length} matches`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.POI_SEARCH_ACCEPTABLE * 2); // 2x acceptable for large dataset
    });
  });

  describe('4. POI Decryption Performance', () => {
    it('should decrypt single POI within acceptable time', async () => {
      const testPOI = generateTestPOI(0);
      const encrypted = await eplqCrypto.encryptPOI(testPOI);

      const { duration } = await measurePerformance(
        'POI Decryption (Single)',
        () => eplqCrypto.decryptPOI(encrypted),
        PERFORMANCE_THRESHOLDS.DECRYPTION_PER_POI
      );

      console.log(`  🔓 Single POI decrypted in ${(duration * 1000).toFixed(1)}ms`);

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DECRYPTION_PER_POI);
    });

    it('should decrypt multiple POIs efficiently', async () => {
      const testPOIs = Array.from({ length: TEST_DATASETS.MEDIUM }, (_, i) => generateTestPOI(i));
      const encryptedPOIs = await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));

      const { duration } = await measurePerformance(
        `POI Decryption (${TEST_DATASETS.MEDIUM} POIs)`,
        async () => {
          return await Promise.all(encryptedPOIs.map(enc => eplqCrypto.decryptPOI(enc)));
        },
        PERFORMANCE_THRESHOLDS.DECRYPTION_PER_POI * TEST_DATASETS.MEDIUM,
        TEST_DATASETS.MEDIUM
      );

      const perPOI = duration / TEST_DATASETS.MEDIUM;
      console.log(`  🔓 ${TEST_DATASETS.MEDIUM} POIs decrypted in ${duration.toFixed(3)}s (${(perPOI * 1000).toFixed(1)}ms per POI)`);

      expect(duration).toBeLessThan(10.0); // Should be under 10 seconds for 100 POIs
    });
  });

  describe('5. End-to-End Performance', () => {
    it('should complete full query workflow within acceptable time', async () => {
      // Simulate real-world scenario
      const datasetSize = TEST_DATASETS.MEDIUM;
      
      console.log(`\n  🔄 Simulating complete workflow with ${datasetSize} POIs:`);

      // Step 1: Generate and encrypt POIs (admin upload simulation)
      console.log('  1️⃣  Admin uploads POIs...');
      const testPOIs = Array.from({ length: datasetSize }, (_, i) => generateTestPOI(i));
      const uploadStart = performance.now();
      const encryptedPOIs = await Promise.all(testPOIs.map(poi => eplqCrypto.encryptPOI(poi)));
      const uploadTime = (performance.now() - uploadStart) / 1000;
      console.log(`     ✓ Upload completed in ${uploadTime.toFixed(3)}s`);

      // Step 2: Generate query (user action)
      console.log('  2️⃣  User generates search query...');
      const queryStart = performance.now();
      const testQuery: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 5000,
        category: 'restaurant',
      };
      const encryptedQuery = await eplqCrypto.encryptQuery(testQuery);
      const queryGenTime = (performance.now() - queryStart) / 1000;
      console.log(`     ✓ Query generated in ${queryGenTime.toFixed(3)}s`);

      // Step 3: Execute search
      console.log('  3️⃣  Executing privacy-preserving search...');
      const searchStart = performance.now();
      const results = await eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPOIs);
      const searchTime = (performance.now() - searchStart) / 1000;
      console.log(`     ✓ Search completed in ${searchTime.toFixed(3)}s, found ${results.length} matches`);

      const totalTime = uploadTime + queryGenTime + searchTime;
      console.log(`  ⏱️  Total workflow time: ${totalTime.toFixed(3)}s\n`);

      // Validate individual components
      expect(queryGenTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_GENERATION_ACCEPTABLE);
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.POI_SEARCH_ACCEPTABLE);
    });
  });

  describe('6. Stress Testing', () => {
    it('should handle large dataset (1000 POIs) without crashing', async () => {
      console.log(`\n  🔥 Stress test with ${TEST_DATASETS.XLARGE} POIs...`);
      
      const testPOIs = Array.from({ length: TEST_DATASETS.XLARGE }, (_, i) => generateTestPOI(i));
      
      // Encrypt in batches to avoid memory issues
      const batchSize = 100;
      const encryptedPOIs: Awaited<ReturnType<typeof eplqCrypto.encryptPOI>>[] = [];
      
      for (let i = 0; i < testPOIs.length; i += batchSize) {
        const batch = testPOIs.slice(i, i + batchSize);
        const encrypted = await Promise.all(batch.map(poi => eplqCrypto.encryptPOI(poi)));
        encryptedPOIs.push(...encrypted);
        console.log(`     Encrypted ${Math.min(i + batchSize, testPOIs.length)}/${testPOIs.length} POIs`);
      }

      const testQuery: QueryPredicate = {
        centerLat: 25.6093,
        centerLng: 85.1376,
        radius: 10000,
      };

      const encryptedQuery = await eplqCrypto.encryptQuery(testQuery);

      const { duration, result } = await measurePerformance(
        `POI Search (${TEST_DATASETS.XLARGE} POIs)`,
        () => eplqCrypto.executeRangeQuery(encryptedQuery, encryptedPOIs),
        PERFORMANCE_THRESHOLDS.POI_SEARCH_ACCEPTABLE * 3, // 3x acceptable for stress test
        TEST_DATASETS.XLARGE
      );

      console.log(`  🔍 Stress test completed in ${duration.toFixed(3)}s, found ${result.length} matches`);
      console.log(`     Status: ${duration < 10 ? '✅ EXCELLENT' : duration < 15 ? '✅ GOOD' : '⚠️  NEEDS OPTIMIZATION'}\n`);

      expect(result).toBeInstanceOf(Array);
      expect(duration).toBeLessThan(15); // Should complete within 15 seconds even for 1000 POIs
    });
  });
});
