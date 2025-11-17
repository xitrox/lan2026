// Messages Post API - Create a new message
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { content } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Nachricht darf nicht leer sein' });
    }

    const trimmedContent = content.trim();

    // Check length (max 1024 characters)
    if (trimmedContent.length > 1024) {
      return res.status(400).json({ error: 'Nachricht zu lang (max. 1024 Zeichen)' });
    }

    // Insert message
    const result = await sql`
      INSERT INTO messages (user_id, content)
      VALUES (${auth.user.userId}, ${trimmedContent})
      RETURNING id, content, created_at, updated_at
    `;

    const message = result.rows[0];

    // Get user info
    const userResult = await sql`
      SELECT username, is_admin FROM users WHERE id = ${auth.user.userId}
    `;

    return res.status(201).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        updated_at: message.updated_at,
        user_id: auth.user.userId,
        username: userResult.rows[0].username,
        is_admin: userResult.rows[0].is_admin
      }
    });

  } catch (error) {
    console.error('Post message error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Senden der Nachricht' });
  }
};
