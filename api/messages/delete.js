// Messages Delete API - Delete own message or admin can delete any
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { messageId } = req.body;

    // Validate input
    if (!messageId) {
      return res.status(400).json({ error: 'Nachrichten-ID erforderlich' });
    }

    // Check if message exists
    const messageResult = await sql`
      SELECT id, user_id FROM messages WHERE id = ${messageId}
    `;

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }

    const message = messageResult.rows[0];

    // Only allow deleting own messages (unless admin)
    if (message.user_id !== auth.user.userId && !auth.user.isAdmin) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieser Nachricht' });
    }

    // Delete message
    await sql`
      DELETE FROM messages WHERE id = ${messageId}
    `;

    return res.status(200).json({
      success: true,
      message: 'Nachricht erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Löschen der Nachricht' });
  }
};
