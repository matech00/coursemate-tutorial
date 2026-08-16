const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, full_name, email, subject, message } = req.body;

        if (!to || !full_name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
        if (!gmailAppPassword) {
            return res.status(500).json({ error: 'Missing Gmail password' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'coursematetutorial@gmail.com',
                pass: gmailAppPassword,
            },
        });

        await transporter.verify();

        const fromEmail = '"CourseMate Tutorial" <coursematetutorial@gmail.com>';

        // Handle both array and string for 'to'
        const recipients = Array.isArray(to) ? to : [to];

        await transporter.sendMail({
            from: fromEmail,
            to: recipients,
            subject: `📬 New Feedback: ${subject}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; color: #333;">
                    <div style="border-bottom: 2px solid #008751; padding-bottom: 10px; margin-bottom: 20px;">
                        <h2 style="color: #008751; margin: 0;">CourseMate Tutorial</h2>
                        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">New Feedback Received</p>
                    </div>

                    <p style="font-weight: 600; font-size: 14px; color: #374151;">From: ${full_name}</p>
                    <p style="color: #6b7280; font-size: 13px; margin-top: -4px;">Email: ${email}</p>

                    <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
                    </div>

                    <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p style="margin: 0;">This is an automated notification from CourseMate Tutorial.</p>
                        <p style="margin: 4px 0 0;">— CourseMate Team</p>
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ success: true, sentTo: recipients });

    } catch (error) {
        console.error('Feedback email error:', error);
        return res.status(500).json({ error: error.message });
    }
};