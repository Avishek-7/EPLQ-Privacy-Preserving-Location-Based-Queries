#!/usr/bin/env node

/**
 * Chunked Test Runner
 * Runs tests in smaller groups to prevent memory accumulation and leaks
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define test chunks to run separately
const testChunks = [
  // Core Auth and Context Tests
  [
    'src/context/AuthContext.test.tsx',
    'src/hooks/useAuth.test.ts',
    'src/components/auth/ProtectedRoute.test.tsx'
  ],
  
  // UI Component Tests (smaller components)
  [
    'src/components/ui/BrutalistButton.test.tsx',
    'src/components/ui/BrutalistInput.test.tsx',
    'src/components/ui/BrutalistSelect.test.tsx'
  ],
  
  // Layout and Page Tests
  [
    'src/components/Layout.test.tsx',
    'src/pages/Login.test.tsx',
    'src/pages/Register.test.tsx'
  ],
  
  // Service Tests
  [
    'src/services/eplq-query.test.ts',
    'src/lib/encryption/eplq-crypto.test.ts'
  ],
  
  // Utility Tests
  [
    'src/utils/logger.test.ts'
  ],
  
  // Admin Component Tests
  [
    'src/components/admin/AdminDashboard.test.tsx',
    'src/components/admin/UserManagement.test.tsx',
    'src/components/admin/SystemStats.test.tsx'
  ],
  
  // User Component Tests
  [
    'src/components/user/UserDashboard.test.tsx',
    'src/components/user/POISearch.test.tsx'
  ]
];

// Memory configuration
const MEMORY_LIMIT = '4096'; // 4GB heap limit per chunk
const NODE_OPTIONS = `--max-old-space-size=${MEMORY_LIMIT}`;

async function runTestChunk(chunk, chunkIndex) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running Test Chunk ${chunkIndex + 1}/${testChunks.length}`);
    console.log(`📁 Files: ${chunk.join(', ')}`);
    
    // Filter out non-existent test files
    const existingFiles = chunk.filter(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      if (!exists) {
        console.log(`⚠️  Skipping ${file} (not found)`);
      }
      return exists;
    });
    
    if (existingFiles.length === 0) {
      console.log(`✅ Chunk ${chunkIndex + 1} - No valid test files, skipping`);
      resolve({ success: true, tests: 0, passed: 0, failed: 0 });
      return;
    }
    
    const vitestArgs = [
      './node_modules/.bin/vitest',
      'run',
      '--reporter=basic',
      '--run',
      ...existingFiles
    ];
    
    console.log(`🚀 Command: node ${NODE_OPTIONS} ${vitestArgs.join(' ')}`);
    
    const child = spawn('node', [NODE_OPTIONS, ...vitestArgs], {
      stdio: 'pipe',
      env: { ...process.env, NODE_OPTIONS }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    child.on('close', (code) => {
      console.log(`\n📊 Chunk ${chunkIndex + 1} completed with exit code: ${code}`);
      
      // Parse results from output
      const results = parseTestResults(stdout + stderr);
      
      if (code === 0) {
        console.log(`✅ Chunk ${chunkIndex + 1} - All tests passed`);
        resolve({ success: true, ...results });
      } else {
        console.log(`❌ Chunk ${chunkIndex + 1} - Some tests failed (exit code: ${code})`);
        resolve({ success: false, exitCode: code, ...results });
      }
      
      // Force garbage collection between chunks
      if (global.gc) {
        console.log('🧹 Running garbage collection...');
        global.gc();
      }
    });
    
    child.on('error', (err) => {
      console.error(`💥 Error running chunk ${chunkIndex + 1}:`, err);
      reject(err);
    });
  });
}

function parseTestResults(output) {
  // Basic parsing of vitest output
  const testMatch = output.match(/Tests\s+(\d+)\s+failed.*?(\d+)\s+passed/);
  const filesMatch = output.match(/Test Files\s+(\d+)\s+failed.*?(\d+)\s+passed/);
  
  return {
    tests: testMatch ? parseInt(testMatch[1]) + parseInt(testMatch[2]) : 0,
    passed: testMatch ? parseInt(testMatch[2]) : 0,
    failed: testMatch ? parseInt(testMatch[1]) : 0,
    files: filesMatch ? parseInt(filesMatch[1]) + parseInt(filesMatch[2]) : 0
  };
}

async function runAllChunks() {
  console.log('🎯 EPLQ Test Suite - Chunked Memory-Safe Runner');
  console.log('🔧 Memory Management: Isolated test chunks with cleanup');
  console.log(`💾 Heap Limit per chunk: ${MEMORY_LIMIT}MB\n`);
  
  const startTime = Date.now();
  const results = [];
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalFiles = 0;
  
  for (let i = 0; i < testChunks.length; i++) {
    try {
      // Add delay between chunks to allow memory cleanup
      if (i > 0) {
        console.log('⏳ Waiting 2s for memory cleanup...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const result = await runTestChunk(testChunks[i], i);
      results.push(result);
      
      totalTests += result.tests || 0;
      totalPassed += result.passed || 0;
      totalFailed += result.failed || 0;
      totalFiles += result.files || 0;
      
    } catch (error) {
      console.error(`💥 Fatal error in chunk ${i + 1}:`, error);
      results.push({ success: false, error: error.message });
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 FINAL RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`📁 Test Files: ${totalFiles}`);
  console.log(`🧪 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📊 Success Rate: ${totalTests ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📋 Chunk Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} Chunk ${index + 1}: ${result.passed || 0} passed, ${result.failed || 0} failed`);
  });
  
  // Exit with appropriate code
  const overallSuccess = results.every(r => r.success);
  process.exit(overallSuccess ? 0 : 1);
}

// Run the chunked test suite
runAllChunks().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});