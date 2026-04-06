/**
 * Hommily Master Dashboard v4.1 - Performance Optimized
 * Separate Header & Device Rendering
 */

import {
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
    ref,
    onValue,
    update
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { auth, db } from "https://hommily.web.app/firebase-config.js";

// --- State Management ---
const CACHE_KEY = 'hommily_local_data';
let allDevices = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
let currentLocalMac = localStorage.getItem('hommily_cache_mac') || "";
let isInteracting = false;
let interactionTimer;
let lastStats = { free: 0, total: 1, uptime: 0 };

// --- 1. CSS Injection ---
const injectCSS = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        :root { --bg: #030712; --card: #111827; --accent: #38bdf8; }
        #device-container { padding: 16px; max-width: 1000px; margin: 0 auto; font-family: sans-serif; color: white; }
        .stats-row { display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; }
        .stats-card { 
            background: var(--card); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 1.25rem; padding: 12px 20px; min-width: 170px;
            display: flex; align-items: center; gap: 12px;
        }
        .dashboard-grid { 
            display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 16px; width: 100%; 
        }
        .card-glass { 
            background: var(--card);
            border-radius: 1.5rem; 
            border: 1px solid rgba(255,255,255,0.05);
            padding: 20px;
            display: flex; flex-direction: column;
            align-items: center; 
            justify-content: space-between;
            // min-height: 190px;
            text-align: center;
        }
        .toggle-box { 
            width: 66px; height: 32px; border-radius: 100px; position: relative; 
            cursor: pointer; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); 
            border: 1px solid #333; margin: 15px 0; transition: background 0.3s;
        }
        .toggle-box.on { background: #064e3b; border-color: #065f46; }
        .toggle-box.off { background: #451a1a; border-color: #7f1d1d; }
        .toggle-knob { 
            width: 26px; height: 26px; background: #475569; border-radius: 50%;
            position: absolute; top: 2px; left: 2px; 
            transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            box-shadow: 0 4px 6px rgba(0,0,0,0.4); 
        }
        .on .toggle-knob { transform: translateX(34px); background: #10b981; }
        .device-label { 
            background: #134e4a; color: #5eead4; padding: 4px 10px; 
            border-radius: 6px; font-weight: 700; font-size: 0.65rem; 
            display: inline-flex; align-items: center; gap: 5px; 
        }
        .label-text { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .feedsContainer{
            margin-bottom: 32px;
            border:1px solid #134e4a;
            padding: 5px;
            border-radius:10px;
        }
        .deviceDescription{
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:12px;
            padding:0 8px;
        }
    `;
    document.head.appendChild(style);
};

// --- 2. Render Engine ---

// NEW: This only updates the top section
function renderHeader() {
    const target = document.getElementById('header-target');
    if (!target) return;

    const ramPercent = Math.round((lastStats.free / lastStats.total) * 100);
    target.innerHTML = `
    <div class="stats-row">
        <div class="stats-card">
            <div style="position:relative; width:40px; height:40px;">
                <svg viewBox="0 0 36 36" style="transform: rotate(-90deg)">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" stroke-width="3"></circle>
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#38bdf8" stroke-width="3" 
                        stroke-dasharray="${ramPercent}, 100" stroke-linecap="round"></circle>
                </svg>
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:900;">${ramPercent}%</div>
            </div>
            <div>
                <div class="label-text">Memory</div>
                <div style="font-size:14px; font-weight:900;">${Math.round(lastStats.free / 1024)}KB</div>
            </div>
        </div>
        <div class="stats-card">
            <div style="color:#38bdf8"><i data-lucide="clock" class="w-5 h-5"></i></div>
            <div>
                <div class="label-text">Uptime</div>
                <div style="font-size:14px; font-weight:900;">${Math.floor(lastStats.uptime / 60)}m ${lastStats.uptime % 60}s</div>
            </div>
        </div>
    </div>`;
    if (window.lucide) lucide.createIcons();
}

// NEW: This only updates the device cards
function renderDevices() {
    const target = document.getElementById('devices-target');
    if (!target) return;

    const deviceGrids = Object.keys(allDevices).map(mac => {
        const device = allDevices[mac];
        return `
        <div class="feedsContainer">
            <div class="deviceDescription">
                <div class="device-label"><i data-lucide="cpu" class="w-3 h-3"></i> ${device.deviceName || 'Smart Hub'}</div>
                <span style="font-size:10px; font-family:monospace; color:#4b5563;">${mac}</span>
            </div>
            <div class="dashboard-grid">${renderFeeds(mac, device.devFeeds)}</div>
        </div>`;
    }).join('');

    target.innerHTML = deviceGrids || `<div style="text-align:center; padding:40px; color:#4b5563;">No devices found.</div>`;
    if (window.lucide) lucide.createIcons();
}

function renderFeeds(mac, feeds) {
    if (!feeds) return '';
    return Object.keys(feeds).map(id => {
        const f = feeds[id];

        // Gauge Feed
        if (f.type === "Gauge") {
            const val = parseFloat(f.value) || 0;
            const norm = Math.min(Math.max(((val - (f.rangeMin || 0)) / ((f.rangeMax || 50) - (f.rangeMin || 0))), 0), 1);
            return `
            <div class="card-glass">
                <div style="display:flex; width:100%; justify-content:space-between; color:#38bdf8;">
                    <span class="label-text">${id}</span>
                    <i data-lucide="activity" class="w-3 h-3 opacity-30"></i>
                </div>
                <div style="position:relative; width:80px; height:80px; display:flex; align-items:center; justify-content:center;">
                    <svg style="transform: rotate(135deg)" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" stroke-width="4" stroke-dasharray="66 100" stroke-linecap="round"></circle>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="url(#g-${id})" stroke-width="4" stroke-dasharray="${norm * 66} 100" stroke-linecap="round"></circle>
                        <defs><linearGradient id="g-${id}"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>
                    </svg>
                    <span style="position:absolute; font-size:16px; font-weight:900;">${val}</span>
                </div>
                <div class="label-text" style="color:#10b981">Live Data</div>
            </div>`;
        }

        const isUiOn = (f.value == 1);
        return `
        <div class="card-glass">
            <div style="display:flex; width:100%; justify-content:space-between; color:#38bdf8;">
                <span class="label-text">${id}</span>
                <i data-lucide="zap" class="w-3 h-3 opacity-30"></i>
            </div>
            <div class="toggle-box ${isUiOn ? 'on' : 'off'}" onclick="window.handleToggle('${mac}', '${id}', ${!isUiOn})">
                <div class="toggle-knob"></div>
            </div>
            <div class="label-text">${isUiOn ? 'Active' : 'Idle'}</div>
        </div>`;
    }).join('');
}

// --- 3. Controllers ---
async function refreshStats() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        lastStats = data;
    } catch (e) {
        lastStats.uptime += 3;
        lastStats.free = 145000 + Math.random() * 2000;
        lastStats.total = 256000;
    }
    renderHeader(); // ONLY update the header periodically!
}

window.handleToggle = async (mac, feedId, uiState) => {
    isInteracting = true;
    clearTimeout(interactionTimer);

    const newUiValue = uiState ? 1 : 0;
    allDevices[mac].devFeeds[feedId].value = newUiValue;
    localStorage.setItem(CACHE_KEY, JSON.stringify(allDevices));
    renderDevices(); // Update UI immediately

    const feed = allDevices[mac].devFeeds[feedId];
    const hwValue = feed.isSwapped ? (uiState ? 0 : 1) : (uiState ? 1 : 0);

    if (mac === currentLocalMac) {
        fetch(`/api/control?pin=${feed.GPIO}&state=${hwValue}`).catch(() => { });
    }

    if (auth.currentUser && navigator.onLine) {
        update(ref(db), { [`${auth.currentUser.uid}/${mac}/devFeeds/${feedId}/value`]: newUiValue });
    }
    interactionTimer = setTimeout(() => { isInteracting = false; }, 2000);
};

// --- 4. Initialization ---
async function init() {
    // 1. Prepare HTML structure
    const main = document.getElementById('device-container');
    if (main) {
        main.innerHTML = `
            <div id="header-target"></div>
            <div id="devices-target"></div>
        `;
    }

    injectCSS();
    renderHeader();
    renderDevices();

    // Setup Local Hardware Identity
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        console.log("ESP Data--> ", data);
        if (data.mac) {
            currentLocalMac = data.mac;
            localStorage.setItem('hommily_cache_mac', currentLocalMac);
        }
    } catch (e) { console.log("Local API offline"); }

    // Start Polling Header (Stats)
    refreshStats();
    setInterval(refreshStats, 3000);

    // Firebase Sync for Devices
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            console.log("%c[ESP.JS] Auth State Changed:", "color: #6366f1; font-weight: bold;", user);
            if (user) {
                onValue(ref(db, auth.currentUser.uid), (snap) => {
                    if (!isInteracting && snap.val()) {
                        allDevices = snap.val();
                        localStorage.setItem(CACHE_KEY, JSON.stringify(allDevices));
                        renderDevices(); // Only re-render devices when DB changes
                    }
                });
            } else {
                console.warn("%c[ESP.JS] No user logged in. Redirecting to index.html or showing placeholder.", "color: #f59e0b;");
                // Optional: redirect to login if this isn't a standalone test
                // window.location.href = 'index.html';
            }
        });
    } else {
        console.error("%c[ESP.JS] Skip Firebase Sync: Auth not initialized.", "color: #ef4444;");
    }
}

init();