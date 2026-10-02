'use strict';

const http = require('http');

const hostname = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT || 3000;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
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
  console.log('\n=== 心跳检测测试 ===');
  
  try {
    const response = await makeRequest('/heart-beat');
    console.log(`状态码: ${response.statusCode}`);
    console.log(`响应内容: "${response.body}"`);
    
    const success = response.statusCode === 200 && response.body === 'alive';
    
    if (success) {
      console.log('✓ 通过: 心跳检测正常');
    } else {
      console.log('✗ 失败: 心跳检测异常');
    }
    
    return success;
  } catch (e) {
    console.log(`✗ 失败: 无法连接到服务器 - ${e.message}`);
    console.log('提示: 请先运行 "pnpm start" 启动服务器');
    return false;
  }
}

async function testCounterImage() {
  console.log('\n=== 计数器图片获取测试 ===');
  
  const testName = `test_img_${Date.now()}`;
  
  try {
    const response = await makeRequest(`/@${testName}`);
    console.log(`状态码: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Cache-Control: ${response.headers['cache-control']}`);
    console.log(`响应长度: ${response.body.length} 字符`);
    
    let success = true;
    
    if (response.statusCode !== 200) {
      console.log('✗ 失败: 状态码不是 200');
      success = false;
    }
    
    if (!response.headers['content-type']?.includes('image/svg+xml')) {
      console.log('✗ 失败: Content-Type 不是 image/svg+xml');
      success = false;
    }
    
    if (!response.body.startsWith('<?xml')) {
      console.log('✗ 失败: 响应不是有效的 XML/SVG');
      success = false;
    }
    
    if (!response.body.includes('<svg')) {
      console.log('✗ 失败: 响应不包含 SVG 元素');
      success = false;
    }
    
    if (success) {
      console.log('✓ 通过: SVG 图片生成正常');
    }
    
    return success;
  } catch (e) {
    console.log(`✗ 失败: ${e.message}`);
    return false;
  }
}

async function testRecordEndpoint() {
  console.log('\n=== 记录查询接口测试 ===');
  
  const testName = `test_record_${Date.now()}`;
  
  try {
    console.log('第一步: 获取初始记录（应该为0）');
    let response = await makeRequest(`/record/@${testName}`);
    console.log(`状态码: ${response.statusCode}`);
    console.log(`响应: ${response.body}`);
    
    let data;
    try {
      data = JSON.parse(response.body);
    } catch (e) {
      console.log('✗ 失败: 响应不是有效的 JSON');
      return false;
    }
    
    if (data.num !== 0) {
      console.log(`✗ 失败: 初始计数值应该为 0，实际为 ${data.num}`);
      return false;
    }
    
    console.log('第二步: 访问计数器图片使其自增');
    await makeRequest(`/@${testName}`);
    
    console.log('第三步: 再次获取记录（应该为1）');
    response = await makeRequest(`/record/@${testName}`);
    console.log(`响应: ${response.body}`);
    
    data = JSON.parse(response.body);
    
    if (data.num !== 1) {
      console.log(`✗ 失败: 计数值应该为 1，实际为 ${data.num}`);
      return false;
    }
    
    console.log('✓ 通过: 记录查询接口正常');
    return true;
    
  } catch (e) {
    console.log(`✗ 失败: ${e.message}`);
    return false;
  }
}

async function testHomePage() {
  console.log('\n=== 首页测试 ===');
  
  try {
    const response = await makeRequest('/');
    console.log(`状态码: ${response.statusCode}`);
    console.log(`响应长度: ${response.body.length} 字符`);
    
    let success = true;
    
    if (response.statusCode !== 200) {
      console.log('✗ 失败: 状态码不是 200');
      success = false;
    }
    
    if (!response.body.includes('html')) {
      console.log('✗ 失败: 响应不是 HTML');
      success = false;
    }
    
    if (success) {
      console.log('✓ 通过: 首页正常');
    }
    
    return success;
  } catch (e) {
    console.log(`✗ 失败: ${e.message}`);
    return false;
  }
}

async function testThemeParameter() {
  console.log('\n=== 主题参数测试 ===');
  
  const testName = `test_theme_${Date.now()}`;
  const themes = ['moebooru', 'gelbooru', 'normal-1', '3d-num'];
  
  for (const theme of themes) {
    try {
      console.log(`测试主题: ${theme}`);
      const response = await makeRequest(`/@${testName}?theme=${theme}`);
      
      if (response.statusCode !== 200) {
        console.log(`  ✗ 失败: 状态码 ${response.statusCode}`);
        return false;
      }
      
      console.log(`  ✓ 状态码: ${response.statusCode}`);
    } catch (e) {
      console.log(`  ✗ 失败: ${e.message}`);
      return false;
    }
  }
  
  console.log('测试无效主题回退...');
  try {
    const response = await makeRequest(`/@${testName}?theme=invalid-theme-12345`);
    if (response.statusCode === 200) {
      console.log('  ✓ 无效主题正常回退到默认');
    } else {
      console.log('  ✗ 失败');
      return false;
    }
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
    return false;
  }
  
  console.log('✓ 通过: 主题参数正常');
  return true;
}

async function testOtherParameters() {
  console.log('\n=== 其他参数测试 ===');
  
  const testName = `test_params_${Date.now()}`;
  
  const testCases = [
    { name: 'padding=3', query: 'padding=3' },
    { name: 'scale=0.5', query: 'scale=0.5' },
    { name: 'scale=2', query: 'scale=2' },
    { name: 'offset=-10', query: 'offset=-10' },
    { name: 'align=center', query: 'align=center' },
    { name: 'align=bottom', query: 'align=bottom' },
    { name: 'pixelated=0', query: 'pixelated=0' },
    { name: 'darkmode=1', query: 'darkmode=1' },
    { name: 'darkmode=0', query: 'darkmode=0' },
    { name: 'num=100 (固定数值)', query: 'num=100' },
    { name: 'prefix=888', query: 'prefix=888' },
    { name: 'combined params', query: 'theme=moebooru&padding=5&scale=1.5&align=center' }
  ];
  
  for (const tc of testCases) {
    try {
      console.log(`测试: ${tc.name}`);
      const response = await makeRequest(`/@${testName}?${tc.query}`);
      
      if (response.statusCode !== 200) {
        console.log(`  ✗ 失败: 状态码 ${response.statusCode}`);
        return false;
      }
      
      console.log(`  ✓ 状态码: ${response.statusCode}`);
    } catch (e) {
      console.log(`  ✗ 失败: ${e.message}`);
      return false;
    }
  }
  
  console.log('✓ 通过: 所有参数正常');
  return true;
}

async function testDemoCounter() {
  console.log('\n=== Demo 计数器测试 ===');
  
  try {
    const response = await makeRequest('/@demo');
    console.log(`状态码: ${response.statusCode}`);
    console.log(`Cache-Control: ${response.headers['cache-control']}`);
    
    let success = true;
    
    if (response.statusCode !== 200) {
      console.log('✗ 失败: 状态码不是 200');
      success = false;
    }
    
    if (success) {
      console.log('✓ 通过: Demo 计数器正常');
    }
    
    return success;
  } catch (e) {
    console.log(`✗ 失败: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('    Moe-Counter API 接口测试');
  console.log('========================================');
  console.log(`\n服务器地址: http://${hostname}:${port}`);
  
  const results = {
    heartbeat: await testHeartbeat()
  };
  
  if (!results.heartbeat) {
    console.log('\n========================================');
    console.log('错误: 服务器未运行，无法继续测试');
    console.log('请先运行: pnpm start');
    console.log('========================================');
    process.exit(1);
  }
  
  results.homePage = await testHomePage();
  results.demoCounter = await testDemoCounter();
  results.counterImage = await testCounterImage();
  results.recordEndpoint = await testRecordEndpoint();
  results.themeParameter = await testThemeParameter();
  results.otherParameters = await testOtherParameters();
  
  console.log('\n========================================');
  console.log('         测试结果汇总');
  console.log('========================================');
  
  const allTests = [
    { name: '心跳检测', result: results.heartbeat },
    { name: '首页', result: results.homePage },
    { name: 'Demo 计数器', result: results.demoCounter },
    { name: '计数器图片', result: results.counterImage },
    { name: '记录查询接口', result: results.recordEndpoint },
    { name: '主题参数', result: results.themeParameter },
    { name: '其他参数', result: results.otherParameters }
  ];
  
  let allPassed = true;
  allTests.forEach(test => {
    const status = test.result ? '✓ 通过' : '✗ 失败';
    console.log(`  ${test.name}: ${status}`);
    if (!test.result) allPassed = false;
  });
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('        ✓ 所有测试通过!');
  } else {
    console.log('        ✗ 部分测试失败');
  }
  console.log('========================================');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
