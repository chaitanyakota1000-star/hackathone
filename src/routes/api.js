/**
 * Developer 3: Backend API (Modular Router & Validations)
 * Defines hardened route validation rules and manages transient session states.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// --- IN-MEMORY DATABASE STATE (For Collaborative Syncing) ---
let database = {
    teamPoints: 350,
    leaderboard: [
        { team: "DevOps_Demons", points: 450 },
        { team: "Cyber_Sentinels", points: 350 }, // User's Team
        { team: "Front_End_Fanatics", points: 280 },
        { team: "Null_Pointers", points: 190 }
    ],
    activities: [
        { time: "10s ago", team: "DevOps_Demons", action: "activated Double Points!" },
        { time: "1m ago", team: "Null_Pointers", action: "submitted incorrect answer." },
        { time: "3m ago", team: "Cyber_Sentinels", action: "completed quiz module Linux Hardening Baseline." }
    ]
};

// Power-Up prices metadata
const POWERUPS = {
    double_points: { name: "Double Points", cost: 150 },
    time_freeze: { name: "Time Freeze", cost: 100 },
    fifty_fifty: { name: "50/50 Split", cost: 200 }
};

// Correct answers database
const QUIZ_ANSWERS = {
    q_hardening_01: {
        correctOption: "C",
        pointsValue: 50
    }
};

// Target rate limiter just for checkout submissions (protects points database calculations)
const checkoutLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit 5 checkouts per minute
    message: { success: false, error: "Too many checkout requests. Please wait." }
});

/**
 * Helper to update leaderboards sorted by points
 */
function syncLeaderboardPoints() {
    // Find our team entry
    const ourTeam = database.leaderboard.find(t => t.team === "Cyber_Sentinels");
    if (ourTeam) {
        ourTeam.points = database.teamPoints;
    }
    // Resort leaderboard
    database.leaderboard.sort((a, b) => b.points - a.points);
}

/**
 * 1. GET /api/quiz/state
 * Returns current team scores, leaderboards, and logs feed.
 */
router.get('/quiz/state', (req, res) => {
    res.json({
        teamPoints: database.teamPoints,
        leaderboard: database.leaderboard,
        activities: database.activities
    });
});

/**
 * 2. POST /api/quiz/submit
 * Evaluates quiz responses.
 */
router.post('/quiz/submit', [
    // Strict schema inputs validations (OWASP mitigation against SQLi/XSS parameters injection)
    body('questionId').isString().trim().notEmpty().escape(),
    body('selectedOption').isString().trim().toUpperCase().isIn(['A', 'B', 'C', 'D']).escape()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ processed: false, error: "Invalid payload parameters" });
    }

    const { questionId, selectedOption } = req.body;
    const questionObj = QUIZ_ANSWERS[questionId];

    if (!questionObj) {
        return res.status(404).json({ processed: false, error: "Question context identifier not found" });
    }

    const isCorrect = (selectedOption === questionObj.correctOption);
    
    if (isCorrect) {
        database.teamPoints += questionObj.pointsValue;
        syncLeaderboardPoints();

        // Push new action event log
        database.activities.unshift({
            time: "Just now",
            team: "Cyber_Sentinels",
            action: `answered ${questionId} CORRECTLY (+${questionObj.pointsValue} pts)!`
        });
    } else {
        database.activities.unshift({
            time: "Just now",
            team: "Cyber_Sentinels",
            action: `answered ${questionId} INCORRECTLY.`
        });
    }

    // Retain only the last 10 activities
    if (database.activities.length > 10) {
        database.activities = database.activities.slice(0, 10);
    }

    res.json({
        processed: true,
        isCorrect: isCorrect,
        correctAnswer: questionObj.correctOption,
        updatedPoints: database.teamPoints
    });
});

/**
 * 3. POST /api/shop/checkout
 * Processes cart checkout transactions with strict validation logic.
 */
router.post('/shop/checkout', [
    checkoutLimiter,
    // Schema definitions validation
    body('expectedCost').isInt({ min: 50, max: 1000 }).toInt(),
    body('upgrades').isArray({ min: 1 }).withMessage("Upgrades cart cannot be empty"),
    body('upgrades.*.id').isString().trim().isIn(Object.keys(POWERUPS)).withMessage("Invalid powerup ID"),
    body('upgrades.*.quantity').isInt({ min: 1, max: 10 }).toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { upgrades, expectedCost } = req.body;

    // Calculate actual cost dynamically to prevent client-side tampering ("Under-charging" parameters tampering)
    let actualCost = 0;
    const activations = [];

    for (const item of upgrades) {
        const metadata = POWERUPS[item.id];
        actualCost += metadata.cost * item.quantity;
        activations.push(`${metadata.name} (x${item.quantity})`);
    }

    // Verify client calculations match backend limits
    if (actualCost !== expectedCost) {
        return res.status(400).json({ success: false, error: "Cart valuation mismatch detected." });
    }

    // Verify points availability
    if (database.teamPoints < actualCost) {
        return res.status(400).json({ success: false, error: "Insufficient team points." });
    }

    // Process payment debit transaction
    database.teamPoints -= actualCost;
    syncLeaderboardPoints();

    // Log the transaction
    database.activities.unshift({
        time: "Just now",
        team: "Cyber_Sentinels",
        action: `activated upgrades: ${activations.join(', ')}!`
    });

    if (database.activities.length > 10) {
        database.activities = database.activities.slice(0, 10);
    }

    res.json({
        success: true,
        updatedPoints: database.teamPoints,
        message: "Power-ups successfully applied"
    });
});

module.exports = router;
