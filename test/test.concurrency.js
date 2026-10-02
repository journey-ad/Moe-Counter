'use strict';

const http = require('http');

const CONCURRENT_REQUESTS = 100;
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

async function testSingleCounterConcurrent() {
  console.log(`\n=== 单计数器并发测试 (${CONCURRENT_REQUESTS} 个请求) ===`);
  
  const testName = `concurrent_single_${Date.now()}`;
  
  console.log(`测试计数器: ${testName}`);
  console.log(`发送 ${CONCURRENT_REQUESTS} 个并发请求...`);
  
  const requests = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    requests.push(makeRequest(`/@${testName}`));
  }
  
  const startTime = Date.now();
  const results = await Promise.allSettled(requests);
  const endTime = Date.now();
  
  const successCount = results.filter(r => 
    r.status === 'fulfilled' && r.value.statusCode === 200
  ).length;
  const failCount = results.length - successCount;
  
  console.log(`耗时: ${endTime - startTime}ms`);
  console.log(`成功: ${successCount}/${CONCURRENT_REQUESTS}`);
  console.log(`失败: ${failCount}`);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const recordResponse = await makeRequest(`/record/@${testName}`);
  const finalCount = JSON.parse(recordResponse.body).num;
  
  console.log(`\n最终计数值: ${finalCount}`);
  console.log(`期望计数值: ${CONCURRENT_REQUESTS}`);
  
  if (finalCount === CONCURRENT_REQUESTS) {
    console.log('✓ 通过: 计数准确，无丢失或重复');
    return { success: true, finalCount, expected: CONCURRENT_REQUESTS };
  } else {
    const diff = finalCount - CONCURRENT_REQUESTS;
    console.log(`✗ 失败: 计数不准确，差异: ${diff > 0 ? '+' : ''}${diff}`);
    return { success: false, finalCount, expected: CONCURRENT_REQUESTS, diff };
  }
}

async function testMultipleCountersConcurrent() {
  console.log('\n=== 多计数器并发测试 ===');
  
  const counterCount = 10;
  const requestsPerCounter = 20;
  const totalRequests = counterCount * requestsPerCounter;
  
  console.log(`计数器数量: ${counterCount}`);
  console.log(`每个计数器请求数: ${requestsPerCounter}`);
  console.log(`总请求数: ${totalRequests}`);
  
  const counters = [];
  const requests = [];
  
  for (let i = 0; i < counterCount; i++) {
    const name = `concurrent_multi_${i}_${Date.now()}`;
    counters.push(name);
    
    for (let j = 0; j < requestsPerCounter; j++) {
      requests.push(makeRequest(`/@${name}`));
    }
  }
  
  const startTime = Date.now();
  await Promise.all(requests);
  const endTime = Date.now();
  
  console.log(`耗时: ${endTime - startTime}ms`);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let allCorrect = true;
  const results = [];
  
  for (const name of counters) {
    const response = await makeRequest(`/record/@${name}`);
    const count = JSON.parse(response.body).num;
    const correct = count === requestsPerCounter;
    
    if (!correct) {
      allCorrect = false;
    }
    
    results.push({ name, count, expected: requestsPerCounter, correct });
  }
  
  console.log('\n结果详情:');
  results.forEach(r => {
    const status = r.correct ? '✓' : '✗';
    console.log(`  ${status} ${r.name}: ${r.count}/${r.expected}`);
  });
  
  if (allCorrect) {
    console.log('\n✓ 通过: 所有计数器计数准确，互不干扰');
  } else {
    console.log('\n✗ 失败: 部分计数器计数不准确');
  }
  
  return { success: allCorrect, results };
}

async function testHighVolumeConcurrent() {
  console.log('\n=== 高并发压力测试 ===');
  
  const HIGH_REQUESTS = 500;
  const testName = `high_concurrent_${Date.now()}`;
  
  console.log(`测试计数器: ${testName}`);
  console.log(`发送 ${HIGH_REQUESTS} 个并发请求...`);
  
  const batchSize = 100;
  const batches = Math.ceil(HIGH_REQUESTS / batchSize);
  let totalSuccess = 0;
  
  const startTime = Date.now();
  
  for (let batch = 0; batch < batches; batch++) {
    const requests = [];
    const remaining = Math.min(batchSize, HIGH_REQUESTS - batch * batchSize);
    
    for (let i = 0; i < remaining; i++) {
      requests.push(makeRequest(`/@${testName}`));
    }
    
    const results = await Promise.allSettled(requests);
    const batchSuccess = results.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 200
    ).length;
    totalSuccess += batchSuccess;
    
    process.stdout.write(`\r已完成 ${Math.min((batch + 1) * batchSize, HIGH_REQUESTS)}/${HIGH_REQUESTS} 个请求，成功: ${totalSuccess}`);
  }
  
  const endTime = Date.now();
  console.log(`\n\n耗时: ${endTime - startTime}ms`);
  console.log(`成功率: ${totalSuccess}/${HIGH_REQUESTS} (${(totalSuccess/HIGH_REQUESTS*100).toFixed(1)}%)`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const recordResponse = await makeRequest(`/record/@${testName}`);
  const finalCount = JSON.parse(recordResponse.body).num;
  
  console.log(`\n最终计数值: ${finalCount}`);
  console.log(`期望计数值: ${totalSuccess}`);
  
  const success = finalCount === totalSuccess;
  
  if (success) {
    console.log('✓ 通过: 高并发下计数准确');
  } else {
    console.log(`✗ 失败: 计数不准确，差异: ${finalCount - totalSuccess}`);
  }
  
  return { success, finalCount, expected: totalSuccess };
}

async function main() {
  console.log('========================================');
  console.log('   Moe-Counter 并发访问测试');
  console.log('========================================');
  console.log(`\n服务器地址: http://${hostname}:${port}`);
  
  const serverRunning = await testHeartbeat();
  
  if (!serverRunning) {
    console.log('\n========================================');
    console.log('错误: 服务器未运行，无法继续测试');
    console.log('请先运行: pnpm start');
    console.log('========================================');
    process.exit(1);
  }
  
  const results = {
    singleCounter: await testSingleCounterConcurrent(),
    multipleCounters: await testMultipleCountersConcurrent(),
    highVolume: await testHighVolumeConcurrent()
  };
  
  console.log('\n========================================');
  console.log('        并发测试结果汇总');
  console.log('========================================');
  
  const allTests = [
    { name: '单计数器并发', result: results.singleCounter?.success },
    { name: '多计数器并发', result: results.multipleCounters?.success },
    { name: '高并发压力', result: results.highVolume?.success }
  ];
  
  let allPassed = true;
  allTests.forEach(test => {
    const status = test.result ? '✓ 通过' : '✗ 失败';
    console.log(`  ${test.name}: ${status}`);
    if (!test.result) allPassed = false;
  });
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('        ✓ 所有并发测试通过!');
  } else {
    console.log('        ✗ 部分并发测试失败');
    console.log('\n注意: 高并发场景下可能存在竞态条件问题');
    console.log('建议: 考虑使用数据库事务或锁机制');
  }
  console.log('========================================');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
