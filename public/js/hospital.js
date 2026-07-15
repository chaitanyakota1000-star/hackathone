/**
 * Developer 1: Frontend Layout — Hospital Dashboard Client Logic
 * Populates triage queue, bed map, vitals monitor, staff list, and activity feed.
 * Uses mock data; swap fetch() calls to live API endpoints when backend is ready.
 */

// ── Mock Data ─────────────────────────────────────────────────────────────────

const TRIAGE_PATIENTS = [
    { id: "P-001", name: "Ravi Kumar",      age: 62, complaint: "Chest pain, shortness of breath",  priority: "critical", waitMins: 2  },
    { id: "P-002", name: "Sunita Sharma",   age: 45, complaint: "Severe abdominal pain",             priority: "urgent",   waitMins: 8  },
    { id: "P-003", name: "Arjun Mehta",     age: 28, complaint: "Head injury after fall",            priority: "urgent",   waitMins: 11 },
    { id: "P-004", name: "Priya Nair",      age: 35, complaint: "High fever, vomiting",              priority: "semi",     waitMins: 22 },
    { id: "P-005", name: "Mohammed Salim",  age: 70, complaint: "Dizziness, mild confusion",         priority: "semi",     waitMins: 28 },
    { id: "P-006", name: "Deepa Verma",     age: 19, complaint: "Ankle sprain",                      priority: "safe",     waitMins: 45 },
    { id: "P-007", name: "Rahul Singh",     age: 33, complaint: "Minor laceration, right hand",      priority: "safe",     waitMins: 52 },
];

const WARDS = [
    {
        name: "ICU",
        beds: [
            { id: "ICU-01", status: "critical" },
            { id: "ICU-02", status: "critical" },
            { id: "ICU-03", status: "occupied" },
            { id: "ICU-04", status: "occupied" },
            { id: "ICU-05", status: "available" },
            { id: "ICU-06", status: "available" },
        ]
    },
    {
        name: "General Ward A",
        beds: [
            { id: "GA-01", status: "occupied" },
            { id: "GA-02", status: "occupied" },
            { id: "GA-03", status: "available" },
            { id: "GA-04", status: "occupied" },
            { id: "GA-05", status: "available" },
            { id: "GA-06", status: "available" },
            { id: "GA-07", status: "occupied" },
            { id: "GA-08", status: "available" },
            { id: "GA-09", status: "maintenance" },
            { id: "GA-10", status: "occupied" },
        ]
    },
    {
        name: "General Ward B",
        beds: [
            { id: "GB-01", status: "available" },
            { id: "GB-02", status: "occupied" },
            { id: "GB-03", status: "occupied" },
            { id: "GB-04", status: "available" },
            { id: "GB-05", status: "occupied" },
            { id: "GB-06", status: "available" },
            { id: "GB-07", status: "occupied" },
            { id: "GB-08", status: "available" },
        ]
    },
    {
        name: "Paediatrics",
        beds: [
            { id: "PD-01", status: "occupied" },
            { id: "PD-02", status: "available" },
            { id: "PD-03", status: "available" },
            { id: "PD-04", status: "occupied" },
            { id: "PD-05", status: "maintenance" },
            { id: "PD-06", status: "available" },
        ]
    },
];

const STAFF = [
    { name: "Dr. Ananya Rao",     role: "Senior Surgeon",     status: "in-surgery", icon: "👩‍⚕️" },
    { name: "Dr. Vikram Patel",   role: "Cardiologist",       status: "on-duty",    icon: "👨‍⚕️" },
    { name: "Dr. Meera Joshi",    role: "Emergency Medicine", status: "on-duty",    icon: "👩‍⚕️" },
    { name: "Nurse Kavita Singh", role: "Head Nurse, ICU",    status: "on-duty",    icon: "👩‍⚕️" },
    { name: "Nurse Arun Das",     role: "Triage Nurse",       status: "on-duty",    icon: "👨‍⚕️" },
    { name: "Dr. Sameer Khan",    role: "Paediatrician",      status: "on-break",   icon: "👨‍⚕️" },
];

const ACTIVITIES = [
    { time: "Just now", text: "<strong>P-001 Ravi Kumar</strong> flagged as <em>Critical</em> — cardiac team alerted." },
    { time: "3 min ago", text: "<strong>ICU-05</strong> bed released — cleaned and ready." },
    { time: "8 min ago", text: "<strong>Dr. Ananya Rao</strong> entered surgery with patient P-009." },
    { time: "14 min ago", text: "<strong>P-007 Rahul Singh</strong> admitted to General Ward A, bed GA-04." },
    { time: "22 min ago", text: "<strong>GA-09</strong> marked under maintenance by facilities." },
    { time: "35 min ago", text: "<strong>12 patients</strong> discharged in morning round." },
];

// Vitals cycles through triage patients
const VITALS_DATA = [
    { patientId: "P-004", hr: 92,  spo2: 96, bp: "138/88", temp: 37.2, rr: 18, pain: 6 },
    { patientId: "P-001", hr: 118, spo2: 88, bp: "160/100", temp: 38.6, rr: 24, pain: 9 },
    { patientId: "P-002", hr: 105, spo2: 97, bp: "145/92", temp: 37.8, rr: 20, pain: 8 },
    { patientId: "P-003", hr: 78,  spo2: 99, bp: "120/78", temp: 36.9, rr: 16, pain: 5 },
];

// ── State ──────────────────────────────────────────────────────────────────────

let currentVitalsIndex = 0;
let triageQueue = [...TRIAGE_PATIENTS];

// ── Init ───────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    renderTriageQueue();
    renderWardMap();
    renderVitals(VITALS_DATA[currentVitalsIndex]);
    renderStaff();
    renderActivityFeed();

    // Bind buttons
    document.getElementById("btn-admit-next")?.addEventListener("click", admitNextPatient);
    document.getElementById("btn-cycle-patient")?.addEventListener("click", cycleVitals);

    // Auto-refresh vitals every 10 seconds
    setInterval(simulateVitalsFluctuation, 10000);

    // Auto-refresh activity feed every 15 seconds
    setInterval(tickActivityTimes, 15000);
});

// ── Triage Queue ───────────────────────────────────────────────────────────────

function renderTriageQueue() {
    const list = document.getElementById("triage-list");
    if (!list) return;

    if (triageQueue.length === 0) {
        list.innerHTML = `<div class="empty-cart-msg">No patients currently in triage queue.</div>`;
        return;
    }

    list.innerHTML = triageQueue.map(p => `
        <div class="triage-item priority-${p.priority}" data-id="${p.id}" title="${p.complaint}">
            <span class="triage-priority-dot"></span>
            <div class="triage-patient-info">
                <span class="triage-patient-name">${p.name} <small style="color:var(--text-muted);font-weight:400;">(${p.age}y)</small></span>
                <span class="triage-patient-meta">${p.complaint}</span>
            </div>
            <span class="triage-wait-time">⏱ ${formatWait(p.waitMins)}</span>
            <span class="triage-badge badge-${p.priority}">${p.priority}</span>
        </div>
    `).join("");

    // Update the queue stat
    document.getElementById("stat-waiting").textContent = triageQueue.length;
    document.getElementById("critical-count").textContent =
        triageQueue.filter(p => p.priority === "critical").length;
}

function admitNextPatient() {
    if (triageQueue.length === 0) {
        alert("Triage queue is empty.");
        return;
    }

    // Admit the top-priority patient (already sorted: critical first)
    const admitted = triageQueue.shift();
    renderTriageQueue();

    // Log it
    addActivityEntry(`<strong>${admitted.name}</strong> (${admitted.id}) admitted from triage queue.`);

    // Update discharged/patients stats (mock)
    const activeEl = document.getElementById("stat-patients");
    if (activeEl) activeEl.textContent = parseInt(activeEl.textContent) + 1;
}

// ── Ward Bed Map ───────────────────────────────────────────────────────────────

function renderWardMap() {
    const container = document.getElementById("ward-sections");
    if (!container) return;

    container.innerHTML = WARDS.map(ward => {
        const total     = ward.beds.length;
        const available = ward.beds.filter(b => b.status === "available").length;

        const bedCells = ward.beds.map(bed => `
            <div class="bed-cell ${bed.status}" title="${bed.id} — ${bed.status}" data-bed="${bed.id}">
                ${bed.id.split("-")[1]}
            </div>
        `).join("");

        return `
            <div class="ward-block">
                <div class="ward-block-header">
                    <span class="ward-block-name">${ward.name}</span>
                    <span class="ward-capacity">
                        <span>${available}</span> / ${total} available
                    </span>
                </div>
                <div class="beds-grid">${bedCells}</div>
            </div>
        `;
    }).join("");

    // Update stat
    const totalAvailable = WARDS.flatMap(w => w.beds).filter(b => b.status === "available").length;
    document.getElementById("stat-beds-available").textContent = totalAvailable;
}

// ── Vitals Monitor ─────────────────────────────────────────────────────────────

function renderVitals(data) {
    document.getElementById("vitals-patient-badge").textContent = data.patientId;
    document.getElementById("vital-hr").innerHTML   = `${data.hr} <small>bpm</small>`;
    document.getElementById("vital-spo2").innerHTML = `${data.spo2} <small>%</small>`;
    document.getElementById("vital-bp").innerHTML   = `${data.bp} <small>mmHg</small>`;
    document.getElementById("vital-temp").innerHTML = `${data.temp} <small>°C</small>`;
    document.getElementById("vital-rr").innerHTML   = `${data.rr} <small>br/min</small>`;
    document.getElementById("vital-pain").innerHTML = `${data.pain} <small>/10</small>`;

    // Set status classes
    setVitalStatus("vital-hr-status",   data.hr,   60, 100,  "bpm");
    setVitalStatus("vital-spo2-status", data.spo2, 95, 100,  "%",   true);
    setVitalStatus("vital-bp-status",   null, null, null, null, false, data.bp);
    setVitalStatus("vital-temp-status", data.temp, 36.1, 37.5, "°C");
    setVitalStatus("vital-rr-status",   data.rr,  12, 20,  "br/min");
    setVitalStatus("vital-pain-status", data.pain, 0, 3, "/10");
}

/**
 * Update a vital's status badge
 * @param {string} elId   - element id
 * @param {number} val    - numeric value
 * @param {number} low    - lower normal bound
 * @param {number} high   - upper normal bound
 * @param {string} unit
 * @param {boolean} highIsGood - e.g. SpO2: higher is better
 * @param {string|null} rawBP  - raw BP string like "138/88" for special handling
 */
function setVitalStatus(elId, val, low, high, unit, highIsGood = false, rawBP = null) {
    const el = document.getElementById(elId);
    if (!el) return;

    el.className = "vital-status";

    if (rawBP) {
        // Parse systolic
        const systolic = parseInt(rawBP.split("/")[0]);
        if (systolic >= 140) {
            el.className += " danger";
            el.textContent = "↑ High";
        } else if (systolic >= 130) {
            el.className += " warning";
            el.textContent = "↑ High";
        } else {
            el.className += " normal";
            el.textContent = "✓ Normal";
        }
        return;
    }

    if (val === null) return;

    if (highIsGood) {
        // Lower is worse (SpO2)
        if (val < low) {
            el.className += " danger";
            el.textContent = "↓ Low";
        } else {
            el.className += " normal";
            el.textContent = "✓ Normal";
        }
        return;
    }

    if (val < low) {
        el.className += " warning";
        el.textContent = "↓ Low";
    } else if (val > high) {
        if (val > high * 1.2) {
            el.className += " danger";
            el.textContent = "↑ Critical";
        } else {
            el.className += " warning";
            el.textContent = "↑ High";
        }
    } else {
        el.className += " normal";
        el.textContent = "✓ Normal";
    }
}

function cycleVitals() {
    currentVitalsIndex = (currentVitalsIndex + 1) % VITALS_DATA.length;
    renderVitals(VITALS_DATA[currentVitalsIndex]);
}

/** Simulate small random fluctuations in vitals */
function simulateVitalsFluctuation() {
    const data = VITALS_DATA[currentVitalsIndex];

    data.hr   = clamp(data.hr   + randInt(-3, 3), 40, 180);
    data.spo2 = clamp(data.spo2 + randInt(-1, 1), 70, 100);
    data.rr   = clamp(data.rr   + randInt(-1, 1), 8, 40);
    data.temp = parseFloat((data.temp + (Math.random() * 0.2 - 0.1)).toFixed(1));

    renderVitals(data);
}

// ── Staff List ─────────────────────────────────────────────────────────────────

function renderStaff() {
    const list = document.getElementById("staff-list");
    if (!list) return;

    const statusLabel = { "on-duty": "On Duty", "in-surgery": "In Surgery", "on-break": "On Break" };

    list.innerHTML = STAFF.map(s => `
        <div class="staff-item">
            <div class="staff-avatar">${s.icon}</div>
            <div class="staff-info">
                <span class="staff-name">${s.name}</span>
                <span class="staff-role">${s.role} — ${statusLabel[s.status]}</span>
            </div>
            <div class="staff-status-dot ${s.status}" title="${statusLabel[s.status]}"></div>
        </div>
    `).join("");

    // Update stat count
    const onDuty = STAFF.filter(s => s.status !== "on-break").length;
    document.getElementById("stat-doctors").textContent = onDuty;
}

// ── Activity Feed ──────────────────────────────────────────────────────────────

function renderActivityFeed() {
    const feed = document.getElementById("hospital-activity-feed");
    if (!feed) return;

    feed.innerHTML = ACTIVITIES.map((a, i) => `
        <div class="feed-item" style="${i === 0 ? 'border-left-color: var(--accent-primary)' : ''}">
            <span class="feed-time">${a.time}</span>
            <p class="feed-text">${a.text}</p>
        </div>
    `).join("");
}

/** Prepend a new entry to the activity feed */
function addActivityEntry(text) {
    ACTIVITIES.unshift({ time: "Just now", text });
    if (ACTIVITIES.length > 12) ACTIVITIES.pop();
    renderActivityFeed();
}

/** Simulate time passing on feed entries */
function tickActivityTimes() {
    const timeSteps = ["Just now", "1 min ago", "5 min ago", "10 min ago", "15 min ago", "30 min ago", "1 hr ago"];
    ACTIVITIES.forEach(a => {
        const idx = timeSteps.indexOf(a.time);
        if (idx !== -1 && idx < timeSteps.length - 1) {
            a.time = timeSteps[idx + 1];
        }
    });
    renderActivityFeed();
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function formatWait(mins) {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
