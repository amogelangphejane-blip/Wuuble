// Simple Node.js test to check if we can access the dev server
const http = require('http');

function testEndpoint(path, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
            method: 'GET'
        };

        console.log(`🔍 Testing ${description}: ${path}`);

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`✅ ${description}: Status ${res.statusCode}`);
                if (path === '/') {
                    // Check if the HTML contains expected elements
                    if (data.includes('<div id="root">')) {
                        console.log('✅ Root div found in HTML');
                    } else {
                        console.log('❌ Root div NOT found in HTML');
                    }
                    
                    if (data.includes('src="/src/main.tsx"')) {
                        console.log('✅ Main script reference found');
                    } else {
                        console.log('❌ Main script reference NOT found');
                    }
                }
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${description}: ${err.message}`);
            reject(err);
        });

        req.setTimeout(5000, () => {
            console.log(`⏰ ${description}: Request timeout`);
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting dev server tests...\n');
    
    try {
        await testEndpoint('/', 'Main page');
        await testEndpoint('/?diagnostic=true', 'Diagnostic mode');
        await testEndpoint('/src/main.tsx', 'Main TypeScript file');
        
        console.log('\n✅ All tests completed successfully');
    } catch (error) {
        console.log(`\n❌ Test failed: ${error.message}`);
        console.log('\n💡 Possible issues:');
        console.log('   - Dev server is not running');
        console.log('   - Port 8080 is blocked');
        console.log('   - Network connectivity issues');
    }
}

runTests();