// Consolidated Auth API
const { sql } = require('@vercel/postgres');
const { hashPassword, verifyPassword, generateToken, authenticateRequest } = require('../lib/auth');

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    // LOGIN
    if (method === 'POST' && action === 'login') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
      }

      const result = await sql`
        SELECT id, username, email, password_hash, is_admin
        FROM users WHERE username = ${username}
      `;

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      const user = result.rows[0];
      const passwordValid = await verifyPassword(password, user.password_hash);

      if (!passwordValid) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Anmeldung erfolgreich',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin
        },
        token
      });
    }

    // REGISTER
    if (method === 'POST' && action === 'register') {
      const { username, email, password, registrationPassword } = req.body;

      if (!username || !email || !password || !registrationPassword) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }

      const eventDataResult = await sql`
        SELECT registration_password FROM event_data LIMIT 1
      `;

      if (eventDataResult.rows.length === 0) {
        return res.status(500).json({ error: 'Event-Daten nicht gefunden' });
      }

      const validRegistrationPassword = eventDataResult.rows[0].registration_password;

      if (registrationPassword !== validRegistrationPassword) {
        return res.status(401).json({ error: 'Ungültiges Registrierungspasswort' });
      }

      const existingUser = await sql`
        SELECT id FROM users WHERE username = ${username}
      `;

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Benutzername bereits vergeben' });
      }

      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ error: 'E-Mail-Adresse bereits registriert' });
      }

      const passwordHash = await hashPassword(password);

      const result = await sql`
        INSERT INTO users (username, email, password_hash, is_admin)
        VALUES (${username}, ${email}, ${passwordHash}, false)
        RETURNING id, username, email, is_admin, created_at
      `;

      const user = result.rows[0];
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Registrierung erfolgreich',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin
        },
        token
      });
    }

    // VERIFY
    if (method === 'GET' && action === 'verify') {
      const auth = authenticateRequest(req);

      if (!auth.authenticated) {
        return res.status(401).json({ error: 'Ungültiges oder fehlendes Token' });
      }

      const result = await sql`
        SELECT id, username, email, is_admin
        FROM users WHERE id = ${auth.user.userId}
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
    }

    // UPDATE PROFILE
    if (method === 'POST' && action === 'update-profile') {
      const auth = authenticateRequest(req);

      if (!auth.authenticated) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }

      const { email, currentPassword, newPassword } = req.body;

      if (!email && !newPassword) {
        return res.status(400).json({ error: 'E-Mail oder neues Passwort erforderlich' });
      }

      const userResult = await sql`
        SELECT id, username, email, password_hash
        FROM users WHERE id = ${auth.user.userId}
      `;

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = userResult.rows[0];
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (email && email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
        }

        const existingEmail = await sql`
          SELECT id FROM users WHERE email = ${email} AND id != ${auth.user.userId}
        `;

        if (existingEmail.rows.length > 0) {
          return res.status(409).json({ error: 'E-Mail-Adresse bereits vergeben' });
        }

        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Aktuelles Passwort erforderlich' });
        }

        const passwordValid = await verifyPassword(currentPassword, user.password_hash);

        if (!passwordValid) {
          return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
        }

        const newPasswordHash = await hashPassword(newPassword);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(newPasswordHash);
      }

      if (updates.length > 0) {
        values.push(auth.user.userId);
        await sql.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      const updatedUser = await sql`
        SELECT id, username, email, is_admin
        FROM users WHERE id = ${auth.user.userId}
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
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
