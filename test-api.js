const http = require('http');

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  // Test 1: Health Check
  await testEndpoint('GET', '/health', null);
  
  // Test 2: Root endpoint
  await testEndpoint('GET', '/', null);
  
  // Test 3: Get submissions for phase 1
  await testEndpoint('GET', '/api/submissions/phase/1', null);
  
  // Test 4: Get velocity data
  await testEndpoint('GET', '/api/teams/1/velocity/1', null);
  
  console.log('\n✅ All tests completed!');
  process.exit(0);
}

function testEndpoint(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`${method} ${path}`);
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Response:', data);
        }
        
        console.log('---\n');
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`❌ ${method} ${path} failed:`, err.message);
      console.log('---\n');
      resolve(); // Continue with other tests
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

testAPI();
