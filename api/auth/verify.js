// Token verification API
const { authenticateRequest } = require('../../lib/auth');
const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Ungültiges oder fehlendes Token' });
    }

    // Fetch fresh user data from database
    const result = await sql`
      SELECT id, username, email, is_admin
      FROM users
      WHERE id = ${auth.user.userId}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Token-Verifizierung' });
  }
};
