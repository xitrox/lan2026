// Update user profile (email and/or password)
const { sql } = require('@vercel/postgres');
const { authenticateRequest, hashPassword, verifyPassword } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow POST/PUT requests
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { email, currentPassword, newPassword } = req.body;

    // At least one field must be provided
    if (!email && !newPassword) {
      return res.status(400).json({ error: 'E-Mail oder neues Passwort erforderlich' });
    }

    // Get current user data
    const userResult = await sql`
      SELECT id, username, email, password_hash
      FROM users
      WHERE id = ${auth.user.userId}
    `;

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = userResult.rows[0];
    const updates = [];
    const values = [];

    // Update email if provided
    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
      }

      // Check if email already exists
      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${auth.user.userId}
      `;

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ error: 'E-Mail-Adresse bereits vergeben' });
      }

      updates.push('email');
      values.push(email);
    }

    // Update password if provided
    if (newPassword) {
      // Current password is required for password change
      if (!currentPassword) {
        return res.status(400).json({ error: 'Aktuelles Passwort erforderlich' });
      }

      // Verify current password
      const passwordValid = await verifyPassword(currentPassword, user.password_hash);

      if (!passwordValid) {
        return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      updates.push('password_hash');
      values.push(newPasswordHash);
    }

    // Perform update if there are changes
    if (updates.length > 0) {
      const setClause = updates.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      values.push(auth.user.userId);

      await sql.query(
        `UPDATE users SET ${setClause} WHERE id = $${values.length}`,
        values
      );
    }

    // Fetch updated user data
    const updatedUser = await sql`
      SELECT id, username, email, is_admin
      FROM users
      WHERE id = ${auth.user.userId}
    `;

    return res.status(200).json({
      success: true,
      message: 'Profil erfolgreich aktualisiert',
      user: {
        id: updatedUser.rows[0].id,
        username: updatedUser.rows[0].username,
        email: updatedUser.rows[0].email,
        isAdmin: updatedUser.rows[0].is_admin
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Profils' });
  }
};
