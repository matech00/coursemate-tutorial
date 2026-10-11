const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, password, seller_code } = req.body;

        if (!name || !email || !password || !seller_code) {
            return res.status(400).json({ error: 'Missing required fields: name, email, password, seller_code' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
            return res.status(500).json({ error: 'Server configuration missing' });
        }

        // Create admin client (service role — full access)
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // ============================================================
        // STEP 1: Check if seller already exists in sellers table
        // ============================================================
        const { data: existingSeller } = await adminClient
            .from('sellers')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (existingSeller) {
            return res.status(400).json({ error: 'A seller with this email already exists' });
        }

        // ============================================================
        // STEP 2: Create the Supabase Auth user
        // ============================================================
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // auto-confirm — no verification email
            user_metadata: {
                full_name: name,
                role: 'seller',
                seller_code: seller_code
            }
        });

        if (authError) {
            console.error('Auth user creation error:', authError);
            // Check if user already exists
            if (authError.message && authError.message.toLowerCase().includes('already')) {
                return res.status(400).json({ error: 'A user with this email already exists in authentication' });
            }
            return res.status(500).json({ error: 'Failed to create auth account: ' + authError.message });
        }

        // ============================================================
        // STEP 3: Insert seller record into sellers table
        // ============================================================
        const { data: sellerData, error: sellerError } = await adminClient
            .from('sellers')
            .insert([{
                name: name,
                email: email,
                password: password, // kept for reference/backup
                seller_code: seller_code,
                user_id: authUser.user.id
            }])
            .select()
            .single();

        if (sellerError) {
            console.error('Seller insert error:', sellerError);
            // Cleanup: delete the auth user we just created
            await adminClient.auth.admin.deleteUser(authUser.user.id);
            return res.status(500).json({ error: 'Failed to create seller record: ' + sellerError.message });
        }

        // ============================================================
        // SUCCESS
        // ============================================================
        return res.status(200).json({
            success: true,
            seller: {
                id: sellerData.id,
                name: sellerData.name,
                email: sellerData.email,
                seller_code: sellerData.seller_code
            }
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Unknown error' });
    }
};