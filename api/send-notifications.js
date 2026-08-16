const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_date } = req.body;
  if (!session_date) {
    return res.status(400).json({ error: 'Missing session_date' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!supabaseUrl || !supabaseServiceKey || !gmailAppPassword) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'coursematetutorial@gmail.com',
        pass: gmailAppPassword,
      },
    });

    await transporter.verify();

    // ============================================================
    // 1. GET STUDENTS AND ATTENDANCE
    // ============================================================
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, user_id, full_name, email, student_id')
      .in('payment_status', ['paid', 'monthly_active']);

    if (studentError) throw studentError;

    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('session_date', session_date);

    if (attError) throw attError;

    const attendedIds = attendance.map(a => a.student_id);
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absentStudents = students.filter(s => !attendedIds.includes(s.id));
    const total = students.length;

    // ============================================================
    // 2. SEND IN-APP NOTIFICATIONS TO ABSENT STUDENTS
    // ============================================================
    for (const student of absentStudents) {
      if (!student.user_id) continue;
      await supabase.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: student.user_id,
        title: `You missed today's session at CourseMate Tutorial`,
        message: `Hi ${student.full_name}, we noticed you weren't able to join today's session (${session_date}). No worries – you can catch up anytime.`,
        type: 'warning',
        link: '/student/attendance.html',
        is_read: false  // ✅ ADD THIS - so it shows as unread
      });
    }

    // ============================================================
    // 3. SEND IN-APP NOTIFICATIONS TO ADMINS
    // ============================================================
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('user_id, email');

    if (!adminError && admins) {
      for (const admin of admins) {
        if (admin.user_id) {
          await supabase.from('notifications').insert({
            id: crypto.randomUUID(),
            user_id: admin.user_id,
            title: 'Attendance Summary',
            message: `Today (${session_date}): ${total} students, ${present} present, ${late} late, ${absentStudents.length} absent.`,
            type: 'info',
            link: '/admin/attendance.html',
            is_read: false  // ✅ ADD THIS - so it shows as unread
          });
        }
      }
    }

    const fromEmail = '"CourseMate Tutorial" <coursematetutorial@gmail.com>';

    // ============================================================
    // 4. SEND GMAIL TO ABSENT STUDENTS
    // ============================================================
    for (const student of absentStudents) {
      if (student.email) {
        try {
          await transporter.sendMail({
            from: fromEmail,
            to: student.email,
            subject: 'You missed today\'s session at CourseMate Tutorial',
            html: `
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333;">
                <h2 style="color: #008751;">Hello ${student.full_name},</h2>
                <p>We noticed you were not able to join today's session (${session_date}).</p>
                <p>No worries – you can catch up anytime. Check your dashboard for session details.</p>
                <br/>
                <p style="color: #6b7280;">— CourseMate Team</p>
              </div>
            `,
          });
        } catch (e) { console.error('Student email failed:', e); }
      }
    }

    // ============================================================
    // 5. SEND PROFESSIONAL REPORT GMAIL TO ADMINS
    // ============================================================
    const adminEmails = ['coursematetutorial@gmail.com', 'oluwamatic125@gmail.com'];

    if (adminEmails.length) {
      const absentList = absentStudents.map(s => `• ${s.full_name} (${s.student_id})`).join('\n');
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmails,
          subject: `Daily Session Report - ${session_date}`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; color: #333;">
              <div style="border-bottom: 2px solid #008751; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="color: #008751; margin: 0;">CourseMate Tutorial</h2>
                <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Daily Attendance Report</p>
              </div>

              <p style="font-weight: 600; font-size: 14px; color: #374151;">Date: ${session_date}</p>

              <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
                A total of <strong style="color: #3b82f6;">${total}</strong> students were enrolled for today's session.
                Among them, <strong style="color: #22c55e;">${present}</strong> were present,
                <strong style="color: #eab308;">${late}</strong> arrived late,
                and <strong style="color: #ef4444;">${absentStudents.length}</strong> were absent.
              </p>

              ${absentStudents.length > 0 ? `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-top: 15px;">
                  <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">Absent Students</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    ${absentStudents.map(s => `<li>${s.full_name} (${s.student_id})</li>`).join('')}
                  </ul>
                </div>
              ` : `
                <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin-top: 15px; color: #166534;">
                  <p style="margin: 0;">All active students were present today.</p>
                </div>
              `}

              <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #9ca3af; text-align: center;">
                <p style="margin: 0;">This is an automated report from CourseMate Tutorial.</p>
                <p style="margin: 4px 0 0;">— CourseMate Team</p>
              </div>
            </div>
          `,
        });
      } catch (e) { console.error('Admin summary email failed:', e); }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return res.status(500).json({ error: error.message });
  }
};