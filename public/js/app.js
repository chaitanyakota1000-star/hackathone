/**
 * Developer 2: Client-Side Controller (Quiz Syncing Engine)
 * Coordinates quiz submissions, timers, point updates, and shop checkouts.
 */

// Local Session State
const quizState = {
    currentQuestionId: "q_hardening_01",
    selectedOption: "C", // Default based on pre-selected HTML structure
    hasSubmitted: false,
    timerSeconds: 24,
    timerInterval: null
};

// Start application loops when DOM loads
document.addEventListener("DOMContentLoaded", () => {
    bindQuizEvents();
    startTimer();
    
    // Initial fetch of leaderboard and activity logs
    fetchRealTimeUpdates();

    // Set interval to poll for real-time changes every 8 seconds
    setInterval(fetchRealTimeUpdates, 8000);

    // Bind Checkout button
    const checkoutBtn = document.getElementById("checkout-button");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", checkoutPowerUps);
    }
});

/**
 * Handle countdown timer mechanics
 */
function startTimer() {
    const timerDisplay = document.getElementById("quiz-timer");
    const progressFill = document.getElementById("timer-progress");
    const totalDuration = 30; // Max 30 seconds

    if (quizState.timerInterval) {
        clearInterval(quizState.timerInterval);
    }

    quizState.timerInterval = setInterval(() => {
        quizState.timerSeconds--;

        if (timerDisplay) {
            timerDisplay.textContent = `${quizState.timerSeconds}s`;
        }

        if (progressFill) {
            const ratio = (quizState.timerSeconds / totalDuration) * 100;
            progressFill.style.width = `${ratio}%`;

            // Change to alert color when time is low
            if (quizState.timerSeconds <= 5) {
                progressFill.style.background = "var(--accent-red)";
                if (timerDisplay) timerDisplay.style.color = "var(--accent-red)";
            }
        }

        if (quizState.timerSeconds <= 0) {
            clearInterval(quizState.timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

/**
 * Handle timer expiration event
 */
function handleTimeOut() {
    quizState.hasSubmitted = true;
    const submitBtn = document.getElementById("btn-submit-answer");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Time Expired";
        submitBtn.style.background = "var(--text-muted)";
    }
    alert("Time expired! Your team missed the response window.");
}

/**
 * Bind answer selector clicks and lock-in button clicks
 */
function bindQuizEvents() {
    const optionsContainer = document.getElementById("question-options");
    const submitBtn = document.getElementById("btn-submit-answer");

    if (optionsContainer) {
        optionsContainer.addEventListener("click", (e) => {
            if (quizState.hasSubmitted) return;

            const button = e.target.closest(".option-btn");
            if (!button) return;

            // Remove selected state from all options
            const options = optionsContainer.querySelectorAll(".option-btn");
            options.forEach(opt => opt.classList.remove("selected"));

            // Set current selected option
            button.classList.add("selected");
            quizState.selectedOption = button.getAttribute("data-option");
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", submitQuizAnswer);
    }
}

/**
 * Perform secure HTTP fetches with standard header validation
 */
async function secureFetch(url, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });
        return response;
    } catch (e) {
        console.error("Network communication blocked:", e.message);
        throw e;
    }
}

/**
 * Lock in and submit the selected option to backend API
 */
async function submitQuizAnswer() {
    if (quizState.hasSubmitted) return;

    const submitBtn = document.getElementById("btn-submit-answer");
    const optionsContainer = document.getElementById("question-options");

    if (!quizState.selectedOption) {
        alert("Please select an answer choice first.");
        return;
    }

    // Lock submission inputs (prevents double-click request spamming)
    quizState.hasSubmitted = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Locking In...";
    }

    try {
        const response = await secureFetch("/api/quiz/submit", {
            method: "POST",
            body: JSON.stringify({
                questionId: quizState.currentQuestionId,
                selectedOption: quizState.selectedOption
            })
        });

        const result = await response.json();

        if (response.ok && result.processed) {
            clearInterval(quizState.timerInterval);

            // Style results visually
            const options = optionsContainer.querySelectorAll(".option-btn");
            options.forEach(btn => {
                const letter = btn.getAttribute("data-option");
                if (letter === result.correctAnswer) {
                    // Correct answer styled green
                    btn.style.borderColor = "var(--accent-green)";
                    btn.style.background = "rgba(145, 233, 0, 0.05)";
                    btn.querySelector(".option-letter").style.background = "var(--accent-green)";
                    btn.querySelector(".option-letter").style.color = "var(--text-on-accent)";
                } else if (letter === quizState.selectedOption && !result.isCorrect) {
                    // Wrong choice styled red
                    btn.style.borderColor = "var(--accent-red)";
                    btn.style.background = "rgba(255, 70, 70, 0.05)";
                    btn.querySelector(".option-letter").style.background = "var(--accent-red)";
                    btn.querySelector(".option-letter").style.color = "var(--text-on-accent)";
                }
            });

            if (result.isCorrect) {
                if (submitBtn) {
                    submitBtn.textContent = "Correct! Locked In";
                    submitBtn.style.background = "var(--accent-green)";
                }
            } else {
                if (submitBtn) {
                    submitBtn.textContent = "Incorrect! Locked In";
                    submitBtn.style.background = "var(--accent-red)";
                }
            }

            // Update points dynamically
            if (result.updatedPoints !== undefined) {
                syncPointsDisplay(result.updatedPoints);
            }

            // Trigger log updates
            fetchRealTimeUpdates();
        } else {
            // Unlock on error
            quizState.hasSubmitted = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Lock In Answer";
            }
            alert(`Response submission rejected: ${result.error || "validation failure"}`);
        }
    } catch (err) {
        console.error("API transmission failure:", err);
        quizState.hasSubmitted = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Lock In Answer";
        }
        alert("Failed to connect to API server.");
    }
}

/**
 * Checkout and activate items in the Power-Up Shop cart
 */
async function checkoutPowerUps() {
    if (!window.cart) return;

    const items = window.cart.getItems();
    const keys = Object.keys(items);
    if (keys.length === 0) return;

    const totalCost = window.cart.getTotalCost();
    const checkoutBtn = document.getElementById("checkout-button");

    // Throttling button activity to prevent duplicate checkout submissions
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Activating Upgrades...";
    }

    const payload = {
        upgrades: keys.map(id => ({
            id: id,
            quantity: items[id].quantity
        })),
        expectedCost: totalCost
    };

    try {
        const response = await secureFetch("/api/shop/checkout", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("Team upgrades successfully activated!");
            window.cart.clearCart();

            if (result.updatedPoints !== undefined) {
                syncPointsDisplay(result.updatedPoints);
            }

            // Sync scoreboard log displays
            fetchRealTimeUpdates();
        } else {
            alert(`Activation rejected: ${result.error || "validation failure"}`);
        }
    } catch (error) {
        console.error("Checkout request failed:", error);
        alert("Network error processing upgrade activation.");
    } finally {
        if (checkoutBtn) {
            checkoutBtn.textContent = "Activate Team Upgrades";
            // Disable if cart is now empty
            const currentCount = window.cart ? window.cart.getTotalCount() : 0;
            checkoutBtn.disabled = (currentCount === 0);
            if (currentCount === 0) {
                checkoutBtn.classList.add("disabled");
            } else {
                checkoutBtn.classList.remove("disabled");
            }
        }
    }
}

/**
 * Sync dynamic points displays in the HTML layout
 */
function syncPointsDisplay(points) {
    const headerPoints = document.getElementById("team-points-display");
    const leaderboardPoints = document.getElementById("leaderboard-team-points");

    if (headerPoints) headerPoints.textContent = points;
    if (leaderboardPoints) leaderboardPoints.textContent = `${points} pts`;
}

/**
 * Fetch latest scores, standings, and activities from backend api
 */
async function fetchRealTimeUpdates() {
    try {
        const response = await fetch("/api/quiz/state");
        if (!response.ok) return;

        const data = await response.json();

        // Sync local points display
        if (data.teamPoints !== undefined) {
            syncPointsDisplay(data.teamPoints);
        }

        // Render Leaderboard Standings
        if (data.leaderboard) {
            renderLeaderboard(data.leaderboard);
        }

        // Render Activities Log Feed
        if (data.activities) {
            renderActivities(data.activities);
        }
    } catch (e) {
        // Fail silently on polling queries to avoid disrupting interaction flows
        console.log("Background state update paused.");
    }
}

/**
 * Render dynamic team standings list safely using anti-XSS escapes
 */
function renderLeaderboard(list) {
    const leaderboardBox = document.getElementById("leaderboard-items");
    if (!leaderboardBox) return;

    leaderboardBox.innerHTML = "";

    list.forEach((item, index) => {
        const rank = index + 1;
        const isCurrent = item.team === "Cyber_Sentinels";
        const itemDiv = document.createElement("div");

        itemDiv.className = `leaderboard-item rank-${rank} ${isCurrent ? 'current-team' : ''}`;
        itemDiv.innerHTML = `
            <span class="rank-number">${rank}</span>
            <span class="team-name">${escapeHTML(item.team)} ${isCurrent ? '(You)' : ''}</span>
            <span class="team-score" ${isCurrent ? 'id="leaderboard-team-points"' : ''}>${item.points} pts</span>
        `;
        leaderboardBox.appendChild(itemDiv);
    });
}

/**
 * Render activity logs feed safely using anti-XSS escapes
 */
function renderActivities(list) {
    const feedBox = document.getElementById("activity-feed");
    if (!feedBox) return;

    feedBox.innerHTML = "";

    list.forEach(act => {
        const feedDiv = document.createElement("div");
        feedDiv.className = "feed-item";
        feedDiv.innerHTML = `
            <span class="feed-time">${escapeHTML(act.time)}</span>
            <p class="feed-text"><strong>${escapeHTML(act.team)}</strong> ${escapeHTML(act.action)}</p>
        `;
        feedBox.appendChild(feedDiv);
    });
}

/**
 * Simple HTML strings escape utility (XSS prevention)
 */
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}
