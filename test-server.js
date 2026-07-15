/**
 * Secure Full-Stack Mock Server (test-server.js)
 * Simulates authentication and appointment endpoints for testing Developer 2 client-side logic.
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// JSON parsing middleware
app.use(express.json());

// Serve the static frontend layout files
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 1. Mock Authentication Login
 * POST /api/auth/login
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH LOGIN ATTEMPT] Email: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing email or password credentials." });
    }

    // Simple test routing matrix
    if (email === "patient@hospital.com") {
        return res.json({
            token: "mock-jwt-patient-token-abc123xyz",
            role: "patient",
            username: "John Doe (Patient)"
        });
    } else if (email === "doctor@hospital.com") {
        return res.json({
            token: "mock-jwt-doctor-token-def456xyz",
            role: "doctor",
            username: "Dr. House"
        });
    } else if (email === "admin@hospital.com") {
        return res.json({
            token: "mock-jwt-admin-token-ghi789xyz",
            role: "admin",
            username: "Chief Admin Officer"
        });
    }

    // Catch incorrect credentials
    return res.status(401).json({ success: false, message: "Invalid email or password." });
});

/**
 * 2. Mock Appointments Checkout
 * POST /api/appointments
 */
app.post('/api/appointments', (req, res) => {
    const authHeader = req.headers['authorization'];
    console.log(`[BOOKING REQUEST] Authorization Header: ${authHeader}`);

    // Verify token presence
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn("[SECURITY WARN] Missing or malformed authorization token.");
        return res.status(401).json({ success: false, message: "Access Denied: Missing Bearer Token" });
    }

    const token = authHeader.split(' ')[1];
    const { appointments } = req.body;

    // Validate request body structure
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid payload: Appointments list cannot be empty." });
    }

    console.log(`[BOOKING SUCCESS] User Token: ${token}`);
    console.log("Staged Appointments list booked:", appointments);

    return res.status(200).json({
        success: true,
        message: `${appointments.length} appointments booked successfully.`
    });
});

// Fallback index.html router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start testing engine
app.listen(PORT, () => {
    console.log(`\n================================================================`);
    console.log(`[HMS MOCK SERVER ACTIVE] listening on http://localhost:${PORT}`);
    console.log(`================================================================`);
    console.log(`Use these accounts to test role UI routing:`);
    console.log(`  - Patient:  patient@hospital.com  (pass: any)`);
    console.log(`  - Doctor:   doctor@hospital.com   (pass: any)`);
    console.log(`  - Admin:    admin@hospital.com    (pass: any)`);
    console.log(`================================================================\n`);
});
