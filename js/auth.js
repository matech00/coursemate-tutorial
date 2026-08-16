// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = "https://mbniynyvcxzspjmzgovp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibml5bnl2Y3h6c3BqbXpnb3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMTY5MTksImV4cCI6MjEwMDU5MjkxOX0.cp3F1zyJg0BAqPD0iLDbW2YHOD6JLZWtkthHINMX0RA";

// Create client
const _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 👇 MAKE THE CLIENT AVAILABLE GLOBALLY
window.supabaseClient = _supabaseClient;

// ============================================
// AUTH FUNCTIONS
// ============================================

// ---------- Sign Up (only auth) ----------
async function signUp(email, password, fullName, phone, role) {
    const { data, error } = await _supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, phone, role: role || 'student' }
        }
    });
    if (error) throw error;
    return data;
}

// ---------- Sign Up with Student Details ----------
async function signUpStudent(email, password, fullName, phone, department, program, level, role) {
    const { data, error } = await _supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, phone, role: role || 'student' }
        }
    });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('User creation failed');

    const { error: insertError } = await _supabaseClient
        .from('students')
        .insert([{
            user_id: user.id,
            full_name: fullName,
            email: email,
            phone: phone,
            department: department,
            program: program,
            level: level,
            payment_status: 'pending'
        }]);

    if (insertError) {
        console.error('Failed to save student details:', insertError);
        throw new Error('Account created but profile details could not be saved. Please contact admin.');
    }

    return data;
}

// ---------- Sign In ----------
async function signIn(email, password) {
    const { data, error } = await _supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// ---------- Sign Out ----------
async function signOut() {
    const { error } = await _supabaseClient.auth.signOut();
    if (error) throw error;
}

// ---------- Get Current User (FIXED: Uses local storage instantly) ----------
async function getCurrentUser() {
    // 🟢 FIX: Read from local storage immediately (0ms network delay)
    const { data: { session }, error } = await _supabaseClient.auth.getSession();
    if (error) throw error;
    return session?.user ?? null;
}

// ---------- Require Auth ----------
async function requireAuth(redirectTo = '../login.html') {
    const user = await getCurrentUser().catch(() => null);
    if (!user) {
        window.location.href = redirectTo;
        return null;
    }
    return user;
}

// ---------- Redirect Based on Role ----------
function redirectBasedOnRole(user) {
    const role = user?.user_metadata?.role || 'student';
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    if (role === 'admin') window.location.href = base + '/admin/dashboard.html';
    else if (role === 'staff') window.location.href = base + '/staff/dashboard.html';
    else window.location.href = base + '/student/dashboard.html';
}

// ---------- Reset Password ----------
async function resetPassword(email) {
    const { error } = await _supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
    });
    if (error) throw error;
    return true;
}

// ---------- Update Password ----------
async function updatePassword(newPassword) {
    const { error } = await _supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
}

// ---------- Google Sign In ----------
async function signInWithGoogle() {
    const { data, error } = await _supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/google-success.html'
        }
    });
    if (error) throw error;
    return data;
}

// ============================================
// EXPOSE TO GLOBAL SCOPE
// ============================================
window.auth = {
    signUp,
    signUpStudent,
    signIn,
    signOut,
    getCurrentUser,
    requireAuth,
    redirectBasedOnRole,
    resetPassword,
    updatePassword,
    signInWithGoogle
};

// ============================================================
//  SHOW / HIDE SUPER ADMIN LINK BASED ON ROLE
// ============================================================
async function updateSidebarForRole() {
    try {
        const user = await window.auth.getCurrentUser();
        if (!user) return;

        const { data, error } = await window.supabaseClient
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;

        const isSuper = data?.role === 'super_admin';
        const superLink = document.getElementById('superSettingsLink');
        if (superLink) {
            superLink.style.display = isSuper ? 'flex' : 'none';
        }
    } catch (err) {
        // ✅ SILENTLY IGNORE "Auth session missing" errors on public pages
        if (err.message && err.message.includes('Auth session missing')) {
            return; 
        }
        console.warn('Could not fetch role – hiding super admin link.', err);
        const superLink = document.getElementById('superSettingsLink');
        if (superLink) superLink.style.display = 'none';
    }
}

// Call it on page load
document.addEventListener('DOMContentLoaded', updateSidebarForRole);