// Games API - List games with vote counts
const { sql } = require('@vercel/postgres');
const { authenticateRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate request
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Get all games with vote counts and user's votes
    const gamesResult = await sql`
      SELECT
        g.id,
        g.name,
        g.created_at,
        u.username as created_by_username,
        COUNT(gv.id) as vote_count,
        EXISTS(
          SELECT 1 FROM game_votes
          WHERE game_id = g.id AND user_id = ${auth.user.userId}
        ) as user_voted
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN game_votes gv ON g.id = gv.game_id
      GROUP BY g.id, u.username
      ORDER BY vote_count DESC, g.created_at ASC
    `;

    return res.status(200).json({
      success: true,
      games: gamesResult.rows
    });

  } catch (error) {
    console.error('Get games error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen der Spiele' });
  }
};
