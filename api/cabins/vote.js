// Cabin voting API - Vote or unvote for a cabin
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

    const { cabinId, vote } = req.body;

    // Validate input
    if (!cabinId || typeof vote !== 'boolean') {
      return res.status(400).json({ error: 'Hütten-ID und Vote-Status erforderlich' });
    }

    // Check if cabin exists
    const cabinResult = await sql`
      SELECT id FROM cabins WHERE id = ${cabinId}
    `;

    if (cabinResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hütte nicht gefunden' });
    }

    if (vote) {
      // Add vote (ON CONFLICT DO NOTHING handles duplicate votes)
      await sql`
        INSERT INTO cabin_votes (user_id, cabin_id)
        VALUES (${auth.user.userId}, ${cabinId})
        ON CONFLICT (user_id, cabin_id) DO NOTHING
      `;
    } else {
      // Remove vote
      await sql`
        DELETE FROM cabin_votes
        WHERE user_id = ${auth.user.userId} AND cabin_id = ${cabinId}
      `;
    }

    // Get updated vote count
    const voteCountResult = await sql`
      SELECT COUNT(*) as count
      FROM cabin_votes
      WHERE cabin_id = ${cabinId}
    `;

    return res.status(200).json({
      success: true,
      message: vote ? 'Vote hinzugefügt' : 'Vote entfernt',
      voteCount: parseInt(voteCountResult.rows[0].count)
    });

  } catch (error) {
    console.error('Cabin vote error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Voten' });
  }
};
