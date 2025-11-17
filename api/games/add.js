// Games Add API - Any user can add a game
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

    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Spielname ist erforderlich' });
    }

    const gameName = name.trim();

    // Check if game already exists (case-insensitive)
    const existingGame = await sql`
      SELECT id FROM games WHERE LOWER(name) = LOWER(${gameName})
    `;

    if (existingGame.rows.length > 0) {
      return res.status(409).json({ error: 'Dieses Spiel existiert bereits' });
    }

    // Add game
    const result = await sql`
      INSERT INTO games (name, created_by)
      VALUES (${gameName}, ${auth.user.userId})
      RETURNING id, name, created_at
    `;

    // Automatically vote for the game the user just added
    await sql`
      INSERT INTO game_votes (user_id, game_id)
      VALUES (${auth.user.userId}, ${result.rows[0].id})
    `;

    return res.status(201).json({
      success: true,
      message: 'Spiel erfolgreich hinzugefügt',
      game: result.rows[0]
    });

  } catch (error) {
    console.error('Add game error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Hinzufügen des Spiels' });
  }
};
