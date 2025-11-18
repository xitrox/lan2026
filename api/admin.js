// Consolidated Admin API
const { sql } = require('../lib/db');
const { authenticateRequest, requireAdmin, hashPassword } = require('../lib/auth');

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    // GET USERS
    if (method === 'GET' && action === 'users') {
      const result = await sql`
        SELECT id, username, email, is_admin, is_attending, created_at
        FROM users
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        success: true,
        users: result.rows
      });
    }

    // DELETE USER
    if (method === 'DELETE' && action === 'delete-user') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
      }

      if (userId === auth.user.userId) {
        return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
      }

      const userResult = await sql`
        SELECT id, username FROM users WHERE id = ${userId}
      `;

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = userResult.rows[0];

      await sql`DELETE FROM users WHERE id = ${userId}`;

      return res.status(200).json({
        success: true,
        message: `Benutzer "${user.username}" erfolgreich gelöscht`
      });
    }

    // TOGGLE ADMIN
    if (method === 'POST' && action === 'toggle-admin') {
      const { userId, isAdmin } = req.body;

      if (!userId || typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: 'Benutzer-ID und Admin-Status erforderlich' });
      }

      if (userId === auth.user.userId && !isAdmin) {
        return res.status(400).json({ error: 'Sie können Ihren eigenen Admin-Status nicht entfernen' });
      }

      await sql`
        UPDATE users SET is_admin = ${isAdmin} WHERE id = ${userId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Admin-Status erfolgreich aktualisiert'
      });
    }

    // RESET PASSWORD
    if (method === 'POST' && action === 'reset-password') {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ error: 'Benutzer-ID und neues Passwort erforderlich' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }

      const userResult = await sql`
        SELECT id, username FROM users WHERE id = ${userId}
      `;

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = userResult.rows[0];
      const passwordHash = await hashPassword(newPassword);

      await sql`
        UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}
      `;

      return res.status(200).json({
        success: true,
        message: `Passwort für Benutzer "${user.username}" erfolgreich zurückgesetzt`
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
