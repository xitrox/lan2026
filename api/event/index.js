// Event Data API - Get event information
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

    // Get event data
    const result = await sql`
      SELECT id, title, event_date, location, max_participants, created_at, updated_at
      FROM event_data
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event-Daten nicht gefunden' });
    }

    const eventData = result.rows[0];

    // Get total registered users count
    const usersCount = await sql`
      SELECT COUNT(*) as count FROM users
    `;

    return res.status(200).json({
      success: true,
      event: {
        id: eventData.id,
        title: eventData.title,
        eventDate: eventData.event_date,
        location: eventData.location,
        maxParticipants: eventData.max_participants,
        registeredParticipants: parseInt(usersCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get event data error:', error);
    return res.status(500).json({ error: 'Serverfehler beim Abrufen der Event-Daten' });
  }
};
