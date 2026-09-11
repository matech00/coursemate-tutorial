const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, to, full_name, order_number, logbook_code, logbook_name, amount, pickup_location, pickup_deadline } = req.body;

        if (!type || !to) {
            return res.status(400).json({ error: 'Missing required fields: type, to' });
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
        const fromEmail = '"CourseMate Logbook" <coursematetutorial@gmail.com>';

        // ============================================================
        // EMAIL TEMPLATE 1: ORDER RECEIVED
        // ============================================================
        if (type === 'order_received') {
            await transporter.sendMail({
                from: fromEmail,
                to: to,
                subject: `Order Received - ${order_number}`,
                html: `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div style="background: #008751; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 20px;">Order Received</h1>
                        </div>
                        <div style="padding: 25px; color: #333;">
                            <p style="font-size: 15px;">Hello <strong>${full_name || 'Student'}</strong>,</p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
                                Thank you for your order. We have received your request and are preparing your logbook.
                            </p>

                            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #008751;">
                                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Order Summary</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${order_number}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Paid:</strong> ₦${(amount || 0).toLocaleString()}</p>
                            </div>

                            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    <strong>What's next?</strong><br>
                                    Your logbook is being prepared. You will receive another email once it is ready for pickup (approximately 48 hours).
                                </p>
                            </div>

                            <p style="color: #4b5563; font-size: 14px;">
                                If you have any questions, please reply to this email or use the feedback form on our website.
                            </p>

                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                Best regards,<br>
                                <strong>CourseMate Team</strong>
                            </p>
                        </div>
                        <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                            This is an automated message from CourseMate Logbook Service.
                        </div>
                    </div>
                `,
            });
        }

        // ============================================================
        // EMAIL TEMPLATE 2: READY FOR PICKUP
        // ============================================================
        else if (type === 'ready_for_pickup') {
            const pickupDate = new Date();
            pickupDate.setDate(pickupDate.getDate() + 7);
            const deadline = pickup_deadline || pickupDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            await transporter.sendMail({
                from: fromEmail,
                to: to,
                subject: `Logbook Ready for Pickup - ${order_number}`,
                html: `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div style="background: #008751; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 20px;">Your Logbook is Ready</h1>
                        </div>
                        <div style="padding: 25px; color: #333;">
                            <p style="font-size: 15px;">Hello <strong>${full_name || 'Student'}</strong>,</p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
                                Good news! Your logbook has been printed and is now ready for pickup.
                            </p>

                            <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
                                <p style="margin: 0 0 10px 0; font-size: 13px; color: #166534; text-transform: uppercase; font-weight: 600;">Pickup Details</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Order Number:</strong> ${order_number}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Pickup Location:</strong> ${pickup_location || 'NOUN Study Centre'}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Available Until:</strong> ${deadline}</p>
                            </div>

                            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #4b5563;">
                                    <strong>Please bring:</strong><br>
                                    - Your Matric Number<br>
                                    - This Order Number (${order_number})
                                </p>
                            </div>

                            <p style="color: #4b5563; font-size: 14px;">
                                If you cannot pick it up within 7 days, please reply to this email or use the feedback form on our website.
                            </p>

                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                Best regards,<br>
                                <strong>CourseMate Team</strong>
                            </p>
                        </div>
                        <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                            This is an automated message from CourseMate Logbook Service.
                        </div>
                    </div>
                `,
            });
        } else {
            return res.status(400).json({ error: 'Invalid email type. Use "order_received" or "ready_for_pickup".' });
        }

        return res.status(200).json({ success: true, sentTo: to, type: type });

    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ error: error.message });
    }
};