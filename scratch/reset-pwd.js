const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

async function resetPassword() {
  try {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const email = 'admin@magilamfoods.com';
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [passwordHash, email]
    );
    
    if (result.rowCount > 0) {
      console.log(`Password reset successfully for ${email}`);
    } else {
      console.log(`User ${email} not found.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

resetPassword();
