// User registration API
const { sql } = require('@vercel/postgres');
const { hashPassword, generateToken } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    const { username, email, password, registrationPassword } = req.body;

    // Validate input
    if (!username || !email || !password || !registrationPassword) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    // Validate username length
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Check registration password
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

    // Check if username already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Benutzername bereits vergeben' });
    }

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'E-Mail-Adresse bereits registriert' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await sql`
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES (${username}, ${email}, ${passwordHash}, false)
      RETURNING id, username, email, is_admin, created_at
    `;

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    // Return user data and token
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

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
};
