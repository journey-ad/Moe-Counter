'use strict';

const { spawn } = require('child_process');
const path = require('path');

const hostname = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT || 3000;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkServerRunning() {
  console.log('\n========================================');
  console.log('    检查服务器运行状态');
  console.log('========================================');

  try {
    const response = await makeRequest('/heart-beat');
    if (response.statusCode === 200 && response.body === 'alive') {
      console.log('✓ 服务器已运行');
      return true;
    }
    console.log('✗ 服务器响应异常');
    return false;
  } catch (e) {
    console.log(`✗ 服务器未运行: ${e.message}`);
    return false;
  }
}

async function runUnitTests() {
  console.log('\n========================================');
  console.log('    运行单元测试');
  console.log('========================================');

  const exitCode = await runCommand('pnpm', ['run', 'test:unit']);
  return exitCode === 0;
}

async function runApiTests() {
  console.log('\n========================================');
  console.log('    运行 API 测试');
  console.log('========================================');

  const exitCode = await runCommand('node', [path.join(__dirname, 'test.api.js')]);
  return exitCode === 0;
}

async function runConcurrencyTests() {
  console.log('\n========================================');
  console.log('    运行并发测试');
  console.log('========================================');

  const exitCode = await runCommand('node', [path.join(__dirname, 'test.concurrency.js')]);
  return exitCode === 0;
}

async function runStabilityTests() {
  console.log('\n========================================');
  console.log('    运行稳定性测试');
  console.log('========================================');
  console.log('注意: 稳定性测试需要较长时间 (约 1-2 分钟)');

  const exitCode = await runCommand('node', [path.join(__dirname, 'test.stability.js')]);
  return exitCode === 0;
}

async function main() {
  console.log('========================================');
  console.log('   Moe-Counter 综合测试套件');
  console.log('========================================');
  console.log(`测试时间: ${new Date().toISOString()}`);

  const results = {
    unit: false,
    serverRunning: false,
    api: false,
    concurrency: false,
    stability: false
  };

  results.unit = await runUnitTests();

  results.serverRunning = await checkServerRunning();

  if (results.serverRunning) {
    results.api = await runApiTests();
    results.concurrency = await runConcurrencyTests();
    results.stability = await runStabilityTests();
  } else {
    console.log('\n========================================');
    console.log('提示: 服务器未运行，跳过 API/并发/稳定性测试');
    console.log('请先运行: pnpm start');
    console.log('========================================');
  }

  console.log('\n========================================');
  console.log('         综合测试结果汇总');
  console.log('========================================');

  const allTests = [
    { name: '单元测试', result: results.unit, skipped: false },
    { name: '服务器状态', result: results.serverRunning, skipped: false },
    { name: 'API 测试', result: results.api, skipped: !results.serverRunning },
    { name: '并发测试', result: results.concurrency, skipped: !results.serverRunning },
    { name: '稳定性测试', result: results.stability, skipped: !results.serverRunning }
  ];

  let allPassed = true;
  allTests.forEach(test => {
    let status;
    if (test.skipped) {
      status = '- 跳过 (服务器未运行)';
    } else {
      status = test.result ? '✓ 通过' : '✗ 失败';
      if (!test.result) allPassed = false;
    }
    console.log(`  ${test.name}: ${status}`);
  });

  console.log('\n========================================');
  if (allPassed) {
    console.log('        ✓ 所有运行的测试通过!');
  } else {
    console.log('        ✗ 部分测试失败');
  }
  console.log('========================================');

  console.log('\n测试命令说明:');
  console.log('  pnpm test          - 运行单元测试');
  console.log('  pnpm test:unit     - 运行单元测试 (utils + db)');
  console.log('  pnpm test:api      - 运行 API 测试 (需要服务器)');
  console.log('  pnpm test:all      - 运行综合测试套件');
  console.log('  pnpm test:concurrency - 运行并发测试 (需要服务器)');
  console.log('  pnpm test:stability   - 运行稳定性测试 (需要服务器)');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
