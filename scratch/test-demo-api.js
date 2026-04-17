// Quick test: login then hit dashboard stats
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port: 3000, path, method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Login
  const loginRes = await post('/api/v1/auth/login', { email: 'admin@magilamfoods.com', password: 'admin123' });
  const token = loginRes.body?.data?.token;
  if (!token) { console.log('Login failed:', JSON.stringify(loginRes.body, null, 2)); return; }
  console.log('✅ Login OK, role:', loginRes.body.data?.user?.role);

  // Dashboard stats
  const stats = await get('/api/v1/dashboard/stats', token);
  console.log('\n✅ Dashboard stats:');
  const d = stats.body.data;
  console.log('  Orders:', d.orders.total, 'total,', d.orders.pending_actions, 'pending actions');
  console.log('  Revenue: Rs.', d.revenue.total.toLocaleString('en-IN'));
  console.log('  Revenue this month: Rs.', d.revenue.this_month.toLocaleString('en-IN'));
  console.log('  Low stock alerts:', d.stock.low_stock_alerts);
  d.stock.alerts.forEach(a => console.log(`    ⚠️  ${a.name}: ${a.current} ${a.unit} (reorder: ${a.reorder_level}) — ${a.severity}`));
  console.log('  Recent orders:', d.recent_orders.length);
  d.recent_orders.forEach(o => console.log(`    📋 ${o.event_type} | ${o.event_date} | ${o.status} | Rs.${o.total_amount.toLocaleString('en-IN')}`));
}

main().catch(console.error);
