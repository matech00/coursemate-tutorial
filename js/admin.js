// ============================================
// ADMIN.JS – Shared Admin Functions
// ============================================

// ---------- Get All Students ----------
async function getStudents() {
    const { data, error } = await window.supabaseClient
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

// ---------- Get Student Stats ----------
async function getStudentStats(students) {
    const total = students.length;
    const active = students.filter(s => s.payment_status === 'paid' || s.payment_status === 'monthly_active').length;
    const paid = students.filter(s => s.payment_status === 'paid').length;
    const monthly = students.filter(s => s.payment_status === 'monthly_active').length;
    const expired = students.filter(s => s.payment_status === 'expired').length;
    const pending = students.filter(s => s.payment_status === 'pending' || !s.payment_status).length;
    const revenue = students.reduce((sum, s) => {
        if (s.payment_status === 'paid') return sum + 30000;
        if (s.payment_status === 'monthly_active') return sum + 10000;
        return sum;
    }, 0);
    return { total, active, paid, monthly, expired, pending, revenue };
}

// ---------- Get Status Badge ----------
function getStatusBadge(status) {
    const map = {
        'paid': { label: 'Fully Paid', class: 'bg-green-100 text-green-800' },
        'monthly_active': { label: 'Monthly Active', class: 'bg-yellow-100 text-yellow-800' },
        'expired': { label: 'Expired', class: 'bg-red-100 text-red-800' },
        'pending': { label: 'Pending', class: 'bg-gray-100 text-gray-800' },
    };
    return map[status] || map['pending'];
}

// ---------- Generate Student ID ----------
function generateStudentId() {
    const year = new Date().getFullYear();
    const random = String(Math.floor(1000 + Math.random() * 9000));
    return `CMT${year}${random}`;
}

// ---------- Render Student Table ----------
function renderStudentTable(students, containerId = 'studentTableBody') {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">No students registered yet.</td></tr>`;
        return;
    }
    students.forEach(s => {
        const badge = getStatusBadge(s.payment_status);
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-2 font-medium text-gray-900">${s.full_name || 'N/A'}</td>
            <td class="py-2 text-gray-600">${s.email || 'N/A'}</td>
            <td class="py-2 text-gray-600">${s.department || '—'}</td>
            <td class="py-2"><span class="px-2 py-1 rounded-full text-xs font-medium ${badge.class}">${badge.label}</span></td>
            <td class="py-2 text-gray-500">${s.student_id || 'Not assigned'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ---------- Render Payment Table ----------
function renderPaymentTable(students, containerId = 'paymentTableBody') {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-gray-500">No payment records found.</td></tr>`;
        return;
    }
    students.forEach(s => {
        const badge = getStatusBadge(s.payment_status);
        const amount = s.payment_status === 'paid' ? '₦30,000' : s.payment_status === 'monthly_active' ? '₦10,000' : '—';
        const plan = s.payment_status === 'paid' ? 'Full' : s.payment_status === 'monthly_active' ? 'Monthly' : '—';
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-2 font-medium text-gray-900">${s.full_name || 'N/A'}</td>
            <td class="py-2 text-gray-600">${plan}</td>
            <td class="py-2 text-gray-600">${amount}</td>
            <td class="py-2"><span class="px-2 py-1 rounded-full text-xs font-medium ${badge.class}">${badge.label}</span></td>
            <td class="py-2 text-gray-500">${s.student_id || 'Not assigned'}</td>
            <td class="py-2">
                <button onclick="openModal('${s.id}', '${s.full_name}')" class="text-primary-500 hover:text-primary-600 text-sm">Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ---------- Open Modal ----------
function openModal(studentId, studentName) {
    console.log('🔓 Opening modal for:', studentId, studentName);
    document.getElementById('modalStudentId').value = studentId;
    document.getElementById('modalStudentName').querySelector('span').textContent = studentName;
    document.getElementById('updateModal').classList.remove('hidden');
    document.getElementById('updateModal').classList.add('flex');
}

// ---------- Close Modal ----------
function closeModal() {
    document.getElementById('updateModal').classList.add('hidden');
    document.getElementById('updateModal').classList.remove('flex');
}

async function savePaymentStatus() {
    const studentId = document.getElementById('modalStudentId').value;
    const status = document.getElementById('modalStatus').value;

    console.log('🔄 Student ID:', studentId);
    console.log('🔄 New Status:', status);

    if (!studentId) {
        window.toast.error('Student ID not found. Please try again.');
        return;
    }

    try {
        // Only update payment_status – no student_id for now
        const { data, error } = await window.supabaseClient
            .from('students')
            .update({ payment_status: status })
            .eq('id', studentId)
            .select();

        console.log('📦 Response:', { data, error });

        if (error) {
            console.error('❌ Update error:', error);
            window.toast.error('Failed to update: ' + error.message);
            return;
        }

        console.log('✅ Update successful:', data);
        window.toast.success('Payment status updated!');
        closeModal();
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        console.error('💥 Unexpected error:', error);
        window.toast.error('An unexpected error occurred.');
    }
}

// ---------- Start Attendance Session ----------
function startAttendanceSession() {
    const indicator = document.getElementById('sessionIndicator');
    const status = document.getElementById('sessionStatus');
    const time = document.getElementById('sessionTime');
    if (indicator) { indicator.className = 'w-3 h-3 rounded-full bg-green-500 animate-pulse'; }
    if (status) { status.textContent = 'Session Active'; }
    if (time) { time.textContent = new Date().toLocaleTimeString(); }
    window.toast.success('Attendance session started!');
}

// ---------- Admin Auth Check ----------
async function checkAdminAuth() {
    try {
        const user = await window.auth.requireAuth('../login.html');
        if (!user) return false;
        const role = user.user_metadata?.role || 'student';
        if (role !== 'admin') {
            window.toast.error('Access denied. Admins only.');
            setTimeout(() => window.location.href = '../student/dashboard.html', 1500);
            return false;
        }
        const nameEl = document.getElementById('adminName');
        if (nameEl) {
            nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
        }
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        return false;
    }
}

// ---------- Load Admin Dashboard ----------
async function loadAdminDashboard() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;

    try {
        const students = await getStudents();
        const stats = await getStudentStats(students);
        document.getElementById('totalStudents').textContent = stats.total;
        document.getElementById('activePayments').textContent = stats.active;
        document.getElementById('totalRevenue').textContent = `₦${stats.revenue.toLocaleString()}`;
        document.getElementById('todayAttendance').textContent = '—';

        const recent = document.getElementById('recentActivity');
        if (students.length > 0) {
            const latest = students.slice(0, 5);
            recent.innerHTML = latest.map(s => `
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <span class="text-sm">${s.full_name} registered</span>
                    <span class="text-xs text-gray-400">${new Date(s.created_at).toLocaleDateString()}</span>
                </div>
            `).join('');
        } else {
            recent.innerHTML = '<p class="text-sm text-gray-500">No recent activity.</p>';
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        window.toast.error('Failed to load dashboard data.');
    }
}

// ---------- Load Students Page ----------
async function loadStudentsPage() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;

    try {
        const students = await getStudents();
        renderStudentTable(students);
        document.getElementById('searchInput')?.addEventListener('input', function() {
            const search = this.value.toLowerCase();
            const filtered = students.filter(s => s.full_name?.toLowerCase().includes(search) || s.email?.toLowerCase().includes(search));
            renderStudentTable(filtered);
        });
        document.getElementById('filterStatus')?.addEventListener('change', function() {
            const filter = this.value;
            const filtered = filter === 'all' ? students : students.filter(s => s.payment_status === filter);
            renderStudentTable(filtered);
        });
    } catch (error) {
        console.error('Students load error:', error);
        window.toast.error('Failed to load students.');
    }
}

// ---------- Load Payments Page ----------
async function loadPaymentsPage() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;

    try {
        const students = await getStudents();
        const stats = await getStudentStats(students);
        document.getElementById('totalPaid').textContent = stats.paid;
        document.getElementById('totalMonthly').textContent = stats.monthly;
        document.getElementById('totalExpired').textContent = stats.expired;
        document.getElementById('totalPending').textContent = stats.pending;
        renderPaymentTable(students);
        document.getElementById('paymentFilter')?.addEventListener('change', function() {
            const filter = this.value;
            const filtered = filter === 'all' ? students : students.filter(s => s.payment_status === filter);
            renderPaymentTable(filtered);
        });
    } catch (error) {
        console.error('Payments load error:', error);
        window.toast.error('Failed to load payments.');
    }
}

// ---------- Load Settings Page ----------
async function loadSettingsPage() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;

    if (typeof DEPARTMENTS !== 'undefined') {
        const deptList = document.getElementById('departmentList');
        if (deptList) {
            deptList.innerHTML = '';
            Object.keys(DEPARTMENTS).forEach(dept => {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center py-1 border-b border-gray-100';
                div.innerHTML = `
                    <span class="text-sm">${dept}</span>
                    <button onclick="deleteDepartment('${dept}')" class="text-red-500 hover:text-red-600 text-xs">Remove</button>
                `;
                deptList.appendChild(div);
            });
        }
        const progDept = document.getElementById('programDepartment');
        if (progDept) {
            progDept.innerHTML = '<option value="">Select Department</option>';
            Object.keys(DEPARTMENTS).forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.textContent = dept;
                progDept.appendChild(opt);
            });
        }
        const progList = document.getElementById('programList');
        if (progList) {
            progList.innerHTML = '';
            Object.keys(DEPARTMENTS).forEach(dept => {
                DEPARTMENTS[dept].forEach(prog => {
                    const div = document.createElement('div');
                    div.className = 'flex justify-between items-center py-1 border-b border-gray-100';
                    div.innerHTML = `
                        <span class="text-sm">${prog} <span class="text-xs text-gray-400">(${dept})</span></span>
                        <button onclick="deleteProgram('${prog}', '${dept}')" class="text-red-500 hover:text-red-600 text-xs">Remove</button>
                    `;
                    progList.appendChild(div);
                });
            });
        }
    }
}

// ---------- Add Department ----------
function addDepartment() {
    const input = document.getElementById('newDepartment');
    if (!input || !input.value.trim()) return;
    const dept = input.value.trim();
    if (typeof DEPARTMENTS !== 'undefined') {
        if (DEPARTMENTS[dept]) {
            window.toast.warning('Department already exists.');
            return;
        }
        DEPARTMENTS[dept] = [];
        window.toast.success('Department added!');
        input.value = '';
        loadSettingsPage();
    }
}

// ---------- Delete Department ----------
function deleteDepartment(dept) {
    if (!confirm(`Delete department "${dept}"?`)) return;
    if (typeof DEPARTMENTS !== 'undefined') {
        delete DEPARTMENTS[dept];
        window.toast.success('Department removed!');
        loadSettingsPage();
    }
}

// ---------- Add Program ----------
function addProgram() {
    const dept = document.getElementById('programDepartment')?.value;
    const input = document.getElementById('newProgram');
    if (!dept || !input || !input.value.trim()) {
        window.toast.error('Select department and enter program name.');
        return;
    }
    const prog = input.value.trim();
    if (typeof DEPARTMENTS !== 'undefined') {
        if (!DEPARTMENTS[dept]) {
            DEPARTMENTS[dept] = [];
        }
        if (DEPARTMENTS[dept].includes(prog)) {
            window.toast.warning('Program already exists in this department.');
            return;
        }
        DEPARTMENTS[dept].push(prog);
        window.toast.success('Program added!');
        input.value = '';
        loadSettingsPage();
    }
}

// ---------- Delete Program ----------
function deleteProgram(prog, dept) {
    if (!confirm(`Delete program "${prog}"?`)) return;
    if (typeof DEPARTMENTS !== 'undefined' && DEPARTMENTS[dept]) {
        DEPARTMENTS[dept] = DEPARTMENTS[dept].filter(p => p !== prog);
        window.toast.success('Program removed!');
        loadSettingsPage();
    }
}

// ---------- Save Fee Structure ----------
function saveFeeStructure() {
    const full = document.getElementById('fullFee')?.value;
    const monthly = document.getElementById('monthlyFee')?.value;
    if (full && monthly) {
        window.toast.success('Fee structure saved! (This would update the database in production)');
    } else {
        window.toast.error('Please enter valid amounts.');
    }
}

// ---------- Auto-load based on page ----------
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) loadAdminDashboard();
    else if (path.includes('students.html')) loadStudentsPage();
    else if (path.includes('payments.html')) loadPaymentsPage();
    else if (path.includes('settings.html')) loadSettingsPage();
});