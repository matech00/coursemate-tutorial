const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
        if (!gmailAppPassword) {
            console.error('Missing GMAIL_APP_PASSWORD');
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

        const body = req.body || {};
        const type = body.type;

        // ============================================================
        // FEEDBACK EMAIL
        // ============================================================
        if (type === 'feedback') {
            const { full_name, email, subject, message } = body;
            if (!subject || !message) {
                return res.status(400).json({ error: 'Missing feedback fields' });
            }
            await transporter.sendMail({
                from: fromEmail,
                to: 'coursematetutorial@gmail.com',
                replyTo: email || 'noreply@coursemate.com',
                subject: 'New Feedback: ' + subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; color: #333;">
                        <div style="border-bottom: 2px solid #008751; padding-bottom: 10px; margin-bottom: 20px;">
                            <h2 style="color: #008751; margin: 0;">CourseMate Tutorial</h2>
                            <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">New Feedback Received</p>
                        </div>
                        <p style="font-weight: 600; font-size: 14px;">From: ${full_name || 'Student'}</p>
                        <p style="color: #6b7280; font-size: 13px;">Email: ${email || 'Not provided'}</p>
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 15px 0;">
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
                        </div>
                    </div>
                `,
            });
            return res.status(200).json({ success: true, type: 'feedback' });
        }

        // ============================================================
        // ORDER RECEIVED (normal order)
        // ============================================================
        if (type === 'order_received') {
            const { to, full_name, order_number, logbook_code, logbook_name, amount } = body;
            if (!to || !order_number) return res.status(400).json({ error: 'Missing order details' });
            await transporter.sendMail({
                from: fromEmail,
                to: to,
                subject: 'Order Received - ' + order_number,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div style="background: #008751; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 20px;">Order Received</h1>
                        </div>
                        <div style="padding: 25px; color: #333;">
                            <p style="font-size: 15px;">Hello <strong>${full_name || 'Student'}</strong>,</p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">Thank you for your order. We have received your request and are preparing your logbook.</p>
                            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #008751;">
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${order_number}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Paid:</strong> &#8358;${(amount || 0).toLocaleString()}</p>
                            </div>
                            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    <strong>What's next?</strong><br>
                                    Your logbook will be ready for pickup within 48 hours. We will send you another email when it's ready.
                                </p>
                            </div>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>CourseMate Team</strong></p>
                        </div>
                    </div>
                `,
            });
            return res.status(200).json({ success: true, type: 'order_received' });
        }

        // ============================================================
        // READY FOR PICKUP (normal order)
        // ============================================================
        if (type === 'ready_for_pickup') {
            const { to, full_name, order_number, logbook_code, logbook_name, pickup_location } = body;
            if (!to || !order_number) return res.status(400).json({ error: 'Missing order details' });
            const today = new Date();
            const readyFrom = today.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const untilDate = new Date(); untilDate.setDate(untilDate.getDate() + 7);
            const availableUntil = untilDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const locationText = pickup_location || 'NOUN Ikorodu Study Centre';
            await transporter.sendMail({
                from: fromEmail,
                to: to,
                subject: 'Logbook Ready for Pickup - ' + order_number,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div style="background: #008751; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 20px;">Your Logbook is Ready</h1>
                        </div>
                        <div style="padding: 25px; color: #333;">
                            <p style="font-size: 15px;">Hello <strong>${full_name || 'Student'}</strong>,</p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">Your logbook is printed and ready for pickup.</p>
                            <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Order Number:</strong> ${order_number}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Pickup Location:</strong> ${locationText}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Ready From:</strong> ${readyFrom}</p>
                                <p style="margin: 5px 0; font-size: 15px;"><strong>Available Until:</strong> ${availableUntil}</p>
                            </div>
                            <p style="color: #4b5563; font-size: 14px;">Please bring your Matric Number and Order Number.</p>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>CourseMate Team</strong></p>
                        </div>
                    </div>
                `,
            });
            return res.status(200).json({ success: true, type: 'ready_for_pickup' });
        }

        // ============================================================
        // INSTANT SALE NOTIFICATION (new)
        // Sends to seller + super admin
        // ============================================================
        if (type === 'instant_sale') {
            const { instant_id, buyer_name, buyer_email, logbook_code, logbook_name, amount, seller_name, seller_code, seller_email } = body;

            if (!instant_id || !seller_email) {
                return res.status(400).json({ error: 'Missing instant sale details' });
            }

            const formattedAmount = '₦' + (amount || 0).toLocaleString();
            const saleDate = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

            // ---- EMAIL TO SELLER ----
            const sellerEmailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #008751; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">New Instant Sale</h1>
                    </div>
                    <div style="padding: 25px; color: #333;">
                        <p style="font-size: 15px;">Hello <strong>${seller_name || 'Seller'}</strong>,</p>
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">Great news! A buyer just purchased a logbook through your account. Please hand over the logbook when the buyer shows this receipt.</p>

                        <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #166534; text-transform: uppercase; font-weight: 600;">Sale Details</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Instant ID:</strong> ${instant_id}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Buyer:</strong> ${buyer_name}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Buyer Email:</strong> ${buyer_email}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Amount:</strong> ${formattedAmount}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Date:</strong> ${saleDate}</p>
                        </div>

                        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #92400e;">
                                <strong>Action needed:</strong> When the buyer shows their receipt (with the Instant ID above), hand them the logbook.
                            </p>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>CourseMate Team</strong></p>
                    </div>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: fromEmail,
                    to: seller_email,
                    subject: 'New Instant Sale - ' + instant_id,
                    html: sellerEmailHtml,
                });
                console.log('✅ Seller notification sent to', seller_email);
            } catch (err) {
                console.error('❌ Failed to send seller email:', err);
            }

            // ---- EMAIL TO SUPER ADMIN ----
            const superAdminHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="background: #0f172a; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">🔔 Instant Sale Alert</h1>
                    </div>
                    <div style="padding: 25px; color: #333;">
                        <p style="font-size: 15px;">A new instant sale just happened.</p>

                        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #008751;">
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Instant ID:</strong> ${instant_id}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Seller:</strong> ${seller_name} (${seller_code})</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Seller Email:</strong> ${seller_email}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Buyer:</strong> ${buyer_name}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Buyer Email:</strong> ${buyer_email}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Logbook:</strong> ${logbook_code} - ${logbook_name}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> ${formattedAmount}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${saleDate}</p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px;">This is an automated alert from CourseMate.</p>
                    </div>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: fromEmail,
                    to: 'coursematetutorial@gmail.com',
                    subject: '🔔 Instant Sale - ' + instant_id + ' via ' + seller_code,
                    html: superAdminHtml,
                });
                console.log('✅ Super admin notification sent');
            } catch (err) {
                console.error('❌ Failed to send super admin email:', err);
            }

            return res.status(200).json({ success: true, type: 'instant_sale' });
        }

        return res.status(400).json({ error: 'Invalid email type.' });

    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ error: error.message || 'Unknown error' });
    }
};