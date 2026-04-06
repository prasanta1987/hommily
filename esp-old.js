

// OLD

/**
 * Hommily Master Dashboard v3.2
 * Features: Circular Gauges for Sensors, Hardware-Swapping, Multi-Device
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
let allDevices = {};
let currentLocalMac = localStorage.getItem('hommily_cache_mac') || "";
let isUpdating = false;
let statsInterval = null;

// --- 1. Bootstrap ---
function bootstrap() {
    const cachedDevices = localStorage.getItem('hommily_cache_all_devices');
    if (cachedDevices) {
        allDevices = JSON.parse(cachedDevices);
        render();
    }
    startApp();
}

async function startApp() {
    await identifyLocalHardware();
    startStatsPolling();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            setupGlobalListener();
        } else if (!Object.keys(allDevices).length) {
            showLoginModal();
        }
    });
}

// --- 2. Hardware & Stats ---
async function identifyLocalHardware() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.mac) {
            currentLocalMac = data.mac;
            localStorage.setItem('hommily_cache_mac', currentLocalMac);
        }
    } catch (e) {
        console.log("Using cached/mock identity.");
    }
}

async function refreshStats() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        updateStatsUI(data.free, data.total, data.uptime);
    } catch (e) {
        // Mock fallback for testing
        updateStatsUI(145000, 256000, Math.floor(Date.now() / 1000) % 3600);
    }
}

function updateStatsUI(free, total, uptime) {
    const percent = Math.round((free / total) * 100);
    const gauge = document.getElementById('ram-gauge');
    if (gauge) gauge.style.strokeDasharray = `${percent}, 100`;

    if (document.getElementById('ram-percent')) document.getElementById('ram-percent').innerText = `${percent}%`;
    if (document.getElementById('ram-free')) document.getElementById('ram-free').innerText = `${Math.round(free / 1024)}KB`;
    if (document.getElementById('uptime')) {
        const m = Math.floor(uptime / 60);
        const s = uptime % 60;
        document.getElementById('uptime').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    }
}

function startStatsPolling() {
    if (statsInterval) clearInterval(statsInterval);
    refreshStats();
    statsInterval = setInterval(refreshStats, 3000);
}

// --- 3. Firebase Sync ---
function setupGlobalListener() {
    if (!auth.currentUser) return;
    onValue(ref(db, auth.currentUser.uid), (snapshot) => {
        if (isUpdating) return;
        const data = snapshot.val();
        if (data) {
            allDevices = data;
            localStorage.setItem('hommily_cache_all_devices', JSON.stringify(data));
            render();
        }
    });
}


// --- 4. UI Rendering Engine ---
function render() {
    const container = document.getElementById('device-container');
    if (!container) return;

    container.innerHTML = Object.keys(allDevices).map(mac => {
        const device = allDevices[mac];
        if (!device || !device.devFeeds) return '';

        return `
        <div class="device-card bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 mb-8 backdrop-blur-xl">
            <div class="flex justify-between items-center mb-8 px-2">
                <div>
                    <h2 class="text-2xl font-black text-white flex items-center gap-3">
                        ${device.deviceName || 'Smart Device'}
                        ${mac === currentLocalMac ? '<span class="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>' : ''}
                    </h2>
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">${mac}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${renderFeeds(mac, device.devFeeds)}
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function renderFeeds(mac, feeds) {
    return Object.keys(feeds).map(id => {
        const f = feeds[id];

        if (f.type === "Gauge") {
            const val = parseFloat(f.value) || 0;
            const min = f.rangeMin ?? 0;
            const max = f.rangeMax ?? 100;

            // 1. Calculate percentage (0 to 1)
            const ratio = Math.min(Math.max(((val - min) / (max - min)), 0), 1);

            // 2. SVG Math for a 3/4 circle (Radius 16)
            // Circumference C = 2 * PI * 16 ≈ 100.5
            // We want the gauge to be 75 units long with a 25 unit gap at the bottom
            const totalDash = 100;
            const gaugeLength = 75; // 75% of the circle
            const activeFill = ratio * gaugeLength;

            return `
            <div class="glass p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center transition-all hover:bg-white/[0.04]">
                <div class="relative w-36 h-36">
                    <svg class="w-full h-full rotate-[135deg]" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" 
                            class="stroke-slate-800/50" stroke-width="3" 
                            stroke-dasharray="${gaugeLength} ${totalDash}" 
                            stroke-linecap="round"></circle>
                        
                        <circle cx="18" cy="18" r="16" fill="none" 
                            class="stroke-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                            stroke-width="3" 
                            stroke-dasharray="${activeFill} ${totalDash}" 
                            stroke-linecap="round"></circle>
                    </svg>
                    
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-3xl font-black text-white tracking-tight">${val}</span>
                        <span class="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">${id}</span>
                    </div>
                </div>

                <div class="w-full flex justify-between px-4 mt-[-10px] text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                    <span>${min}</span>
                    <span>${max}</span>
                </div>
            </div>`;
        }

        // --- TOGGLE UI (Kept same for consistency) ---
        const isUiOn = (f.value == 1);
        return `
        <div class="glass p-5 rounded-3xl bg-white/[0.03] flex items-center justify-between border border-white/5">
            <div>
                <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Control</span>
                <span class="text-sm font-bold text-white block">${id}</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${isUiOn ? 'checked' : ''} onchange="window.handleToggle('${mac}', '${id}', this.checked)" class="sr-only peer">
                <div class="w-14 h-8 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 transition-all">
                    <div class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-all transform ${isUiOn ? 'translate-x-6' : ''}"></div>
                </div>
            </label>
        </div>`;
    }).join('');
}



// --- 5. Toggle Logic (Hardware Swap) ---
window.handleToggle = async (mac, feedId, uiState) => {
    isUpdating = true;
    const device = allDevices[mac];
    const feed = device.devFeeds[feedId];
    const newUiValue = uiState ? 1 : 0;
    const hwValue = feed.isSwapped ? (uiState ? 0 : 1) : (uiState ? 1 : 0);

    feed.value = newUiValue;
    render();

    try {
        if (mac === currentLocalMac) {
            fetch(`/api/control?pin=${feed.GPIO}&state=${hwValue}`).catch(() => { });
        }
        if (navigator.onLine && auth.currentUser) {
            await update(ref(db), { [`${auth.currentUser.uid}/${mac}/devFeeds/${feedId}/value`]: newUiValue });
        }
        localStorage.setItem('hommily_cache_all_devices', JSON.stringify(allDevices));
    } catch (e) {
        console.error("Sync error", e);
    } finally {
        setTimeout(() => { isUpdating = false; }, 500);
    }
};

// --- Helpers ---
async function showLoginModal() {
    const { value: v } = await Swal.fire({
        title: 'Hommily Login',
        html: '<input id="sw-e" class="swal2-input" placeholder="Email"><input id="sw-p" class="swal2-input" type="password" placeholder="Password">',
        background: '#0f172a', color: '#f8fafc',
        preConfirm: () => [document.getElementById('sw-e').value, document.getElementById('sw-p').value]
    });
    if (v) await signInWithEmailAndPassword(auth, v[0], v[1]).catch(() => showLoginModal());
}

bootstrap();
