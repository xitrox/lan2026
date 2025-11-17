// Vercel Serverless Function for RSVP handling
// This function will handle form submissions and can be extended to:
// - Store data in a database (Vercel KV, PostgreSQL, etc.)
// - Send email notifications
// - Add to Google Sheets
// - Send to Discord/Slack

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, attendance, dietary, notes } = req.body;

        // Validate required fields
        if (!name || !email || !attendance) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Create RSVP data object
        const rsvpData = {
            name,
            email,
            attendance,
            dietary: dietary || 'None',
            notes: notes || 'None',
            timestamp: new Date().toISOString()
        };

        // Log to console (visible in Vercel logs)
        console.log('New RSVP received:', rsvpData);

        // TODO: Add your preferred storage/notification method here
        // Examples:

        // 1. Store in Vercel KV (Redis-compatible)
        // const kv = require('@vercel/kv');
        // await kv.hset(`rsvp:${email}`, rsvpData);

        // 2. Send email notification (using a service like SendGrid, Resend, etc.)
        // await sendEmailNotification(rsvpData);

        // 3. Add to Google Sheets
        // await addToGoogleSheet(rsvpData);

        // 4. Store in a simple JSON file (for development)
        // Note: This won't persist in Vercel's serverless environment
        // You need a proper database or storage solution

        // For now, just return success
        return res.status(200).json({
            success: true,
            message: 'RSVP received successfully!',
            data: rsvpData
        });

    } catch (error) {
        console.error('Error processing RSVP:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Example function to send email notifications (commented out)
// You'll need to install a package like 'resend' or 'nodemailer'
/*
async function sendEmailNotification(rsvpData) {
    // Using Resend as an example (npm install resend)
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: 'organizer@email.com',
        subject: `New RSVP: ${rsvpData.name}`,
        html: `
            <h2>New LAN Party RSVP</h2>
            <p><strong>Name:</strong> ${rsvpData.name}</p>
            <p><strong>Email:</strong> ${rsvpData.email}</p>
            <p><strong>Status:</strong> ${rsvpData.attendance}</p>
            <p><strong>Dietary:</strong> ${rsvpData.dietary}</p>
            <p><strong>Notes:</strong> ${rsvpData.notes}</p>
            <p><strong>Time:</strong> ${rsvpData.timestamp}</p>
        `
    });
}
*/

// Example function to add to Google Sheets (commented out)
/*
async function addToGoogleSheet(rsvpData) {
    // Using Google Sheets API
    // You'll need to set up Google Cloud credentials
    const { GoogleSpreadsheet } = require('google-spreadsheet');
    const { JWT } = require('google-auth-library');

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow([
        rsvpData.timestamp,
        rsvpData.name,
        rsvpData.email,
        rsvpData.attendance,
        rsvpData.dietary,
        rsvpData.notes
    ]);
}
*/
