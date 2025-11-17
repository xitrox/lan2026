// Messages API - Get all messages
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Get limit from query (default 100, max 500)
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);

    // Get all messages with user info
    const result = await sql`
      SELECT
        m.id,
        m.content,
        m.created_at,
        m.updated_at,
        m.user_id,
        u.username,
        u.is_admin
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at ASC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      success: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen der Nachrichten' });
  }
};
