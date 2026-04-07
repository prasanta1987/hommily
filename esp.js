/**
 * Hommily Master Dashboard v4.3 - Fully Fixed
 * Standardized Firebase Compat & Error Handling
 */

const firebaseConfig = {
    apiKey: "AIzaSyB29axtA3Rs-zmdordgsEgAnm1VF3TI4TE",
    authDomain: "hommily.firebaseapp.com",
    databaseURL: "https://hommily-default-rtdb.firebaseio.com",
    projectId: "hommily",
    storageBucket: "hommily.appspot.com",
    messagingSenderId: "755201111078",
    appId: "1:755201111078:web:1e484033a2f069786662e7"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// --- State Management ---
const CACHE_KEY = 'hommily_local_data';
let allDevices = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
let currentLocalMac = localStorage.getItem('hommily_cache_mac') || "";
let isInteracting = false;
let interactionTimer;
let lastStats = { free: 0, total: 1, uptime: 0 };

// --- 1. CSS Injection ---
const injectCSS = () => {
    if (document.getElementById('hommily-styles')) return;
    const style = document.createElement('style');
    style.id = 'hommily-styles';
    style.textContent = `
        :root { 
            --bg: #030712; --card: #111827; --accent: #38bdf8; 
            --success: #10b981; --danger: #ef4444;
        }
        body { 
            background: var(--bg); margin: 0; min-height: 100vh; 
            font-family: -apple-system, system-ui, sans-serif; color: white; 
            -webkit-tap-highlight-color: transparent;
        }
        #device-container { padding: 16px; max-width: 1000px; margin: 0 auto; }
        .stats-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; }
        .stats-row::-webkit-scrollbar { display: none; }
        .stats-card {
            width:100%;
            background: var(--card); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 1.25rem; padding: 12px 20px; min-width: 170px;
            display: flex; align-items: center; gap: 12px;
        }
        .dashboard-grid { 
            display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 16px; width: 100%; 
        }
        .feedsContainer { 
            margin-bottom: 32px; border: 1px solid #134e4a; 
            padding: 12px; border-radius: 1.25rem; background: rgba(17, 24, 39, 0.4);
        }
        .deviceDescription { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px; }
        .card-glass { 
            background: var(--card); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);
            padding: 5px 10px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center;
            transition: transform 0.2s ease;
        }
        .card-glass:active { transform: scale(0.98); }
        .toggle-box { 
            width: 66px; height: 32px; border-radius: 100px; position: relative; cursor: pointer; 
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); border: 1px solid #333; margin: 15px 0; transition: background 0.3s;
        }
        .toggle-box.on { background: #064e3b; border-color: #065f46; }
        .toggle-box.off { background: #451a1a; border-color: #7f1d1d; }
        .toggle-knob { 
            width: 26px; height: 26px; background: #475569; border-radius: 50%; position: absolute; top: 2px; left: 2px; 
            transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); box-shadow: 0 4px 6px rgba(0,0,0,0.4); 
        }
        .on .toggle-knob { transform: translateX(34px); background: var(--success); }
        .device-label { background: #134e4a; color: #5eead4; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.65rem; display: inline-flex; align-items: center; gap: 5px; }
        .label-text { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .auth-status { font-size: 11px; color: #94a3b8; margin-bottom: 12px; text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
        .login-overlay { position: fixed; inset: 0; background: rgba(3, 7, 18, 0.95); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .login-card { background: #111827; padding: 32px; border-radius: 24px; width: 90%; max-width: 340px; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        input { width: 100%; padding: 14px; margin: 10px 0; border-radius: 12px; background: #1f2937; border: 1px solid #374151; color: white; font-size: 16px; outline: none; box-sizing: border-box; }
        input:focus { border-color: var(--accent); }
        button { width: 100%; padding: 14px; margin-top: 12px; border-radius: 12px; background: var(--accent); color: #030712; border: none; font-weight: 700; cursor: pointer; font-size: 16px; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
};

// --- 2. Render Engine ---

function renderHeader() {
    const target = document.getElementById('header-target');
    if (!target) return;
    const ramPercent = Math.round((lastStats.free / lastStats.total) * 100) || 0;
    const authMail = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || "Hub User") : "Guest";
    target.innerHTML = `
        <div class="auth-status">
            <div style="text-align:right"><span class="label-text" style="display:block">Authenticated As</span><strong>${authMail}</strong></div>
            <button onclick="auth.signOut()" style="width:auto; padding:6px 12px; margin:0; font-size:10px; background:#1e293b; color:#94a3b8">Sign Out</button>
        </div>
        <div class="stats-row">
            <div class="stats-card">
                <div style="position:relative; width:40px; height:40px;">
                    <svg viewBox="0 0 36 36" style="transform: rotate(-90deg)">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" stroke-width="3"></circle>
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="${ramPercent}, 100" stroke-linecap="round"></circle>
                    </svg>
                    <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:900;">${ramPercent}%</div>
                </div>
                <div><div class="label-text">Memory</div><div style="font-size:14px; font-weight:900;">${Math.round(lastStats.free / 1024)}KB</div></div>
            </div>
            <div class="stats-card">
                <div style="color:#38bdf8"><i data-lucide="clock" class="w-5 h-5"></i></div>
                <div><div class="label-text">Uptime</div><div style="font-size:14px; font-weight:900;">${Math.floor(lastStats.uptime / 60)}m ${lastStats.uptime % 60}s</div></div>
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function renderDevices() {
    const target = document.getElementById('devices-target');
    if (!target) return;

    const macs = Object.keys(allDevices);
    if (macs.length === 0) {
        target.innerHTML = `
            <div style="text-align:center; padding:60px; color:#4b5563;">
                <i data-lucide="server-off" style="width:48px; height:48px; opacity:0.2"></i>
                <p>Waiting for cloud data...</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    target.innerHTML = macs.map(mac => `
        <div class="feedsContainer">
            <div class="deviceDescription">
                <div class="device-label">
                    <i data-lucide="cpu" class="w-3 h-3"></i>
                    ${allDevices[mac].deviceName || 'Smart Hub'}
                </div>
                <span style="font-size:10px; font-family:monospace; color:#4b5563;">${mac}</span>
            </div>
            <div class="dashboard-grid">${renderFeeds(mac, allDevices[mac].devFeeds)}</div>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}

function renderFeeds(mac, feeds) {
    if (!feeds) return '';
    return Object.keys(feeds).map(id => {
        const f = feeds[id];
        if (f.type === "Gauge") {
            const val = parseFloat(f.value) || 0;
            const norm = Math.min(Math.max(((val - (f.rangeMin || 0)) / ((f.rangeMax || 100) - (f.rangeMin || 0))), 0), 1);
            return `
            <div class="card-glass">
                <div style="display:flex; width:100%; justify-content:space-between; color:#38bdf8;"><span class="label-text">${id}</span><i data-lucide="activity" class="w-3 h-3 opacity-30"></i></div>
                <div style="position:relative; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:10px 0;">
                    <svg style="transform: rotate(135deg)" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" stroke-width="4" stroke-dasharray="66 100" stroke-linecap="round"></circle>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="url(#g-${id})" stroke-width="4" stroke-dasharray="${norm * 66} 100" stroke-linecap="round"></circle>
                        <defs><linearGradient id="g-${id}"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>
                    </svg>
                    <span style="position:absolute; font-size:18px; font-weight:900;">${val}</span>
                </div>
                <div class="label-text" style="color:var(--success)">Live</div>
            </div>`;
        }
        const isUiOn = (f.value == 1);
        return `
        <div class="card-glass">
            <div style="display:flex; width:100%; justify-content:space-between; color:#38bdf8;"><span class="label-text">${id}</span><i data-lucide="zap" class="w-3 h-3 opacity-30"></i></div>
            <div class="toggle-box ${isUiOn ? 'on' : 'off'}" onclick="window.handleToggle('${mac}', '${id}', ${!isUiOn})"><div class="toggle-knob"></div></div>
            <div class="label-text">${isUiOn ? 'Active' : 'Idle'}</div>
        </div>`;
    }).join('');
}

// --- 3. Controllers ---

window.handleToggle = async (mac, feedId, uiState) => {
    isInteracting = true;
    clearTimeout(interactionTimer);

    const newUiValue = uiState ? 1 : 0;
    if (allDevices[mac] && allDevices[mac].devFeeds[feedId]) {
        allDevices[mac].devFeeds[feedId].value = newUiValue;
        localStorage.setItem(CACHE_KEY, JSON.stringify(allDevices));
        renderDevices();

        const f = allDevices[mac].devFeeds[feedId];
        const hwValue = f.isSwapped ? (uiState ? 0 : 1) : newUiValue;

        if (mac === currentLocalMac) {
            fetch(`/api/control?pin=${f.GPIO}&state=${hwValue}`).catch(() => { });
        }

        if (auth.currentUser) {
            db.ref(`${auth.currentUser.uid}/${mac}/devFeeds/${feedId}`).update({ value: newUiValue });
        }
    }
    interactionTimer = setTimeout(() => { isInteracting = false; }, 2500);
};

window.tryLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('pass-input').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = "Connecting...";

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        document.getElementById('login-ui')?.remove();
    } catch (err) {
        document.getElementById('login-error').innerText = "Error: " + err.message;
        btn.disabled = false;
        btn.innerText = "Connect to Hub";
    }
};

async function refreshStats() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        lastStats = data;
        if (data.mac) {
            currentLocalMac = data.mac;
            localStorage.setItem('hommily_cache_mac', currentLocalMac);
        }
    } catch (e) {
        lastStats.uptime += 3;
        lastStats.free = 145000 + Math.random() * 2000;
        lastStats.total = 256000;
    }
    renderHeader();
}

// --- 4. Initialization ---

async function init() {
    injectCSS();
    const container = document.getElementById('device-container');
    if (container) {
        container.innerHTML = `<div id="header-target"></div><div id="devices-target"></div>`;
    }

    renderHeader();
    renderDevices();
    setInterval(refreshStats, 3000);

    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('login-ui')?.remove();
            db.ref(user.uid).on('value', (snap) => {
                if (!isInteracting && snap.val()) {
                    allDevices = snap.val();
                    localStorage.setItem(CACHE_KEY, JSON.stringify(allDevices));
                    renderDevices();
                }
            });
        } else {
            showLoginUI();
        }
    });
}

function showLoginUI() {
    if (document.getElementById('login-ui')) return;
    const ui = document.createElement('div');
    ui.id = 'login-ui';
    ui.className = 'login-overlay';
    ui.innerHTML = `
        <div class="login-card">
            <div style="text-align:center; margin-bottom:20px;">
                <div style="background:var(--accent); width:50px; height:50px; border-radius:15px; display:inline-flex; align-items:center; justify-content:center; color:#030712; margin-bottom:10px;">
                    <i data-lucide="lock" style="width:24px; height:24px"></i>
                </div>
                <h2 style="margin:0">Hommily Cloud</h2>
                <p style="font-size:12px; color:#64748b; margin:5px 0 0 0">Secure Device Access</p>
            </div>
            <form onsubmit="window.tryLogin(event)">
                <input type="email" id="email-input" placeholder="Email Address" required>
                <input type="password" id="pass-input" placeholder="Password" required>
                <div id="login-error" style="color:var(--danger); font-size:11px; margin-top:8px; text-align:center; min-height:14px;"></div>
                <button type="submit">Connect to Hub</button>
            </form>
        </div>`;
    document.body.appendChild(ui);
    if (window.lucide) lucide.createIcons();
}

// Start the app
window.onload = init;