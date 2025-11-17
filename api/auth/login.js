// User login API
const { sql } = require('@vercel/postgres');
const { verifyPassword, generateToken } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    // Find user by username
    const result = await sql`
      SELECT id, username, email, password_hash, is_admin
      FROM users
      WHERE username = ${username}
    `;

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const user = result.rows[0];

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data and token
    return res.status(200).json({
      success: true,
      message: 'Anmeldung erfolgreich',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Anmeldung' });
  }
};
