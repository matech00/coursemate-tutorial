const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { id, email, raw_user_meta_data } = req.body;

    if (raw_user_meta_data?.role === 'admin') {
      const { error } = await supabase.from('admins').insert({
        user_id: id,
        email: email,
        full_name: raw_user_meta_data?.full_name || email.split('@')[0],
        role: raw_user_meta_data?.role || 'admin'
      });

      if (error) {
        console.error("Failed to auto-insert admin:", error);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Auto-create admin error:", error);
    return res.status(500).json({ error: error.message });
  }
};