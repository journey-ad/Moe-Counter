'use strict';

const http = require('http');

const TEST_DURATION_SECONDS = 30;
const hostname = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT || 3000;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
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
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testHeartbeat() {
  console.log('\n=== 服务器连接检测 ===');
  
  try {
    const response = await makeRequest('/heart-beat');
    
    if (response.statusCode === 200 && response.body === 'alive') {
      console.log('✓ 服务器运行正常');
      return true;
    } else {
      console.log('✗ 服务器响应异常');
      return false;
    }
  } catch (e) {
    console.log(`✗ 无法连接到服务器: ${e.message}`);
    console.log('提示: 请先运行 "pnpm start" 启动服务器');
    return false;
  }
}

async function testContinuousRequests() {
  console.log(`\n=== 连续请求稳定性测试 (${TEST_DURATION_SECONDS} 秒) ===`);
  
  const testName = `stability_continuous_${Date.now()}`;
  let requestCount = 0;
  let errorCount = 0;
  const errors = [];
  
  const endTime = Date.now() + TEST_DURATION_SECONDS * 1000;
  
  console.log(`测试计数器: ${testName}`);
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log('开始发送请求...');
  
  while (Date.now() < endTime) {
    try {
      const response = await makeRequest(`/@${testName}`);
      requestCount++;
      
      if (response.statusCode !== 200) {
        errorCount++;
        errors.push(`Request ${requestCount}: status ${response.statusCode}`);
      }
      
      if (requestCount % 100 === 0) {
        process.stdout.write(`\r已发送 ${requestCount} 个请求，错误: ${errorCount}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (e) {
      errorCount++;
      errors.push(`Request ${requestCount + 1}: ${e.message}`);
    }
  }
  
  console.log(`\n\n结束时间: ${new Date().toISOString()}`);
  console.log(`总请求数: ${requestCount}`);
  console.log(`错误数: ${errorCount}`);
  console.log(`成功率: ${((requestCount - errorCount)/requestCount*100).toFixed(2)}%`);
  
  if (errors.length > 0) {
    console.log('\n错误详情:');
    errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    if (errors.length > 10) {
      console.log(`  ... 还有 ${errors.length - 10} 个错误`);
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const recordResponse = await makeRequest(`/record/@${testName}`);
  const finalCount = JSON.parse(recordResponse.body).num;
  
  console.log(`\n最终计数值: ${finalCount}`);
  console.log(`期望计数值: ${requestCount}`);
  
  const countCorrect = finalCount === requestCount;
  
  if (countCorrect) {
    console.log('✓ 通过: 计数准确');
  } else {
    console.log(`✗ 失败: 计数不准确，差异: ${finalCount - requestCount}`);
  }
  
  const success = errorCount === 0 && countCorrect;
  
  if (success) {
    console.log('✓ 通过: 连续请求稳定性测试通过');
  } else {
    console.log('✗ 失败: 连续请求稳定性测试失败');
  }
  
  return { 
    success, 
    requestCount, 
    errorCount, 
    finalCount,
    expected: requestCount,
    countCorrect
  };
}

async function testHighFrequency() {
  console.log('\n=== 高频请求稳定性测试 ===');
  
  const testName = `stability_high_freq_${Date.now()}`;
  const BATCH_SIZE = 50;
  const BATCH_COUNT = 20;
  const totalRequests = BATCH_SIZE * BATCH_COUNT;
  
  console.log(`测试计数器: ${testName}`);
  console.log(`批量大小: ${BATCH_SIZE}`);
  console.log(`批量数量: ${BATCH_COUNT}`);
  console.log(`总请求数: ${totalRequests}`);
  
  let requestCount = 0;
  let errorCount = 0;
  
  const startTime = Date.now();
  
  for (let batch = 0; batch < BATCH_COUNT; batch++) {
    const requests = [];
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      requests.push(makeRequest(`/@${testName}`));
    }
    
    const results = await Promise.allSettled(requests);
    
    const batchSuccess = results.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 200
    ).length;
    
    requestCount += BATCH_SIZE;
    errorCount += BATCH_SIZE - batchSuccess;
    
    process.stdout.write(`\r批量 ${batch + 1}/${BATCH_COUNT} 完成，成功: ${batchSuccess}/${BATCH_SIZE}`);
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const endTime = Date.now();
  
  console.log(`\n\n耗时: ${endTime - startTime}ms`);
  console.log(`总请求: ${requestCount}`);
  console.log(`错误数: ${errorCount}`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const recordResponse = await makeRequest(`/record/@${testName}`);
  const finalCount = JSON.parse(recordResponse.body).num;
  
  console.log(`\n最终计数值: ${finalCount}`);
  console.log(`期望计数值: ${requestCount - errorCount}`);
  
  const countCorrect = finalCount === (requestCount - errorCount);
  const success = errorCount === 0 && countCorrect;
  
  if (success) {
    console.log('✓ 通过: 高频请求稳定性测试通过');
  } else {
    console.log('✗ 失败: 高频请求稳定性测试失败');
  }
  
  return { success, requestCount, errorCount, finalCount };
}

async function testMultipleEndpoints() {
  console.log('\n=== 多端点稳定性测试 ===');
  
  const testName = `stability_multi_endpoint_${Date.now()}`;
  
  const endpoints = [
    `/@${testName}`,
    `/@${testName}?theme=moebooru`,
    `/@${testName}?theme=gelbooru`,
    `/@${testName}?padding=3`,
    `/@${testName}?scale=1.5`,
    `/@${testName}?align=center`,
    `/@${testName}?pixelated=0`,
    `/@${testName}?darkmode=1`,
    `/record/@${testName}`,
    '/heart-beat'
  ];
  
  console.log(`测试端点数量: ${endpoints.length}`);
  console.log(`循环次数: 20`);
  
  let requestCount = 0;
  let errorCount = 0;
  
  for (let loop = 0; loop < 20; loop++) {
    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest(endpoint);
        requestCount++;
        
        if (response.statusCode !== 200) {
          errorCount++;
          console.log(`\n端点 ${endpoint} 返回状态码 ${response.statusCode}`);
        }
      } catch (e) {
        errorCount++;
        console.log(`\n端点 ${endpoint} 错误: ${e.message}`);
      }
    }
    
    process.stdout.write(`\r循环 ${loop + 1}/20 完成，请求: ${requestCount}，错误: ${errorCount}`);
  }
  
  console.log(`\n\n总请求: ${requestCount}`);
  console.log(`错误数: ${errorCount}`);
  
  const success = errorCount === 0;
  
  if (success) {
    console.log('✓ 通过: 多端点稳定性测试通过');
  } else {
    console.log('✗ 失败: 多端点稳定性测试失败');
  }
  
  return { success, requestCount, errorCount };
}

async function main() {
  console.log('========================================');
  console.log('   Moe-Counter 稳定性测试');
  console.log('========================================');
  console.log(`\n服务器地址: http://${hostname}:${port}`);
  console.log(`测试时间: ${new Date().toISOString()}`);
  
  const serverRunning = await testHeartbeat();
  
  if (!serverRunning) {
    console.log('\n========================================');
    console.log('错误: 服务器未运行，无法继续测试');
    console.log('请先运行: pnpm start');
    console.log('========================================');
    process.exit(1);
  }
  
  const results = {
    continuous: await testContinuousRequests(),
    highFrequency: await testHighFrequency(),
    multipleEndpoints: await testMultipleEndpoints()
  };
  
  console.log('\n========================================');
  console.log('       稳定性测试结果汇总');
  console.log('========================================');
  
  const allTests = [
    { name: '连续请求', result: results.continuous?.success },
    { name: '高频请求', result: results.highFrequency?.success },
    { name: '多端点', result: results.multipleEndpoints?.success }
  ];
  
  let allPassed = true;
  allTests.forEach(test => {
    const status = test.result ? '✓ 通过' : '✗ 失败';
    console.log(`  ${test.name}: ${status}`);
    if (!test.result) allPassed = false;
  });
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('       ✓ 所有稳定性测试通过!');
  } else {
    console.log('       ✗ 部分稳定性测试失败');
    console.log('\n注意: 稳定性测试失败可能表明:');
    console.log('  - 服务器在高负载下不稳定');
    console.log('  - 存在竞态条件问题');
    console.log('  - 数据库连接或操作存在问题');
  }
  console.log('========================================');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
