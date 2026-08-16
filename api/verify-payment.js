const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, plan, amount, reference } = req.body;

  try {
    // 1. Verify with Paystack's backend
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.data || verifyData.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not verified by Paystack' });
    }

    // 2. Connect to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const status = plan === 'full' ? 'paid' : 'monthly_active';
    
    // ✅ Generate Student ID
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(1000 + Math.random() * 9000));
    const studentId = `CMT${year}${randomNum}`;
    
    // ✅ Generate QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${studentId}`;

    // 3. Find the student record
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // 4. UPDATE the student record with payment info, ID, and QR code
    const { error: updateError } = await supabase
      .from('students')
      .update({
        payment_status: status,
        student_id: studentId,
        qr_code: qrCodeUrl,
        payment_plan: plan,
        paid_at: new Date().toISOString(),
        expires_at: plan === 'full' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', student.id);

    if (updateError) throw updateError;

    // 5. Record the payment in the payments table
    await supabase.from('payments').insert([{
      user_id: user_id,
      student_id: student.id,
      amount: amount,
      plan: plan,
      reference: reference,
      transaction_id: verifyData.data.id,
      status: 'successful'
    }]);

    return res.status(200).json({ success: true, studentId: studentId });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Server error during verification' });
  }
};