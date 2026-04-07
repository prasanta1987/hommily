/**
 * Hommily Master Dashboard v4.6 - The "Everything" Version
 * Features: Auth, Stats Header, Dropdown Selection, SVG Gauges
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
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- State Management ---
const CACHE_KEY = 'hommily_local_data';
let allDevices = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
let openDropdown = null;
let currentLocalMac = localStorage.getItem('hommily_cache_mac') || "";
let lastStats = { free: 0, total: 1, uptime: 0 };

const injectCSS = () => {
    if (document.getElementById('hommily-styles')) return;
    const style = document.createElement('style');
    style.id = 'hommily-styles';
    style.textContent = `
        :root { --bg: #030712; --card: #111827; --accent: #38bdf8; --success: #10b981; --danger: #ef4444; }
        body { background: var(--bg); margin: 0; font-family: -apple-system, sans-serif; color: white; -webkit-tap-highlight-color: transparent; }
        #device-container { padding: 16px; max-width: 1000px; margin: 0 auto; }
        
        /* Header Stats */
        .auth-status { font-size: 11px; color: #94a3b8; margin-bottom: 12px; display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
        .stats-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 24px; overflow-x: auto; }
        .stats-card { background: var(--card); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem; padding: 12px 20px; min-width: 170px; display: flex; align-items: center; gap: 12px; flex: 1; }
        
        /* Navigation & Dropdown */
        .tabs-row { display: flex; gap: 10px; margin-bottom: 20px; position: relative; }
        .tab-wrapper { position: relative; }
        .tab-btn { background: #1f2937; border: 1px solid #374151; color: white; padding: 10px 18px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: 0.2s; }
        .feed-dropdown { position: absolute; top: 110%; left: 0; width: 220px; background: white; border-radius: 12px; overflow: hidden; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: none; flex-direction: column; }
        .feed-dropdown.show { display: flex; }
        .dropdown-item { padding: 12px 16px; color: #111827; font-size: 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid #f3f4f6; }
        .dropdown-item.selected { background: #3b82f6; color: white; }
        
        /* Main Grid */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; width: 100%; }
        .card-glass { background: var(--card); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        
        /* Controls */
        .toggle-box { width: 66px; height: 32px; border-radius: 100px; position: relative; cursor: pointer; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); border: 1px solid #333; margin: 15px 0; transition: 0.3s; background: #451a1a; }
        .toggle-box.on { background: #064e3b; }
        .toggle-knob { width: 26px; height: 26px; background: #475569; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s; }
        .on .toggle-knob { transform: translateX(34px); background: var(--success); }
        .label-text { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Auth Overlay */
        .login-overlay { position: fixed; inset: 0; background: rgba(3, 7, 18, 0.95); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .login-card { background: #111827; padding: 32px; border-radius: 24px; width: 90%; max-width: 340px; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        input { width: 100%; padding: 14px; margin: 10px 0; border-radius: 12px; background: #1f2937; border: 1px solid #374151; color: white; font-size: 16px; outline: none; box-sizing: border-box; }
        input:focus { border-color: var(--accent); }
        button { width: 100%; padding: 14px; margin-top: 12px; border-radius: 12px; background: var(--accent); color: #030712; border: none; font-weight: 700; cursor: pointer; font-size: 16px; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
};

// --- Render Logic ---

function renderHeader() {
    const target = document.getElementById('header-target');
    if (!target) return;

    const ramPercent = Math.round((lastStats.free / lastStats.total) * 100) || 0;
    const authMail = auth.currentUser ? (auth.currentUser.email || "User") : "Guest";

    target.innerHTML = `
        <div class="auth-status">
            <div style="text-align:right"><span class="label-text" style="display:block">Authenticated As</span><strong>${authMail}</strong></div>
            <button onclick="auth.signOut()" style="width:auto; padding:6px 12px; border-radius:8px; background:#1e293b; color:#94a3b8; border:none; cursor:pointer;">Sign Out</button>
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

function renderApp() {
    const tabsTarget = document.getElementById('tabs-target');
    const feedsTarget = document.getElementById('feeds-target');
    if (!tabsTarget || !feedsTarget) return;

    // 1. Render Navigation Tabs with Dropdowns
    const macs = Object.keys(allDevices);
    tabsTarget.innerHTML = macs.map(mac => {
        const dev = allDevices[mac];
        const isMenuOpen = openDropdown === mac ? 'show' : '';
        return `
        <div class="tab-wrapper">
            <button class="tab-btn" onclick="toggleMenu('${mac}')">
                <i data-lucide="layout" class="w-4 h-4"></i> ${dev.deviceName}
            </button>
            <div class="feed-dropdown ${isMenuOpen}">
                ${Object.keys(dev.devFeeds || {}).map(fId => {
                    const f = dev.devFeeds[fId];
                    return `<div class="dropdown-item ${f.isSelected ? 'selected' : ''}" onclick="toggleFeedSelection('${mac}', '${fId}')">
                        <span>${fId}</span><span style="font-size:10px; opacity:0.6">${f.value}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');

    // 2. Render the actual visible Gauge/Toggle cards
    let feedsHtml = "";
    macs.forEach(mac => {
        const feeds = allDevices[mac].devFeeds || {};
        Object.keys(feeds).forEach(id => {
            const f = feeds[id];
            if (!f.isSelected) return;

            if (f.type === "Gauge") {
                const val = parseFloat(f.value) || 0;
                const norm = Math.min(Math.max(((val - (f.rangeMin || 0)) / ((f.rangeMax || 100) - (f.rangeMin || 0))), 0), 1);
                feedsHtml += `
                <div class="card-glass">
                    <div class="label-text" style="color:#38bdf8">${id}</div>
                    <div style="position:relative; width:80px; height:80px; margin:10px 0;">
                        <svg style="transform: rotate(135deg)" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" stroke-width="4" stroke-dasharray="66 100" stroke-linecap="round"></circle>
                            <circle cx="18" cy="18" r="14" fill="none" stroke="url(#g-${mac}-${id})" stroke-width="4" stroke-dasharray="${norm * 66} 100" stroke-linecap="round"></circle>
                            <defs><linearGradient id="g-${mac}-${id}"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>
                        </svg>
                        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900;">${val}</div>
                    </div>
                    <div class="label-text" style="color:var(--success)">${allDevices[mac].deviceName}</div>
                </div>`;
            } else {
                const isOn = f.value == 1;
                feedsHtml += `
                <div class="card-glass">
                    <div class="label-text" style="color:#38bdf8">${id}</div>
                    <div class="toggle-box ${isOn ? 'on' : ''}" onclick="handleToggle('${mac}','${id}',${!isOn})">
                        <div class="toggle-knob"></div>
                    </div>
                    <div class="label-text">${allDevices[mac].deviceName}</div>
                </div>`;
            }
        });
    });
    feedsTarget.innerHTML = feedsHtml || `<p style="grid-column:1/-1; text-align:center; opacity:0.3; margin-top:40px;">Select feeds from the device menu</p>`;
    if (window.lucide) lucide.createIcons();
}

// --- Action Logic ---

window.toggleMenu = (mac) => { openDropdown = (openDropdown === mac) ? null : mac; renderApp(); };

window.toggleFeedSelection = (mac, feedId) => {
    allDevices[mac].devFeeds[feedId].isSelected = !allDevices[mac].devFeeds[feedId].isSelected;
    localStorage.setItem(CACHE_KEY, JSON.stringify(allDevices));
    renderApp();
};

window.handleToggle = async (mac, feedId, newState) => {
    const val = newState ? 1 : 0;
    allDevices[mac].devFeeds[feedId].value = val;
    renderApp();
    if (auth.currentUser) db.ref(`${auth.currentUser.uid}/${mac}/devFeeds/${feedId}`).update({ value: val });
};

window.tryLogin = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Connecting...";
    try {
        await auth.signInWithEmailAndPassword(document.getElementById('email-input').value, document.getElementById('pass-input').value);
        document.getElementById('login-ui')?.remove();
    } catch (err) {
        document.getElementById('login-error').innerText = err.message;
        btn.innerText = "Try Again";
    }
};

async function refreshStats() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        lastStats = data;
        if (data.mac) localStorage.setItem('hommily_cache_mac', data.mac);
    } catch (e) {
        lastStats.uptime += 3;
        lastStats.free = 145000 + Math.random() * 2000;
        lastStats.total = 256000;
    }
    renderHeader();
}

// --- Init ---

function init() {
    injectCSS();
    const container = document.getElementById('device-container');
    if (container) container.innerHTML = `<div id="header-target"></div><div id="tabs-target" class="tabs-row"></div><div id="feeds-target" class="dashboard-grid"></div>`;
    
    setInterval(refreshStats, 3000);
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('login-ui')?.remove();
            db.ref(user.uid).on('value', snap => {
                const cloudData = snap.val();
                if (cloudData) {
                    // Sync selections
                    Object.keys(cloudData).forEach(m => {
                        Object.keys(cloudData[m].devFeeds || {}).forEach(f => {
                            if (allDevices[m]?.devFeeds[f]) cloudData[m].devFeeds[f].isSelected = allDevices[m].devFeeds[f].isSelected;
                        });
                    });
                    allDevices = cloudData;
                    renderHeader();
                    renderApp();
                }
            });
        } else showLoginUI();
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

window.onload = init;