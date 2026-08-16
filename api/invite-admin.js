module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://mbniynyvcxzspjmzgovp.supabase.co/functions/v1/invite-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibml5bnl2Y3h6c3BqbXpnb3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMTY5MTksImV4cCI6MjEwMDU5MjkxOX0.cp3F1zyJg0BAqPD0iLDbW2YHOD6JLZWtkthHINMX0RA'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};