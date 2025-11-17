// Consolidated Cabins API
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin } = require('../lib/auth');

module.exports = async (req, res) => {
  const { method } = req;
  const { action } = req.query;

  try {
    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // GET CABINS
    if (method === 'GET' && action === 'list') {
      const cabinsResult = await sql`
        SELECT
          c.id, c.name, c.url, c.image_url, c.description, c.created_at,
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
    }

    // ADD CABIN (Admin only)
    if (method === 'POST' && action === 'add') {
      const adminCheck = requireAdmin(auth);
      if (adminCheck) {
        return res.status(adminCheck.status).json({ error: adminCheck.error });
      }

      const { name, url, imageUrl, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
      }

      const result = await sql`
        INSERT INTO cabins (name, url, image_url, description, created_by)
        VALUES (${name}, ${url || null}, ${imageUrl || null}, ${description || null}, ${auth.user.userId})
        RETURNING id, name, url, image_url, description, created_at
      `;

      return res.status(201).json({
        success: true,
        message: 'Hütte erfolgreich hinzugefügt',
        cabin: result.rows[0]
      });
    }

    // VOTE
    if (method === 'POST' && action === 'vote') {
      const { cabinId, vote } = req.body;

      if (!cabinId || typeof vote !== 'boolean') {
        return res.status(400).json({ error: 'Hütten-ID und Vote-Status erforderlich' });
      }

      const cabinResult = await sql`
        SELECT id FROM cabins WHERE id = ${cabinId}
      `;

      if (cabinResult.rows.length === 0) {
        return res.status(404).json({ error: 'Hütte nicht gefunden' });
      }

      if (vote) {
        await sql`
          INSERT INTO cabin_votes (user_id, cabin_id)
          VALUES (${auth.user.userId}, ${cabinId})
          ON CONFLICT (user_id, cabin_id) DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM cabin_votes
          WHERE user_id = ${auth.user.userId} AND cabin_id = ${cabinId}
        `;
      }

      const voteCountResult = await sql`
        SELECT COUNT(*) as count
        FROM cabin_votes WHERE cabin_id = ${cabinId}
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

      const { cabinId } = req.body;

      if (!cabinId) {
        return res.status(400).json({ error: 'Hütten-ID erforderlich' });
      }

      await sql`DELETE FROM cabins WHERE id = ${cabinId}`;

      return res.status(200).json({
        success: true,
        message: 'Hütte erfolgreich gelöscht'
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Cabins API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
