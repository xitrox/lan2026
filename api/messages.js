// Consolidated Messages API
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../lib/auth');

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // GET MESSAGES
    if (method === 'GET' && action === 'list') {
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);

      const result = await sql`
        SELECT
          m.id, m.content, m.created_at, m.updated_at, m.user_id,
          u.username, u.is_admin
        FROM messages m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at ASC
        LIMIT ${limit}
      `;

      return res.status(200).json({
        success: true,
        messages: result.rows
      });
    }

    // POST MESSAGE
    if (method === 'POST' && action === 'post') {
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Nachricht darf nicht leer sein' });
      }

      const trimmedContent = content.trim();

      if (trimmedContent.length > 1024) {
        return res.status(400).json({ error: 'Nachricht zu lang (max. 1024 Zeichen)' });
      }

      const result = await sql`
        INSERT INTO messages (user_id, content)
        VALUES (${auth.user.userId}, ${trimmedContent})
        RETURNING id, content, created_at, updated_at
      `;

      const message = result.rows[0];

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
    }

    // EDIT MESSAGE
    if (method === 'PUT' && action === 'edit') {
      const { messageId, content } = req.body;

      if (!messageId || !content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Nachrichten-ID und Inhalt erforderlich' });
      }

      const trimmedContent = content.trim();

      if (trimmedContent.length > 1024) {
        return res.status(400).json({ error: 'Nachricht zu lang (max. 1024 Zeichen)' });
      }

      const messageResult = await sql`
        SELECT id, user_id FROM messages WHERE id = ${messageId}
      `;

      if (messageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Nachricht nicht gefunden' });
      }

      const message = messageResult.rows[0];

      if (message.user_id !== auth.user.userId && !auth.user.isAdmin) {
        return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieser Nachricht' });
      }

      await sql`
        UPDATE messages
        SET content = ${trimmedContent}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${messageId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Nachricht erfolgreich bearbeitet'
      });
    }

    // DELETE MESSAGE
    if (method === 'DELETE' && action === 'delete') {
      const { messageId } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: 'Nachrichten-ID erforderlich' });
      }

      const messageResult = await sql`
        SELECT id, user_id FROM messages WHERE id = ${messageId}
      `;

      if (messageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Nachricht nicht gefunden' });
      }

      const message = messageResult.rows[0];

      if (message.user_id !== auth.user.userId && !auth.user.isAdmin) {
        return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieser Nachricht' });
      }

      await sql`DELETE FROM messages WHERE id = ${messageId}`;

      return res.status(200).json({
        success: true,
        message: 'Nachricht erfolgreich gelöscht'
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
