/**
 * Developer 2: Client-Side Logic (Quiz Mechanics & Team Synchronizer)
 * Drives state synchronization, submissions, timers, and updates dashboard tables.
 */

// Local Application State
const appState = {
    currentQuestionId: "q_hardening_01",
    selectedOption: "C", // default based on initial HTML selection
    hasSubmitted: false,
    timerSeconds: 24,
    timerInterval: null
};

// Start operations on page load
document.addEventListener("DOMContentLoaded", () => {
    bindQuizEvents();
    startCountdown();
    
    // Poll for real-time score updates and feeds every 8 seconds
    setInterval(fetchRealTimeData, 8000);
});

/**
 * Handle quiz interactions
 */
function bindQuizEvents() {
    const optionsGrid = document.getElementById("question-options");
    const submitBtn = document.getElementById("btn-submit-answer");

    if (optionsGrid) {
        optionsGrid.addEventListener("click", (e) => {
            if (appState.hasSubmitted) return;

            const clickedBtn = e.target.closest(".option-btn");
            if (!clickedBtn) return;

            // Remove selected class from all options
            const options = optionsGrid.querySelectorAll(".option-btn");
            options.forEach(btn => btn.classList.remove("selected"));

            // Set clicked button as selected
            clickedBtn.classList.add("selected");
            appState.selectedOption = clickedBtn.getAttribute("data-option");
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", submitAnswer);
    }
}

/**
 * Start Question Countdown Timer
 */
function startCountdown() {
    const timerText = document.getElementById("quiz-timer");
    const timerProgress = document.getElementById("timer-progress");
    const totalDuration = 30; // 30 seconds limit

    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
    }

    appState.timerInterval = setInterval(() => {
        appState.timerSeconds--;
        
        if (timerText) {
            timerText.textContent = `${appState.timerSeconds}s`;
        }

        if (timerProgress) {
            const percentage = (appState.timerSeconds / totalDuration) * 100;
            timerProgress.style.width = `${percentage}%`;

            if (appState.timerSeconds <= 5) {
                timerProgress.style.background = "var(--accent-red)";
                if (timerText) timerText.style.color = "var(--accent-red)";
            } else {
                timerProgress.style.background = "linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))";
                if (timerText) timerText.style.color = "var(--accent-amber)";
            }
        }

        if (appState.timerSeconds <= 0) {
            clearInterval(appState.timerInterval);
            handleTimeExpiration();
        }
    }, 1000);
}

/**
 * Trigger answer submission to backend Express Server
 */
async function submitAnswer() {
    if (appState.hasSubmitted) return;

    const submitBtn = document.getElementById("btn-submit-answer");
    const optionsGrid = document.getElementById("question-options");

    if (!appState.selectedOption) {
        alert("Please select an option before locking in!");
        return;
    }

    try {
        appState.hasSubmitted = true;
        if (submitBtn) {
            submitBtn.textContent = "Locking In...";
            submitBtn.disabled = true;
        }

        const response = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                questionId: appState.currentQuestionId,
                selectedOption: appState.selectedOption
            })
        });

        const result = await response.json();

        if (response.ok && result.processed) {
            // Style result validation visually
            const options = optionsGrid.querySelectorAll(".option-btn");
            options.forEach(btn => {
                const optLetter = btn.getAttribute("data-option");
                if (optLetter === result.correctAnswer) {
                    btn.style.borderColor = "var(--accent-green)";
                    btn.style.background = "rgba(145, 233, 0, 0.05)";
                    btn.querySelector(".option-letter").style.background = "var(--accent-green)";
                    btn.querySelector(".option-letter").style.color = "var(--text-on-accent)";
                } else if (optLetter === appState.selectedOption && !result.isCorrect) {
                    btn.style.borderColor = "var(--accent-red)";
                    btn.style.background = "rgba(255, 70, 70, 0.05)";
                    btn.querySelector(".option-letter").style.background = "var(--accent-red)";
                    btn.querySelector(".option-letter").style.color = "var(--text-on-accent)";
                }
            });

            if (result.isCorrect) {
                if (submitBtn) submitBtn.textContent = "Correct! Locked In";
                if (submitBtn) submitBtn.style.background = "var(--accent-green)";
            } else {
                if (submitBtn) submitBtn.textContent = "Incorrect! Locked In";
                if (submitBtn) submitBtn.style.background = "var(--accent-red)";
            }

            // Sync updated points details
            if (result.updatedPoints !== undefined) {
                teamPoints = result.updatedPoints;
                syncTeamPoints(teamPoints);
            }

            // Stop timer
            clearInterval(appState.timerInterval);
            
            // Sync dashboard boards
            fetchRealTimeData();
        } else {
            appState.hasSubmitted = false;
            if (submitBtn) {
                submitBtn.textContent = "Lock In Answer";
                submitBtn.disabled = false;
            }
            alert(`Submission error: ${result.error || "validation failure"}`);
        }

    } catch (err) {
        console.error("Submission network error:", err);
        appState.hasSubmitted = false;
        if (submitBtn) {
            submitBtn.textContent = "Lock In Answer";
            submitBtn.disabled = false;
        }
        alert("Failed to submit to backend API. Is the server running?");
    }
}

/**
 * Handle auto-locking or failing when timer hit zero
 */
function handleTimeExpiration() {
    appState.hasSubmitted = true;
    const submitBtn = document.getElementById("btn-submit-answer");
    if (submitBtn) {
        submitBtn.textContent = "Time Expired";
        submitBtn.disabled = true;
        submitBtn.style.background = "var(--text-muted)";
    }
    alert("Time expired! Your team failed to submit in time.");
}

/**
 * Helper to sync global point layouts from other files (e.g. cart.js checkouts)
 * @param {number} points 
 */
function syncTeamPoints(points) {
    const ptsDisplay = document.getElementById("team-points-display");
    const leaderboardPoints = document.getElementById("leaderboard-team-points");
    
    if (ptsDisplay) ptsDisplay.textContent = points;
    if (leaderboardPoints) leaderboardPoints.textContent = `${points} pts`;
}

/**
 * Fetch and synchronize data from Express API
 */
async function fetchRealTimeData() {
    try {
        const response = await fetch("/api/quiz/state");
        if (!response.ok) return;

        const data = await response.json();
        
        // Sync local points
        if (data.teamPoints !== undefined) {
            teamPoints = data.teamPoints;
            syncTeamPoints(teamPoints);
        }

        // Render Leaderboard updates
        if (data.leaderboard) {
            updateLeaderboardUI(data.leaderboard);
        }

        // Render Activity Feed updates
        if (data.activities) {
            updateActivityFeedUI(data.activities);
        }
    } catch (e) {
        // Fail silently during background polling to avoid interrupting flow
        console.log("Background synchronization paused.");
    }
}

/**
 * Update Leaderboard Standings
 * @param {Array} list List of teams
 */
function updateLeaderboardUI(list) {
    const listContainer = document.getElementById("leaderboard-items");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    list.forEach((item, index) => {
        const itemDiv = document.createElement("div");
        const isCurrent = item.team === "Cyber_Sentinels";
        const rank = index + 1;

        itemDiv.className = `leaderboard-item rank-${rank} ${isCurrent ? 'current-team' : ''}`;
        
        itemDiv.innerHTML = `
            <span class="rank-number">${rank}</span>
            <span class="team-name">${item.team} ${isCurrent ? '(You)' : ''}</span>
            <span class="team-score" ${isCurrent ? 'id="leaderboard-team-points"' : ''}>${item.points} pts</span>
        `;
        listContainer.appendChild(itemDiv);
    });
}

/**
 * Update activity feeds
 * @param {Array} list 
 */
function updateActivityFeedUI(list) {
    const feedContainer = document.getElementById("activity-feed");
    if (!feedContainer) return;

    feedContainer.innerHTML = "";
    list.forEach(act => {
        const actDiv = document.createElement("div");
        actDiv.className = "feed-item";
        actDiv.innerHTML = `
            <span class="feed-time">${act.time}</span>
            <p class="feed-text"><strong>${act.team}</strong> ${act.action}</p>
        `;
        feedContainer.appendChild(actDiv);
    });
}

// Export functions for access in inline triggers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.syncTeamPoints = syncTeamPoints;
window.fetchActivityFeed = fetchRealTimeData;
