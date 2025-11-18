// Consolidated Games API
const { sql } = require('../lib/db');
const { authenticateRequest, requireAdmin } = require('../lib/auth');

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // GET GAMES
    if (method === 'GET' && action === 'list') {
      const gamesResult = await sql`
        SELECT
          g.id, g.name, g.created_at,
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
    }

    // ADD GAME
    if (method === 'POST' && action === 'add') {
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Spielname ist erforderlich' });
      }

      const gameName = name.trim();

      const existingGame = await sql`
        SELECT id FROM games WHERE LOWER(name) = LOWER(${gameName})
      `;

      if (existingGame.rows.length > 0) {
        return res.status(409).json({ error: 'Dieses Spiel existiert bereits' });
      }

      const result = await sql`
        INSERT INTO games (name, created_by)
        VALUES (${gameName}, ${auth.user.userId})
        RETURNING id, name, created_at
      `;

      await sql`
        INSERT INTO game_votes (user_id, game_id)
        VALUES (${auth.user.userId}, ${result.rows[0].id})
      `;

      return res.status(201).json({
        success: true,
        message: 'Spiel erfolgreich hinzugefügt',
        game: result.rows[0]
      });
    }

    // VOTE
    if (method === 'POST' && action === 'vote') {
      const { gameId, vote } = req.body;

      if (!gameId || typeof vote !== 'boolean') {
        return res.status(400).json({ error: 'Spiel-ID und Vote-Status erforderlich' });
      }

      const gameResult = await sql`
        SELECT id FROM games WHERE id = ${gameId}
      `;

      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Spiel nicht gefunden' });
      }

      if (vote) {
        await sql`
          INSERT INTO game_votes (user_id, game_id)
          VALUES (${auth.user.userId}, ${gameId})
          ON CONFLICT (user_id, game_id) DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM game_votes
          WHERE user_id = ${auth.user.userId} AND game_id = ${gameId}
        `;
      }

      const voteCountResult = await sql`
        SELECT COUNT(*) as count
        FROM game_votes WHERE game_id = ${gameId}
      `;

      return res.status(200).json({
        success: true,
        message: vote ? 'Vote hinzugefügt' : 'Vote entfernt',
        voteCount: parseInt(voteCountResult.rows[0].count)
      });
    }

    // DELETE (Admin only)
    if (method === 'DELETE' && action === 'delete') {
      const adminCheck = requireAdmin(auth);
      if (adminCheck) {
        return res.status(adminCheck.status).json({ error: adminCheck.error });
      }

      const { gameId } = req.body;

      if (!gameId) {
        return res.status(400).json({ error: 'Spiel-ID erforderlich' });
      }

      const gameResult = await sql`
        SELECT id, name FROM games WHERE id = ${gameId}
      `;

      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Spiel nicht gefunden' });
      }

      const game = gameResult.rows[0];

      await sql`DELETE FROM games WHERE id = ${gameId}`;

      return res.status(200).json({
        success: true,
        message: `Spiel "${game.name}" erfolgreich gelöscht`
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Games API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
