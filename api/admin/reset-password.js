// Admin: Reset user password
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin, hashPassword } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate and check admin
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { userId, newPassword } = req.body;

    // Validate input
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Benutzer-ID und neues Passwort erforderlich' });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Check if user exists
    const userResult = await sql`
      SELECT id, username FROM users WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${userId}
    `;

    return res.status(200).json({
      success: true,
      message: `Passwort für Benutzer "${user.username}" erfolgreich zurückgesetzt`
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Zurücksetzen des Passworts' });
  }
};
