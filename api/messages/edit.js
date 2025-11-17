// Messages Edit API - Edit own message
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { messageId, content } = req.body;

    // Validate input
    if (!messageId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Nachrichten-ID und Inhalt erforderlich' });
    }

    const trimmedContent = content.trim();

    // Check length (max 1024 characters)
    if (trimmedContent.length > 1024) {
      return res.status(400).json({ error: 'Nachricht zu lang (max. 1024 Zeichen)' });
    }

    // Check if message exists and belongs to user
    const messageResult = await sql`
      SELECT id, user_id FROM messages WHERE id = ${messageId}
    `;

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }

    const message = messageResult.rows[0];

    // Only allow editing own messages (unless admin)
    if (message.user_id !== auth.user.userId && !auth.user.isAdmin) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieser Nachricht' });
    }

    // Update message
    await sql`
      UPDATE messages
      SET content = ${trimmedContent}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${messageId}
    `;

    return res.status(200).json({
      success: true,
      message: 'Nachricht erfolgreich bearbeitet'
    });

  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Bearbeiten der Nachricht' });
  }
};
