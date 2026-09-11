// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = "https://mbniynyvcxzspjmzgovp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibml5bnl2Y3h6c3BqbXpnb3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMTY5MTksImV4cCI6MjEwMDU5MjkxOX0.cp3F1zyJg0BAqPD0iLDbW2YHOD6JLZWtkthHINMX0RA";

const _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = _supabaseClient;

// ============================================
// AUTH FUNCTIONS
// ============================================

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

async function signUpStudent(email, password, fullName, phone, department, program, level, role) {
    try {
        const { data, error } = await _supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, phone, role: role || 'student' }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                const { data: signInData, error: signInError } = await _supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (signInError) {
                    throw new Error('Account exists but login failed. Please reset your password.');
                }

                const user = signInData.user;
                
                const { data: recheckStudent } = await _supabaseClient
                    .from('students')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (recheckStudent) {
                    throw new Error('Account exists. Please login.');
                }

                const isTutorialStudent = !!(department && program && level);
                
                const { error: insertError } = await _supabaseClient
                    .from('students')
                    .insert({
                        user_id: user.id,
                        full_name: fullName,
                        email: email,
                        phone: phone || '',
                        department: department || '',
                        program: program || '',
                        level: level || '',
                        payment_status: isTutorialStudent ? 'pending' : null,
                        is_tutorial_student: isTutorialStudent
                    });

                if (insertError) {
                    console.error('Insert error:', insertError);
                    throw new Error('Account exists but profile could not be created: ' + insertError.message);
                }

                return { user: user, isNew: false };
            }
            throw error;
        }

        const user = data.user;
        if (!user) throw new Error('User creation failed');

        const isTutorialStudent = !!(department && program && level);

        const { error: insertError } = await _supabaseClient
            .from('students')
            .insert({
                user_id: user.id,
                full_name: fullName,
                email: email,
                phone: phone || '',
                department: department || '',
                program: program || '',
                level: level || '',
                payment_status: isTutorialStudent ? 'pending' : null,
                is_tutorial_student: isTutorialStudent
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error('Account created but profile could not be saved: ' + insertError.message);
        }

        return data;

    } catch (error) {
        console.error('signUpStudent error:', error);
        throw error;
    }
}

async function signIn(email, password) {
    const { data, error } = await _supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await _supabaseClient.auth.signOut();
    if (error) throw error;
}

async function getCurrentUser() {
    const { data: { session }, error } = await _supabaseClient.auth.getSession();
    if (error) throw error;
    return session?.user ?? null;
}

async function requireAuth(redirectTo = '../login.html') {
    const user = await getCurrentUser().catch(() => null);
    if (!user) {
        window.location.href = redirectTo;
        return null;
    }
    return user;
}

function redirectBasedOnRole(user) {
    const role = user?.user_metadata?.role || 'student';
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    if (role === 'admin') window.location.href = base + '/admin/dashboard.html';
    else if (role === 'staff') window.location.href = base + '/staff/dashboard.html';
    else window.location.href = base + '/student/dashboard.html';
}

async function resetPassword(email) {
    const { error } = await _supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
    });
    if (error) throw error;
    return true;
}

async function updatePassword(newPassword) {
    const { error } = await _supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
}

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
        if (err.message && err.message.includes('Auth session missing')) {
            return; 
        }
        console.warn('Could not fetch role – hiding super admin link.', err);
        const superLink = document.getElementById('superSettingsLink');
        if (superLink) superLink.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', updateSidebarForRole);