// Games Delete API - Admin only
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate and check admin
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { gameId } = req.body;

    // Validate input
    if (!gameId) {
      return res.status(400).json({ error: 'Spiel-ID erforderlich' });
    }

    // Check if game exists
    const gameResult = await sql`
      SELECT id, name FROM games WHERE id = ${gameId}
    `;

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spiel nicht gefunden' });
    }

    const game = gameResult.rows[0];

    // Delete game (cascades to votes)
    await sql`
      DELETE FROM games WHERE id = ${gameId}
    `;

    return res.status(200).json({
      success: true,
      message: `Spiel "${game.name}" erfolgreich gelöscht`
    });

  } catch (error) {
    console.error('Delete game error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Löschen des Spiels' });
  }
};
