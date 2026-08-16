// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow your frontend to call this API
app.use(express.json());

// Proxy endpoint for sending attendance notifications
app.post('/api/send-notifications', async (req, res) => {
    const { session_date } = req.body;

    if (!session_date) {
        return res.status(400).json({ error: 'Missing session_date' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL || 'https://mbniynyvcxzspjmzgovp.supabase.co';
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/send-attendance-notification`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_date }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Edge Function error:', response.status, text);
            return res.status(response.status).json({ error: text });
        }

        const data = await response.json();
        return res.json(data);
    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});