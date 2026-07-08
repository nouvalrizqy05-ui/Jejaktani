const http = require('http');

function request(path, payload = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api' + path,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(JSON.stringify(payload));
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Login...');
  const resAdmin = await request('/auth/login', { email: 'admin@jejaktani.id', password: 'admin123' });
  console.log('Admin Login status:', resAdmin.status);
  if (resAdmin.data.token) {
    const resMe = await request('/auth/me', null, resAdmin.data.token);
    console.log('Admin /me status:', resMe.status);
    const resOverview = await request('/admin/overview', null, resAdmin.data.token);
    console.log('Admin /overview status:', resOverview.status);
    if (resOverview.status !== 200) console.log(resOverview.data);
  }

  console.log('\nTesting Buyer Login...');
  const resBuyer = await request('/auth/login', { email: 'buyer.rumahtangga@jejaktani.id', password: 'buyer123' });
  console.log('Buyer Login status:', resBuyer.status);
  if (resBuyer.data.token) {
    const resMe = await request('/auth/me', null, resBuyer.data.token);
    console.log('Buyer /me status:', resMe.status);
    const resPesanan = await request('/pesanan/mine', null, resBuyer.data.token);
    console.log('Buyer /pesanan/mine status:', resPesanan.status);
    if (resPesanan.status !== 200) console.log(resPesanan.data);
  }
}

run();
