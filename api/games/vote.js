// Game voting API - Vote or unvote for a game
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

    const { gameId, vote } = req.body;

    // Validate input
    if (!gameId || typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Spiel-ID und Vote-Status erforderlich' });
    }

    // Check if game exists
    const gameResult = await sql`
      SELECT id FROM games WHERE id = ${gameId}
    `;

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spiel nicht gefunden' });
    }

    if (vote) {
      // Add vote (ON CONFLICT DO NOTHING handles duplicate votes)
      await sql`
        INSERT INTO game_votes (user_id, game_id)
        VALUES (${auth.user.userId}, ${gameId})
        ON CONFLICT (user_id, game_id) DO NOTHING
      `;
    } else {
      // Remove vote
      await sql`
        DELETE FROM game_votes
        WHERE user_id = ${auth.user.userId} AND game_id = ${gameId}
      `;
    }

    // Get updated vote count
    const voteCountResult = await sql`
      SELECT COUNT(*) as count
      FROM game_votes
      WHERE game_id = ${gameId}
    `;

    return res.status(200).json({
      success: true,
      message: vote ? 'Vote hinzugefügt' : 'Vote entfernt',
      voteCount: parseInt(voteCountResult.rows[0].count)
    });

  } catch (error) {
    console.error('Game vote error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Voten' });
  }
};
