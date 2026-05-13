const axios = require('axios');

async function testML() {
  try {
    const res = await axios.post('https://nalas-ml-service-0ghu.onrender.com/ml/predict-cost', {
      menuItemId: '262293d8-2858-4943-8932-5395ec96982f',
      quantity: 20,
      eventDate: '2026-05-13',
      guestCount: 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'nalas-ml-secret-2026'
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testML();
