// Event Data Update API - Admin only
const { sql } = require('@vercel/postgres');
const { authenticateRequest, requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    // Authenticate and check admin
    const auth = authenticateRequest(req);
    const adminCheck = requireAdmin(auth);

    if (adminCheck) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    const { title, eventDate, location, maxParticipants, registrationPassword } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (eventDate !== undefined) {
      updates.push(`event_date = $${paramCount++}`);
      values.push(eventDate ? new Date(eventDate) : null);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (maxParticipants !== undefined) {
      updates.push(`max_participants = $${paramCount++}`);
      values.push(maxParticipants);
    }
    if (registrationPassword !== undefined) {
      updates.push(`registration_password = $${paramCount++}`);
      values.push(registrationPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Keine Änderungen angegeben' });
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Execute update
    await sql.query(
      `UPDATE event_data SET ${updates.join(', ')} WHERE id = 1`,
      values
    );

    // Fetch updated data
    const result = await sql`
      SELECT id, title, event_date, location, max_participants, updated_at
      FROM event_data
      LIMIT 1
    `;

    return res.status(200).json({
      success: true,
      message: 'Event-Daten erfolgreich aktualisiert',
      event: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        eventDate: result.rows[0].event_date,
        location: result.rows[0].location,
        maxParticipants: result.rows[0].max_participants
      }
    });

  } catch (error) {
    console.error('Update event data error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Aktualisieren der Event-Daten' });
  }
};
