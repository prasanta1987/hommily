import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { db } from './firebase-config.js';
import { listenToAuthState, handleSignIn, handleSignUp, handleSignOut } from './auth.js';

// --- State Management ---
let currentUser = null;
let dbData = null;

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const dataSection = document.getElementById('data-section');
const authInfo = document.getElementById('auth-info');
const userEmailDisplay = document.getElementById('user-email');
const userUidDisplay = document.getElementById('user-uid');
const dashboardContainer = document.getElementById('dashboard-container');
const authError = document.getElementById('auth-error');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {

    // Auth Listener
    listenToAuthState((user) => {
        currentUser = user;
        if (user) {
            loginSection.classList.add('d-none');
            dataSection.classList.remove('d-none');
            authInfo.classList.remove('d-none');
            userEmailDisplay.textContent = user.email;
            userUidDisplay.textContent = user.uid;

            // Subscribe to database data for this user's UID
            const userDbRef = ref(db, user.uid);
            onValue(userDbRef, (snapshot) => {
                dbData = snapshot.val();
                renderDashboard();
            });

        } else {
            loginSection.classList.remove('d-none');
            dataSection.classList.add('d-none');
            authInfo.classList.add('d-none');
            dashboardContainer.innerHTML = '';
        }
    });

    // Event Handlers for Auth
    document.getElementById('btn-signin').onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const res = await handleSignIn(email, password);
        if (!res.success) authError.textContent = res.error;
    };

    document.getElementById('btn-signup').onclick = async () => {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const res = await handleSignUp(email, password);
        if (!res.success) authError.textContent = res.error;
    };

    document.getElementById('btn-logout').onclick = () => handleSignOut();
});

// --- Dashboard Rendering Logic ---

function renderDashboard() {
    if (!dbData) {
        dashboardContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inboxes display-4 text-secondary mb-3"></i>
                <h4 class="text-secondary">No devices detected</h4>
                <p class="text-secondary small">Add devices via your mobile app to see them here.</p>
            </div>`;
        return;
    }

    dashboardContainer.innerHTML = ''; // Clear container

    // Iterate through devices
    Object.keys(dbData).forEach(deviceId => {
        const device = dbData[deviceId];
        if (!device.deviceName || !device.devFeeds) return;

        // Create Device Section
        const deviceSection = document.createElement('section');
        deviceSection.className = 'mb-5';
        deviceSection.innerHTML = `
            <div class="d-flex align-items-center gap-3 mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                <i class="bi bi-hdd-network-fill text-info fs-4"></i>
                <div>
                    <h5 class="mb-0 fw-bold outfit">${device.deviceName}</h5>
                    <span class="badge bg-secondary opacity-75 small jetbrains">${device.deviceType} | ${deviceId}</span>
                </div>
            </div>
            <div class="row g-3" id="device-feeds-${deviceId}"></div>
        `;
        dashboardContainer.appendChild(deviceSection);

        // Iterate through feeds for this device
        const feedsGrid = deviceSection.querySelector(`#device-feeds-${deviceId}`);
        const feeds = device.devFeeds;

        Object.keys(feeds).forEach(feedName => {
            const feed = feeds[feedName];
            const feedCol = document.createElement('div');
            feedCol.className = 'col-6 col-md-4 col-lg-3 col-xl-2';

            if (feed.type === 'Toggle') {
                renderToggleCard(feedCol, deviceId, feedName, feed);
            } else {
                renderValueCard(feedCol, deviceId, feedName, feed);
            }

            feedsGrid.appendChild(feedCol);
        });
    });
}

function renderToggleCard(container, deviceId, name, feed) {
    const isActive = feed.value == 1;
    const icon = name.toLowerCase().includes('light') ? 'bi-lightbulb' :
        name.toLowerCase().includes('fan') ? 'bi-fan' :
            name.toLowerCase().includes('led') ? 'bi-brightness-high' : 'bi-power';

    container.innerHTML = `
        <div class="card feed-card glass h-100 border-0 ${isActive ? 'active' : ''}" 
             onclick="window.toggleFeed('${deviceId}', '${name}', ${feed.value})">
            <div class="card-body p-3 d-flex flex-column align-items-center text-center">
                <div class="feed-icon-box mb-2 ${isActive ? 'bg-info text-dark shadow-info' : 'bg-secondary bg-opacity-25 text-secondary'}">
                    <i class="bi ${icon} ${isActive && name.toLowerCase().includes('fan') ? 'spin' : ''}"></i>
                </div>
                <h6 class="small fw-bold mb-1 outfit text-truncate w-100">${name}</h6>
                <span class="status-label small">${isActive ? 'ON' : 'OFF'}</span>
            </div>
        </div>
    `;
}

function renderValueCard(container, deviceId, name, feed) {
    let value = feed.value;
    const unit = name.toLowerCase().includes('temp') ? '°C' :
        name.toLowerCase().includes('hum') ? '%' : '';

    // Formatting if it's a number string
    if (!isNaN(parseFloat(value))) {
        value = parseFloat(value).toFixed(1);
    }

    container.innerHTML = `
        <div class="card feed-card glass h-100 border-0">
            <div class="card-body p-3 d-flex flex-column align-items-center text-center">
                <div class="feed-icon-box bg-secondary bg-opacity-10 text-info mb-2">
                    <i class="bi bi-activity"></i>
                </div>
                <h6 class="small fw-bold mb-1 outfit text-truncate w-100">${name}</h6>
                <div class="h4 mb-0 jetbrains text-info">${value}<span class="small opacity-50">${unit}</span></div>
            </div>
        </div>
    `;
}

// --- Global Interaction Helpers ---

window.toggleFeed = (deviceId, feedName, currentValue) => {
    if (!currentUser) return;
    const newValue = currentValue == 1 ? 0 : 1;
    const path = `${currentUser.uid}/${deviceId}/devFeeds/${feedName}`;
    const dbRef = ref(db, path);
    update(dbRef, { value: newValue }).catch(err => console.error("Update error:", err));
};
