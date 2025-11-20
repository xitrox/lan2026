// Consolidated Event API
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

    // GET EVENT DATA
    if (method === 'GET' && action === 'get') {
      // Try to get event data with new column, fallback if column doesn't exist
      let result;
      let eventDateEnd = null;

      try {
        result = await sql`
          SELECT id, title, event_date, event_date_end, location, max_participants, created_at, updated_at
          FROM event_data
          LIMIT 1
        `;
        eventDateEnd = result.rows[0]?.event_date_end;
      } catch (error) {
        // Column might not exist yet, try without it
        console.log('Falling back to query without event_date_end column');
        result = await sql`
          SELECT id, title, event_date, location, max_participants, created_at, updated_at
          FROM event_data
          LIMIT 1
        `;
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event-Daten nicht gefunden' });
      }

      const eventData = result.rows[0];

      const usersCount = await sql`
        SELECT COUNT(*) as count FROM users WHERE is_attending = true
      `;

      return res.status(200).json({
        success: true,
        event: {
          id: eventData.id,
          title: eventData.title,
          eventDate: eventData.event_date,
          eventDateEnd: eventDateEnd,
          location: eventData.location,
          maxParticipants: eventData.max_participants,
          registeredParticipants: parseInt(usersCount.rows[0].count)
        }
      });
    }

    // UPDATE EVENT DATA (Admin only)
    if (method === 'PUT' && action === 'update') {
      const adminCheck = requireAdmin(auth);
      if (adminCheck) {
        return res.status(adminCheck.status).json({ error: adminCheck.error });
      }

      const { title, eventDate, eventDateEnd, location, maxParticipants, registrationPassword } = req.body;

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
      // Only update event_date_end if column exists (check by trying)
      if (eventDateEnd !== undefined) {
        try {
          // Test if column exists
          const testColumn = await sql`
            SELECT event_date_end FROM event_data LIMIT 1
          `;
          // Column exists, add to updates
          updates.push(`event_date_end = $${paramCount++}`);
          values.push(eventDateEnd ? new Date(eventDateEnd) : null);
        } catch (error) {
          console.log('event_date_end column does not exist yet, skipping update');
        }
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

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      await sql.query(
        `UPDATE event_data SET ${updates.join(', ')} WHERE id = 1`,
        values
      );

      // Get updated data, with fallback if column doesn't exist
      let result;
      let updatedEventDateEnd = null;

      try {
        result = await sql`
          SELECT id, title, event_date, event_date_end, location, max_participants, updated_at
          FROM event_data
          LIMIT 1
        `;
        updatedEventDateEnd = result.rows[0]?.event_date_end;
      } catch (error) {
        result = await sql`
          SELECT id, title, event_date, location, max_participants, updated_at
          FROM event_data
          LIMIT 1
        `;
      }

      return res.status(200).json({
        success: true,
        message: 'Event-Daten erfolgreich aktualisiert',
        event: {
          id: result.rows[0].id,
          title: result.rows[0].title,
          eventDate: result.rows[0].event_date,
          eventDateEnd: updatedEventDateEnd,
          location: result.rows[0].location,
          maxParticipants: result.rows[0].max_participants
        }
      });
    }

    return res.status(400).json({ error: 'Ungültige Anfrage' });

  } catch (error) {
    console.error('Event API error:', error);
    return res.status(500).json({ error: 'Serverfehler' });
  }
};
