// Cabins API - List cabins with vote counts
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

    // Get all cabins with vote counts and user's votes
    const cabinsResult = await sql`
      SELECT
        c.id,
        c.name,
        c.url,
        c.image_url,
        c.description,
        c.created_at,
        COUNT(cv.id) as vote_count,
        EXISTS(
          SELECT 1 FROM cabin_votes
          WHERE cabin_id = c.id AND user_id = ${auth.user.userId}
        ) as user_voted
      FROM cabins c
      LEFT JOIN cabin_votes cv ON c.id = cv.cabin_id
      GROUP BY c.id
      ORDER BY vote_count DESC, c.created_at DESC
    `;

    return res.status(200).json({
      success: true,
      cabins: cabinsResult.rows
    });

  } catch (error) {
    console.error('Get cabins error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen der Hütten' });
  }
};
