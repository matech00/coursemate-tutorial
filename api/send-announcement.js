const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, message, students } = req.body;
    if (!title || !message || !students) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        if (!supabaseUrl || !supabaseServiceKey || !gmailAppPassword) {
            return res.status(500).json({ error: 'Missing environment variables' });
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
        let sentCount = 0;

        for (const student of students) {
            if (!student.email) continue;
            try {
                await transporter.sendMail({
                    from: fromEmail,
                    to: student.email,
                    subject: title,
                    html: `
                        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                            <div style="border-bottom: 2px solid #008751; padding-bottom: 10px; margin-bottom: 20px;">
                                <h2 style="color: #008751; margin: 0;">CourseMate Tutorial</h2>
                                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Announcement</p>
                            </div>
                            
                            <p style="font-weight: 600; font-size: 14px; color: #374151;">${title}</p>
                            
                            <div style="color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
                                ${message}
                            </div>

                            <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #9ca3af; text-align: center;">
                                <p style="margin: 0;">This is an automated announcement from CourseMate Tutorial.</p>
                                <p style="margin: 4px 0 0;">— CourseMate Team</p>
                            </div>
                        </div>
                    `,
                });
                sentCount++;
            } catch (e) {
                console.error('Email failed for:', student.email, e);
            }
        }

        return res.status(200).json({ success: true, sentCount });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ error: error.message });
    }
};