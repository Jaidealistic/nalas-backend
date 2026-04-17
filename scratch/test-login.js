const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@magilamfoods.com',
      password: 'Admin@123'
    });
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Error Data:', err.response.data);
    } else {
      console.log('Error Message:', err.message);
    }
  }
}

testLogin();
