// Admin: Get all users or manage users
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    // Authenticate and check admin
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    // GET: List all users
    if (req.method === 'GET') {
      const result = await sql`
        SELECT id, username, email, is_admin, created_at
        FROM users
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        success: true,
        users: result.rows
      });
    }

    // DELETE: Delete a user
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
      }

      // Prevent admin from deleting themselves
      if (userId === auth.user.userId) {
        return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
      }

      // Check if user exists
      const userResult = await sql`
        SELECT id, username FROM users WHERE id = ${userId}
      `;

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = userResult.rows[0];

      // Delete user (cascades to votes and messages)
      await sql`
        DELETE FROM users WHERE id = ${userId}
      `;

      return res.status(200).json({
        success: true,
        message: `Benutzer "${user.username}" erfolgreich gelöscht`
      });
    }

    // PUT: Toggle admin status
    if (req.method === 'PUT') {
      const { userId, isAdmin } = req.body;

      if (!userId || typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: 'Benutzer-ID und Admin-Status erforderlich' });
      }

      // Prevent admin from removing their own admin status
      if (userId === auth.user.userId && !isAdmin) {
        return res.status(400).json({ error: 'Sie können Ihren eigenen Admin-Status nicht entfernen' });
      }

      await sql`
        UPDATE users
        SET is_admin = ${isAdmin}
        WHERE id = ${userId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Admin-Status erfolgreich aktualisiert'
      });
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });

  } catch (error) {
    console.error('User management error:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Benutzerverwaltung' });
  }
};
