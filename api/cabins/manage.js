// Cabins Management API - Add, update, delete cabins (Admin only)
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    // Authenticate and check admin
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    // POST: Add new cabin
    if (req.method === 'POST') {
      const { name, url, imageUrl, description } = req.body;

      // Validate input
      if (!name) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
      }

      // Simple Airbnb URL parsing to extract image
      let finalImageUrl = imageUrl;
      if (!imageUrl && url && url.includes('airbnb')) {
        // Try to extract Airbnb ID for potential image fetching
        // This is a simple implementation - Airbnb's API is restricted
        finalImageUrl = null; // Could be enhanced with web scraping
      }

      // Insert cabin
      const result = await sql`
        INSERT INTO cabins (name, url, image_url, description, created_by)
        VALUES (${name}, ${url || null}, ${finalImageUrl || null}, ${description || null}, ${auth.user.userId})
        RETURNING id, name, url, image_url, description, created_at
      `;

      return res.status(201).json({
        success: true,
        message: 'Hütte erfolgreich hinzugefügt',
        cabin: result.rows[0]
      });
    }

    // PUT: Update cabin
    if (req.method === 'PUT') {
      const { cabinId, name, url, imageUrl, description } = req.body;

      if (!cabinId) {
        return res.status(400).json({ error: 'Hütten-ID erforderlich' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (url !== undefined) {
        updates.push(`url = $${paramCount++}`);
        values.push(url);
      }
      if (imageUrl !== undefined) {
        updates.push(`image_url = $${paramCount++}`);
        values.push(imageUrl);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Keine Änderungen angegeben' });
      }

      values.push(cabinId);

      await sql.query(
        `UPDATE cabins SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      return res.status(200).json({
        success: true,
        message: 'Hütte erfolgreich aktualisiert'
      });
    }

    // DELETE: Delete cabin
    if (req.method === 'DELETE') {
      const { cabinId } = req.body;

      if (!cabinId) {
        return res.status(400).json({ error: 'Hütten-ID erforderlich' });
      }

      // Delete cabin (cascades to votes)
      await sql`
        DELETE FROM cabins WHERE id = ${cabinId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Hütte erfolgreich gelöscht'
      });
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });

  } catch (error) {
    console.error('Cabin management error:', error);
    return res.status(500).json({ error: 'Serverfehler bei der Hüttenverwaltung' });
  }
};
