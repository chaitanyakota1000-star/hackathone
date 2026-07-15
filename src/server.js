/**
 * Developer 3: Backend API (Core Server Config)
 * Sets up OWASP-hardened security configurations and serving structure.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environmental variables
dotenv.config();

// Database configuration
const { initDB } = require('./config/db');

// Trigger async database table verification & seeding
initDB()
  .then(() => console.log('[DB] MySQL Schema verification finished.'))
  .catch(err => console.error('[DB WARNING] Auto-migrations failed:', err.message));

// Custom route imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Helmet Secure Header configuration (OWASP Defense)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow internal app/cart.js scripts
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    referrerPolicy: { policy: 'same-origin' }
}));

// 2. Cross-Origin Resource Sharing restrictions
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server or postman requests during debugging
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods update
    credentials: true
}));

// 3. Body parsers
app.use(express.json({ limit: '10kb' })); // Max payload limit to prevent DoS via large JSON packets
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Global Request Rate Limiter (Memory Exhaustion defense)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// 5. Serve Static Web Assets
app.use(express.static(path.join(__dirname, '../public')));

// 6. Bind Modular Router Configuration
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Bind custom API routes (Auth & Patients)
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Fallback path to index.html for Single-Page operations
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware (prevents leaking server backtraces)
app.use((err, req, res, next) => {
    console.error("Unhandled Runtime Exception:", err.message);
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        requestId: req.headers['x-request-id'] || 'system-diagnostic-fallback'
    });
});

// Launch server instance
const server = app.listen(PORT, () => {
    console.log(`[SECURE SERVER ACTIVE] listening on port: ${PORT} in [${process.env.NODE_ENV || 'production'}] mode`);
});

// Handle graceful terminations
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
