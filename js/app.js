// ============================================
// APP GLOBALS & HELPERS
// ============================================
// Feedback form handler (landing page)
function handleFeedback(e) {
    e.preventDefault();
    document.getElementById('fbSuccess').classList.remove('hidden');
    document.getElementById('feedbackForm').reset();
    setTimeout(() => document.getElementById('fbSuccess').classList.add('hidden'), 5000);
}
// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('mobileMenuToggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            const nav = document.querySelector('.md\\\\:flex');
            if (nav) nav.classList.toggle('hidden');
        });
    }
});
// Logout handler (used across dashboards)
async function handleLogout() {
    try {
        await window.auth.signOut();
        window.location.href = '../index.html';
    } catch (e) {
        alert('Logout failed: ' + e.message);
    }
}
// Check authentication on page load (for protected pages)
document.addEventListener('DOMContentLoaded', async function() {
    // Only run if we're not on the landing page (which has no auth requirement)
    const isLanding = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (!isLanding && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        try {
            const user = await window.auth.requireAuth();
            if (user) {
                // Optionally set user name in UI
                const nameEl = document.getElementById('studentName') || document.getElementById('adminName');
                if (nameEl) {
                    nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
                }
            }
        } catch (e) { /* ignore */ }
    }
});
// ============================================
// TOAST NOTIFICATIONS
// ============================================

// Create toast container if it doesn't exist
function createToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed top-5 right-5 z-50 space-y-3 max-w-sm w-full';
        document.body.appendChild(container);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    createToastContainer();
    
    const colors = {
        success: 'bg-green-50 border-green-500 text-green-800',
        error: 'bg-red-50 border-red-500 text-red-800',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
        info: 'bg-blue-50 border-blue-500 text-blue-800'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 p-4 border-l-4 rounded-lg shadow-lg ${colors[type] || colors.info} transform transition-all duration-300 translate-x-full`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info} text-xl"></i>
        <span class="flex-1 text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Shortcut functions
window.toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info')
};