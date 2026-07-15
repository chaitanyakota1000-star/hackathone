// /public/js/app.js

let currentUser = {
    token: localStorage.getItem('shms_token') || null,
    role: localStorage.getItem('shms_role') || null, 
    username: localStorage.getItem('shms_username') || null
};

// Dynamic Workspace Tab Controller (Role Based Visibility Isolation)
function setupRoleUI() {
    const role = currentUser.role;
    
    const patientView = document.getElementById('patient-portal');
    const doctorView = document.getElementById('doctor-portal');
    const adminView = document.getElementById('admin-portal');
    const authView = document.getElementById('auth-portal');
    const navUserDisplay = document.getElementById('nav-user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // Hide everything safely first
    if (patientView) patientView.style.display = 'none';
    if (doctorView) doctorView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';
    if (authView) authView.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (navUserDisplay) {
        navUserDisplay.textContent = currentUser.username ? `Active: ${escapeHTML(currentUser.username)}` : '';
    }

    // Role state routing matrix
    if (!currentUser.token) {
        if (authView) authView.style.display = 'block';
    } else {
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        if (role === 'patient') {
            if (patientView) patientView.style.display = 'block';
            renderStagedAppointments(); 
        } else if (role === 'doctor') {
            if (doctorView) doctorView.style.display = 'block';
        } else if (role === 'admin') {
            if (adminView) adminView.style.display = 'block';
        }
    }
}

// Secure Tokenized API Connection Port
async function secureFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        
        // Auto session destruction on token invalidation
        if (response.status === 401 || response.status === 403) {
            logoutUser();
            throw new Error("Session timed out or authorization failed.");
        }
        return response;
    } catch (err) {
        console.error("Network communication blocked or interrupted:", err.message);
        throw err;
    }
}

// Identity Authentication Controller
async function loginUser(email, password) {
    const loginButton = document.getElementById('login-btn');
    if (loginButton) loginButton.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: String(email).trim(), 
                password: String(password) 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Verification rejected.');
        }

        currentUser.token = result.token;
        currentUser.role = result.role;
        currentUser.username = result.username;

        localStorage.setItem('shms_token', result.token);
        localStorage.setItem('shms_role', result.role);
        localStorage.setItem('shms_username', result.username);

        setupRoleUI();
    } catch (error) {
        alert("Authentication failed: " + escapeHTML(error.message));
    } finally {
        if (loginButton) loginButton.disabled = false;
    }
}

function logoutUser() {
    currentUser = { token: null, role: null, username: null };
    localStorage.removeItem('shms_token');
    localStorage.removeItem('shms_role');
    localStorage.removeItem('shms_username');
    if (window.cart) window.cart.clearCart();
    setupRoleUI();
}

// Core Booking Submitter with Action-Throttling (Intercepts Double Click Exploits)
async function bookStagedAppointments() {
    const staged = window.cart ? window.cart.getStaged() : [];
    if (staged.length === 0) {
        alert("Staging area empty.");
        return;
    }

    const submitBtn = document.getElementById('confirm-booking-btn');
    if (submitBtn) {
        submitBtn.disabled = true; 
        submitBtn.textContent = 'Processing...';
    }

    try {
        const response = await secureFetch('/api/appointments', {
            method: 'POST',
            body: JSON.stringify({ appointments: staged })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Booking rejected by backend.");
        }

        alert("Appointments successfully confirmed and saved!");
        if (window.cart) window.cart.clearCart();
        renderStagedAppointments();
    } catch (error) {
        alert("Action stopped: " + escapeHTML(error.message));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Staged Appointments';
        }
    }
}

// XSS-Safe Dynamic Screen Renderer
function renderStagedAppointments() {
    const container = document.getElementById('staged-list');
    if (!container) return;
    
    container.innerHTML = '';
    const staged = window.cart ? window.cart.getStaged() : [];

    if (staged.length === 0) {
        container.innerHTML = '<p class="empty-msg">No appointments currently staged.</p>';
        return;
    }

    staged.forEach(appt => {
        const item = document.createElement('div');
        item.className = 'staged-item';
        item.innerHTML = `
            <span>
                <strong>Dr. ${escapeHTML(appt.doctorName)}</strong> 
                - ${escapeHTML(appt.date)} (${escapeHTML(appt.timeSlot)})
            </span>
            <button onclick="removeStaged('${escapeHTML(appt.id)}')" class="remove-btn">Remove</button>
        `;
        container.appendChild(item);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

window.removeStaged = function(id) {
    if (window.cart) window.cart.unstageAppointment(id);
    renderStagedAppointments();
};

document.addEventListener('DOMContentLoaded', () => {
    setupRoleUI();
    const submitBtn = document.getElementById('confirm-booking-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', bookStagedAppointments);
    }
});
