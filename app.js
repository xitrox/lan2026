// LAN Party 2026 - Frontend Application
// Enemy Territory inspired LAN party management app

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    user: null,
    token: null,
    eventData: null,
    cabins: [],
    games: [],
    messages: [],
    isAdmin: false
};

// ============================================
// API CLIENT
// ============================================
const API = {
    baseUrl: '',

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (AppState.token) {
            headers['Authorization'] = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(username, password) {
        return this.request('/api/auth?action=login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async register(username, email, password, registrationPassword) {
        return this.request('/api/auth?action=register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, registrationPassword })
        });
    },

    async verifyToken() {
        return this.request('/api/auth?action=verify');
    },

    async updateProfile(email, currentPassword, newPassword, isAttending) {
        return this.request('/api/auth?action=update-profile', {
            method: 'POST',
            body: JSON.stringify({ email, currentPassword, newPassword, isAttending })
        });
    },

    // Event endpoints
    async getEventData() {
        return this.request('/api/event?action=get');
    },

    async updateEventData(data) {
        return this.request('/api/event?action=update', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Cabins endpoints
    async getCabins() {
        return this.request('/api/cabins?action=list');
    },

    async voteCabin(cabinId, vote) {
        return this.request('/api/cabins?action=vote', {
            method: 'POST',
            body: JSON.stringify({ cabinId, vote })
        });
    },

    async addCabin(cabin) {
        return this.request('/api/cabins?action=add', {
            method: 'POST',
            body: JSON.stringify(cabin)
        });
    },

    async deleteCabin(cabinId) {
        return this.request('/api/cabins?action=delete', {
            method: 'DELETE',
            body: JSON.stringify({ cabinId })
        });
    },

    // Games endpoints
    async getGames() {
        return this.request('/api/games?action=list');
    },

    async addGame(name) {
        return this.request('/api/games?action=add', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    },

    async voteGame(gameId, vote) {
        return this.request('/api/games?action=vote', {
            method: 'POST',
            body: JSON.stringify({ gameId, vote })
        });
    },

    async deleteGame(gameId) {
        return this.request('/api/games?action=delete', {
            method: 'DELETE',
            body: JSON.stringify({ gameId })
        });
    },

    // Messages endpoints
    async getMessages() {
        return this.request('/api/messages?action=list');
    },

    async postMessage(content) {
        return this.request('/api/messages?action=post', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    async editMessage(messageId, content) {
        return this.request('/api/messages?action=edit', {
            method: 'PUT',
            body: JSON.stringify({ messageId, content })
        });
    },

    async deleteMessage(messageId) {
        return this.request('/api/messages?action=delete', {
            method: 'DELETE',
            body: JSON.stringify({ messageId })
        });
    },

    // Admin endpoints
    async getUsers() {
        return this.request('/api/admin?action=users');
    },

    async deleteUser(userId) {
        return this.request('/api/admin?action=delete-user', {
            method: 'DELETE',
            body: JSON.stringify({ userId })
        });
    },

    async toggleAdmin(userId, isAdmin) {
        return this.request('/api/admin?action=toggle-admin', {
            method: 'POST',
            body: JSON.stringify({ userId, isAdmin })
        });
    },

    async resetPassword(userId, newPassword) {
        return this.request('/api/admin?action=reset-password', {
            method: 'POST',
            body: JSON.stringify({ userId, newPassword })
        });
    }
};

// ============================================
// ET COLOR CODE PARSER
// ============================================
const ETColorParser = {
    colors: {
        '0': '#000000', // Black
        '1': '#FF0000', // Red
        '2': '#00FF00', // Green
        '3': '#FFFF00', // Yellow
        '4': '#0000FF', // Blue
        '5': '#00FFFF', // Cyan
        '6': '#FF00FF', // Magenta
        '7': '#FFFFFF'  // White
    },

    parse(text) {
        const parts = [];
        let currentColor = '7'; // Default white
        let currentText = '';
        let i = 0;

        while (i < text.length) {
            if (text[i] === '^' && i + 1 < text.length && this.colors[text[i + 1]]) {
                if (currentText) {
                    parts.push({ color: currentColor, text: currentText });
                    currentText = '';
                }
                currentColor = text[i + 1];
                i += 2;
            } else {
                currentText += text[i];
                i++;
            }
        }

        if (currentText) {
            parts.push({ color: currentColor, text: currentText });
        }

        return parts;
    },

    toHTML(text) {
        const parts = this.parse(text);
        return parts.map(part =>
            `<span style="color: ${this.colors[part.color]}">${this.escapeHTML(part.text)}</span>`
        ).join('');
    },

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// AUTHENTICATION
// ============================================
function saveToken(token) {
    localStorage.setItem('lan2026_token', token);
    AppState.token = token;
}

function loadToken() {
    const token = localStorage.getItem('lan2026_token');
    if (token) {
        AppState.token = token;
        return true;
    }
    return false;
}

function clearToken() {
    localStorage.removeItem('lan2026_token');
    AppState.token = null;
    AppState.user = null;
}

async function checkAuth() {
    if (!loadToken()) {
        showAuthScreen();
        return false;
    }

    // Show loading indicator while verifying token
    showAuthLoading();

    try {
        const response = await API.verifyToken();
        AppState.user = response.user;
        AppState.isAdmin = response.user.isAdmin;
        hideAuthLoading();
        showAppScreen();
        return true;
    } catch (error) {
        console.error('Auth verification failed:', error);
        clearToken();
        hideAuthLoading();
        showAuthScreen();
        return false;
    }
}

function showAuthLoading() {
    document.getElementById('auth-loading').style.display = 'flex';
    document.getElementById('auth-container').style.display = 'none';
}

function hideAuthLoading() {
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

function showAppScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';

    // Update UI
    document.getElementById('user-display').textContent = AppState.user.username;

    // Update mobile user avatar
    const avatarInitial = document.getElementById('user-avatar-initial');
    if (avatarInitial && AppState.user.username) {
        avatarInitial.textContent = AppState.user.username.charAt(0).toUpperCase();
    }

    // Show add cabin button for all authenticated users
    const addCabinBtn = document.getElementById('add-cabin-btn');
    if (addCabinBtn) {
        addCabinBtn.style.display = 'inline-block';
    }

    // Show admin options if admin
    if (AppState.isAdmin) {
        // Show admin in mobile menu
        const mobileAdminNav = document.getElementById('mobile-admin-nav');
        if (mobileAdminNav) {
            mobileAdminNav.style.display = 'block';
        }
    }

    // Load initial data
    loadEventData();
    loadCabins();
    loadGames();
    loadMessages();
}

// ============================================
// AUTH FORM HANDLERS
// ============================================
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-error').style.display = 'none';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-error').style.display = 'none';
});

document.getElementById('login-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await API.login(username, password);
        saveToken(response.token);
        AppState.user = response.user;
        AppState.isAdmin = response.user.isAdmin;
        showAppScreen();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
});

document.getElementById('register-form-element').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const registrationPassword = document.getElementById('reg-registration-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        const response = await API.register(username, email, password, registrationPassword);
        saveToken(response.token);
        AppState.user = response.user;
        AppState.isAdmin = response.user.isAdmin;
        showAppScreen();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
});

// ============================================
// PAGE NAVIGATION (Replaces old tab system)
// ============================================

// These will be initialized after DOM loads
let appScreen, cabinsScreen, gamesScreen, profileScreen, adminScreen, settingsScreen, allScreens;

// Navigate to a specific page
function navigateTo(pageName) {
    // Hide all screens
    if (allScreens) {
        allScreens.forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
    }

    // Show requested screen
    let targetScreen = null;
    switch(pageName) {
        case 'home':
            targetScreen = appScreen;
            break;
        case 'cabins':
            targetScreen = cabinsScreen;
            loadCabins(); // Reload data
            break;
        case 'games':
            targetScreen = gamesScreen;
            loadGames(); // Reload data
            break;
        case 'profile':
            targetScreen = profileScreen;
            loadProfileForm(); // Load current profile
            break;
        case 'admin':
            targetScreen = adminScreen;
            loadAdminUsers();
            loadAdminEventForm();
            break;
        case 'settings':
            // Settings uses old showSettings() function
            showSettings();
            return;
        default:
            targetScreen = appScreen; // Default to home
    }

    if (targetScreen) {
        targetScreen.style.display = 'block';
    }

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
}

// ============================================
// EVENT DATA
// ============================================
async function loadEventData() {
    try {
        const response = await API.getEventData();
        AppState.eventData = response.event;
        updateEventDisplay();
    } catch (error) {
        console.error('Failed to load event data:', error);
    }
}

function updateEventDisplay() {
    const event = AppState.eventData;

    // Update title (check if elements exist)
    const authTitle = document.getElementById('auth-event-title');
    const appTitle = document.getElementById('app-event-title');

    if (authTitle) authTitle.textContent = event.title || 'LAN PARTY 2026';
    if (appTitle) appTitle.textContent = event.title || 'LAN PARTY 2026';
    document.title = (event.title || 'LAN Party 2026') + ' - Management';

    // Update date - DATE ONLY (no time)
    if (event.eventDate) {
        const startDate = new Date(event.eventDate);
        const dateStr = startDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        let dateText = dateStr;

        // Add end date if available AND different from start date
        if (event.eventDateEnd) {
            const endDate = new Date(event.eventDateEnd);

            // Check if end date is on a different day
            const isSameDay = startDate.toDateString() === endDate.toDateString();

            if (!isSameDay) {
                // Different day: show end date
                const endDateStr = endDate.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                dateText += ` - ${endDateStr}`;
            }
        }

        document.getElementById('event-date-hero').textContent = dateText;
        updateCountdown(startDate);
    } else {
        document.getElementById('event-date-hero').textContent = 'Termin wird noch bekannt gegeben';
    }

    // Update location
    document.getElementById('event-location').textContent = event.location || 'TBD';

    // Update participants
    document.getElementById('event-participants').textContent =
        `${event.registeredParticipants}/${event.maxParticipants}`;

    // Load and display participant names
    loadParticipantsList();
}

function updateCountdown(targetDate) {
    const now = new Date();
    const diff = targetDate - now;

    const daysElement = document.getElementById('countdown-days');
    const simpleLabelElement = document.querySelector('.countdown-label-simple');

    if (diff < 0) {
        // Event has started
        if (daysElement) {
            daysElement.textContent = '0';
        }
        if (simpleLabelElement) {
            simpleLabelElement.textContent = 'EVENT LÄUFT! 🎉';
        }
        return;
    }

    // Calculate total days as decimal
    const totalDays = diff / (1000 * 60 * 60 * 24);

    // Update countdown display
    if (daysElement && simpleLabelElement) {
        if (totalDays >= 10) {
            // Show in weeks with 2 decimal places
            const weeks = totalDays / 7;
            daysElement.textContent = weeks.toFixed(6);
            simpleLabelElement.textContent = 'Wochen bis zur LAN';
        } else {
            // Show in days with 3 decimal places (more precision for last days)
            daysElement.textContent = totalDays.toFixed(3);
            simpleLabelElement.textContent = 'Tage bis zum LAN';
        }
    }

    // Update every second for visible movement
    setTimeout(() => updateCountdown(targetDate), 1000);
}

// ============================================
// PARTICIPANTS LIST
// ============================================
async function loadParticipantsList() {
    try {
        const response = await API.getUsers();
        const allUsers = response.users;

        // Filter to show only users who are attending
        const attendingUsers = allUsers.filter(user => user.is_attending);

        const listContainer = document.getElementById('participants-list');

        // Check if current user is attending
        const currentUserAttending = AppState.user?.isAttending;

        // Show prompt if user is not attending
        if (!currentUserAttending) {
            const promptHTML = `
                <div class="attendance-prompt">
                    <p class="attendance-prompt-text">Du hast deine Teilnahme noch nicht bestätigt.</p>
                    <button id="attendance-prompt-btn" class="attendance-prompt-btn">Jetzt anmelden</button>
                </div>
            `;
            listContainer.innerHTML = promptHTML + (attendingUsers.length === 0
                ? '<div class="participant-item">Noch keine Teilnehmer</div>'
                : attendingUsers.map(user => `
                    <div class="participant-item">
                        <span class="participant-avatar">${user.username.charAt(0).toUpperCase()}</span>
                        <span class="participant-name">${user.username}</span>
                        ${user.is_admin ? '<span class="participant-badge">👑</span>' : ''}
                    </div>
                `).join(''));

            // Add click handler to navigate to profile
            document.getElementById('attendance-prompt-btn').addEventListener('click', () => {
                navigateTo('profile');
            });
        } else {
            if (attendingUsers.length === 0) {
                listContainer.innerHTML = '<div class="participant-item">Noch keine Teilnehmer</div>';
                return;
            }

            listContainer.innerHTML = attendingUsers.map(user => `
                <div class="participant-item">
                    <span class="participant-avatar">${user.username.charAt(0).toUpperCase()}</span>
                    <span class="participant-name">${user.username}</span>
                    ${user.is_admin ? '<span class="participant-badge">👑</span>' : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load participants:', error);
        // Silent fail - participants list is not critical
    }
}

// ============================================
// CABINS
// ============================================
async function loadCabins() {
    try {
        const response = await API.getCabins();
        AppState.cabins = response.cabins;
        renderCabins();
        updateHomeCabins();
    } catch (error) {
        console.error('Failed to load cabins:', error);
        document.getElementById('cabins-grid').innerHTML = '<p class="error">Fehler beim Laden der Unterkünfte</p>';
    }
}

function updateHomeCabins() {
    const allCabins = AppState.cabins;
    const list = document.getElementById('home-cabins-list');

    if (!list) return; // Element doesn't exist (not admin)

    if (allCabins.length === 0) {
        list.innerHTML = '<div class="top-game-item">Noch keine Unterkünfte</div>';
        return;
    }

    list.innerHTML = allCabins.map((cabin, index) => `
        <div class="top-game-item">
            <span class="top-game-rank">#${index + 1}</span>
            <span class="top-game-name">${cabin.name}</span>
            <button class="top-game-like-btn ${cabin.user_voted ? 'liked' : ''}" data-cabin-id="${cabin.id}" title="${cabin.user_voted ? 'Vote entfernen' : 'Unterkunft voten'}">
                ${cabin.user_voted ? '♥' : '♡'} ${cabin.vote_count}
            </button>
        </div>
    `).join('');

    // Add event listeners for cabin vote buttons
    list.querySelectorAll('.top-game-like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cabinId = parseInt(btn.dataset.cabinId);
            const cabin = AppState.cabins.find(c => c.id === cabinId);

            try {
                // Toggle the vote state
                await API.voteCabin(cabinId, !cabin.user_voted);
                // Reload cabins to get updated state
                await loadCabins();
            } catch (error) {
                alert('Fehler beim Voten: ' + error.message);
            }
        });
    });
}

function renderCabins() {
    const grid = document.getElementById('cabins-grid');

    if (AppState.cabins.length === 0) {
        grid.innerHTML = '<p class="empty-state">Noch keine Unterkünfte hinzugefügt</p>';
        return;
    }

    grid.innerHTML = AppState.cabins.map(cabin => `
        <div class="cabin-card" data-cabin-id="${cabin.id}">
            <div class="cabin-card-header">
                <h3 class="cabin-name">${cabin.name}</h3>
                <span class="cabin-expand-icon">▼</span>
            </div>
            <div class="cabin-card-details" style="display: none;">
                ${cabin.image_url ? `<img src="${cabin.image_url}" alt="${cabin.name}" class="cabin-image">` : '<div class="cabin-no-image">Kein Bild verfügbar</div>'}
                ${cabin.description ? `<p class="cabin-description">${cabin.description}</p>` : '<p class="cabin-description-empty">Keine Beschreibung verfügbar</p>'}
                ${cabin.url ? `<a href="${cabin.url}" target="_blank" class="cabin-link" onclick="event.stopPropagation()">Link öffnen →</a>` : ''}
                <div class="cabin-votes">
                    <button class="vote-btn ${cabin.user_voted ? 'voted' : ''}" data-cabin-id="${cabin.id}">
                        ${cabin.user_voted ? '✓' : '♡'} ${cabin.vote_count} Stimme(n)
                    </button>
                    ${AppState.isAdmin ? `<button class="delete-btn" data-cabin-id="${cabin.id}" data-type="cabin">🗑️</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add expand/collapse event listeners
    grid.querySelectorAll('.cabin-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.parentElement;
            const details = card.querySelector('.cabin-card-details');
            const icon = card.querySelector('.cabin-expand-icon');

            if (details.style.display === 'none') {
                details.style.display = 'block';
                icon.textContent = '▲';
                card.classList.add('expanded');
            } else {
                details.style.display = 'none';
                icon.textContent = '▼';
                card.classList.remove('expanded');
            }
        });
    });

    // Add vote event listeners
    grid.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cabinId = parseInt(btn.dataset.cabinId);
            const cabin = AppState.cabins.find(c => c.id === cabinId);
            try {
                await API.voteCabin(cabinId, !cabin.user_voted);
                await loadCabins(); // Reload
            } catch (error) {
                alert('Fehler beim Voten: ' + error.message);
            }
        });
    });

    // Add delete event listeners (admin only)
    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Unterkunft wirklich löschen?')) return;
            const cabinId = parseInt(btn.dataset.cabinId);
            try {
                await API.deleteCabin(cabinId);
                await loadCabins();
            } catch (error) {
                alert('Fehler beim Löschen: ' + error.message);
            }
        });
    });
}

// ============================================
// GAMES
// ============================================
async function loadGames() {
    try {
        const response = await API.getGames();
        AppState.games = response.games;
        renderGames();
        updateTopGames();
    } catch (error) {
        console.error('Failed to load games:', error);
        document.getElementById('games-list').innerHTML = '<p class="error">Fehler beim Laden der Spiele</p>';
    }
}

function renderGames() {
    const list = document.getElementById('games-list');

    if (AppState.games.length === 0) {
        list.innerHTML = '<p class="empty-state">Noch keine Spiele hinzugefügt</p>';
        return;
    }

    list.innerHTML = AppState.games.map(game => `
        <div class="game-item">
            <div class="game-info">
                <span class="game-name">${game.name}</span>
                <span class="game-meta">vorgeschlagen von ${game.created_by_username || 'Unbekannt'}</span>
            </div>
            <div class="game-actions">
                <button class="vote-btn ${game.user_voted ? 'voted' : ''}" data-game-id="${game.id}">
                    ${game.user_voted ? '✓' : '♡'} ${game.vote_count}
                </button>
                ${AppState.isAdmin ? `<button class="delete-btn" data-game-id="${game.id}" data-type="game">🗑️</button>` : ''}
            </div>
        </div>
    `).join('');

    // Add vote event listeners
    list.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const gameId = parseInt(btn.dataset.gameId);
            const game = AppState.games.find(g => g.id === gameId);
            try {
                await API.voteGame(gameId, !game.user_voted);
                await loadGames();
            } catch (error) {
                alert('Fehler beim Voten: ' + error.message);
            }
        });
    });

    // Add delete event listeners (admin only)
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Spiel wirklich löschen?')) return;
            const gameId = parseInt(btn.dataset.gameId);
            try {
                await API.deleteGame(gameId);
                await loadGames();
            } catch (error) {
                alert('Fehler beim Löschen: ' + error.message);
            }
        });
    });
}

function updateTopGames() {
    const allGames = AppState.games;
    const list = document.getElementById('top-games-list');

    if (allGames.length === 0) {
        list.innerHTML = '<div class="top-game-item">Noch keine Spiele</div>';
        return;
    }

    list.innerHTML = allGames.map((game, index) => `
        <div class="top-game-item">
            <span class="top-game-rank">#${index + 1}</span>
            <span class="top-game-name">${game.name}</span>
            <button class="top-game-like-btn ${game.user_voted ? 'liked' : ''}" data-game-id="${game.id}" title="${game.user_voted ? 'Like entfernen' : 'Spiel liken'}">
                ${game.user_voted ? '♥' : '♡'} ${game.vote_count}
            </button>
        </div>
    `).join('');

    // Add event listeners for like buttons
    list.querySelectorAll('.top-game-like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const gameId = parseInt(btn.dataset.gameId);
            const game = AppState.games.find(g => g.id === gameId);

            try {
                // Toggle the like state
                await API.voteGame(gameId, !game.user_voted);
                // Reload games to get updated state
                await loadGames();
            } catch (error) {
                alert('Fehler beim Liken: ' + error.message);
            }
        });
    });
}

// ============================================
// MESSAGES / CHAT
// ============================================
async function loadMessages() {
    try {
        const response = await API.getMessages();
        AppState.messages = response.messages;
        renderMessages();
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

function renderMessages() {
    const container = document.getElementById('chat-messages');

    if (AppState.messages.length === 0) {
        container.innerHTML = '<p class="empty-state">Noch keine Nachrichten</p>';
        return;
    }

    container.innerHTML = AppState.messages.map(msg => {
        const isOwn = msg.user_id === AppState.user.id;
        const canModerate = isOwn || AppState.isAdmin;

        return `
            <div class="chat-message ${isOwn ? 'own-message' : ''}" data-message-id="${msg.id}">
                <div class="message-header">
                    <span class="message-author ${msg.is_admin ? 'admin-badge' : ''}">${msg.username}</span>
                    ${canModerate ? `
                        <div class="message-actions">
                            ${isOwn ? `<button class="message-edit-btn" data-message-id="${msg.id}">✏️</button>` : ''}
                            <button class="message-delete-btn" data-message-id="${msg.id}">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                <div class="message-content">${ETColorParser.toHTML(msg.content)}</div>
            </div>
        `;
    }).join('');

    // Add event listeners
    container.querySelectorAll('.message-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const msgId = parseInt(btn.dataset.messageId);
            editMessage(msgId);
        });
    });

    container.querySelectorAll('.message-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const msgId = parseInt(btn.dataset.messageId);
            if (!confirm('Nachricht wirklich löschen?')) return;
            try {
                await API.deleteMessage(msgId);
                await loadMessages();
            } catch (error) {
                alert('Fehler beim Löschen: ' + error.message);
            }
        });
    });

    scrollChatToBottom();
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function editMessage(messageId) {
    const message = AppState.messages.find(m => m.id === messageId);
    if (!message) return;

    const newContent = prompt('Nachricht bearbeiten:', message.content);
    if (!newContent || newContent === message.content) return;

    API.editMessage(messageId, newContent)
        .then(() => loadMessages())
        .catch(error => alert('Fehler beim Bearbeiten: ' + error.message));
}

document.getElementById('chat-send-btn').addEventListener('click', async () => {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();

    if (!content) return;

    try {
        await API.postMessage(content);
        input.value = '';
        await loadMessages();
    } catch (error) {
        alert('Fehler beim Senden: ' + error.message);
    }
});

document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('chat-send-btn').click();
    }
});

// Auto-refresh messages every 10 seconds (chat is always visible now)
setInterval(() => {
    if (AppState.user) {
        loadMessages();
    }
}, 10000);

// ============================================
// PROFILE
// ============================================
function loadProfileForm() {
    document.getElementById('profile-username').value = AppState.user.username;
    document.getElementById('profile-email').value = AppState.user.email;
    document.getElementById('profile-is-attending').checked = Boolean(AppState.user.isAttending);
    document.getElementById('profile-current-password').value = '';
    document.getElementById('profile-new-password').value = '';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('profile-email').value;
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const isAttending = document.getElementById('profile-is-attending').checked;
    const messageDiv = document.getElementById('profile-message');

    // Check if changing password
    if (newPassword && !currentPassword) {
        messageDiv.textContent = 'Bitte aktuelles Passwort eingeben';
        messageDiv.className = 'form-response error';
        messageDiv.style.display = 'block';
        return;
    }

    try {
        const response = await API.updateProfile(
            email,
            currentPassword || undefined,
            newPassword || undefined,
            isAttending
        );

        messageDiv.textContent = 'Profil erfolgreich aktualisiert';
        messageDiv.className = 'form-response success';
        messageDiv.style.display = 'block';

        // Clear password fields
        document.getElementById('profile-current-password').value = '';
        document.getElementById('profile-new-password').value = '';

        // Update user data in state
        AppState.user.email = email;
        AppState.user.isAttending = response.user.isAttending;

        // Reload event data and participants list to update counts
        await loadEventData();
        await loadParticipantsList();

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = 'form-response error';
        messageDiv.style.display = 'block';
    }
});

// ============================================
// ADMIN
// ============================================
function loadAdminEventForm() {
    if (!AppState.isAdmin || !AppState.eventData) return;

    const event = AppState.eventData;

    document.getElementById('admin-event-title').value = event.title || '';
    document.getElementById('admin-event-location').value = event.location || '';
    document.getElementById('admin-event-password').value = ''; // Don't show password

    // Format date for datetime-local input (helper function)
    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + 'T' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
    };

    document.getElementById('admin-event-date').value = formatDateTimeLocal(event.eventDate);
    document.getElementById('admin-event-date-end').value = formatDateTimeLocal(event.eventDateEnd);
}

async function loadAdminUsers() {
    if (!AppState.isAdmin) return;

    try {
        const response = await API.getUsers();
        renderAdminUsers(response.users);
    } catch (error) {
        console.error('Failed to load users:', error);
        document.getElementById('admin-users-list').innerHTML = '<p class="error">Fehler beim Laden der Benutzer</p>';
    }
}

function renderAdminUsers(users) {
    const list = document.getElementById('admin-users-list');

    list.innerHTML = `
        <table class="admin-users-table">
            <thead>
                <tr>
                    <th>Benutzername</th>
                    <th>E-Mail</th>
                    <th>Admin</th>
                    <th>Registriert</th>
                    <th>Aktionen</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.is_admin ? '✓' : '-'}</td>
                        <td>${new Date(user.created_at).toLocaleDateString('de-DE')}</td>
                        <td>
                            <button class="admin-action-btn" onclick="adminToggleAdmin(${user.id}, ${!user.is_admin})">
                                ${user.is_admin ? 'Admin entfernen' : 'Zu Admin machen'}
                            </button>
                            <button class="admin-action-btn" onclick="adminResetPassword(${user.id})">
                                Passwort zurücksetzen
                            </button>
                            <button class="admin-action-btn danger" onclick="adminDeleteUser(${user.id})">
                                Löschen
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function adminToggleAdmin(userId, makeAdmin) {
    try {
        await API.toggleAdmin(userId, makeAdmin);
        await loadAdminUsers();
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
}

async function adminResetPassword(userId) {
    const newPassword = prompt('Neues Passwort eingeben:');
    if (!newPassword) return;

    try {
        await API.resetPassword(userId, newPassword);
        alert('Passwort erfolgreich zurückgesetzt');
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
}

async function adminDeleteUser(userId) {
    if (!confirm('Benutzer wirklich löschen?')) return;

    try {
        await API.deleteUser(userId);
        await loadAdminUsers();
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
}

// Load event data form (admin)
document.getElementById('admin-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('admin-event-title').value;
    const dateValue = document.getElementById('admin-event-date').value;
    const dateEndValue = document.getElementById('admin-event-date-end').value;
    const location = document.getElementById('admin-event-location').value;
    const password = document.getElementById('admin-event-password').value;

    try {
        await API.updateEventData({
            title,
            eventDate: dateValue ? new Date(dateValue).toISOString() : null,
            eventDateEnd: dateEndValue ? new Date(dateEndValue).toISOString() : null,
            location,
            registrationPassword: password || undefined
        });

        alert('Event-Daten erfolgreich aktualisiert');
        await loadEventData();
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
});

// ============================================
// MODALS
// ============================================
document.getElementById('help-btn').addEventListener('click', () => {
    document.getElementById('help-modal').style.display = 'flex';
});

document.getElementById('add-cabin-btn').addEventListener('click', () => {
    document.getElementById('add-cabin-modal').style.display = 'flex';
});

// Add game button (from games page)
document.getElementById('add-game-btn').addEventListener('click', () => {
    document.getElementById('add-game-modal').style.display = 'flex';
});

// Add game button (from home page)
const homeAddGameBtn = document.getElementById('home-add-game-btn');
if (homeAddGameBtn) {
    homeAddGameBtn.addEventListener('click', () => {
        document.getElementById('add-game-modal').style.display = 'flex';
    });
}

// Add cabin button (from home page)
const homeAddCabinBtn = document.getElementById('home-add-cabin-btn');
if (homeAddCabinBtn) {
    homeAddCabinBtn.addEventListener('click', () => {
        document.getElementById('add-cabin-modal').style.display = 'flex';
    });
}

// Close modals
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
    });
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Add cabin form
document.getElementById('add-cabin-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cabin = {
        name: document.getElementById('cabin-name').value,
        url: document.getElementById('cabin-url').value,
        imageUrl: document.getElementById('cabin-image').value,
        description: document.getElementById('cabin-description').value
    };

    try {
        await API.addCabin(cabin);
        document.getElementById('add-cabin-modal').style.display = 'none';
        e.target.reset();
        await loadCabins();
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
});

// Add game form
document.getElementById('add-game-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('game-name').value;

    try {
        await API.addGame(name);
        document.getElementById('add-game-modal').style.display = 'none';
        e.target.reset();
        await loadGames();
    } catch (error) {
        alert('Fehler: ' + error.message);
    }
});

// ============================================
// VOICE MENU (Easter Egg - Press V)
// ============================================
const VoiceMenu = {
    isOpen: false,
    currentCategory: null,

    // ET Voice Commands Structure
    commands: {
        statements: [
            { key: '1', text: 'I am a soldier!', sound: 'soldier.wav' },
            { key: '2', text: 'I am an engineer!', sound: 'engineer.wav' },
            { key: '3', text: 'I am a medic!', sound: 'medic.wav' },
            { key: '4', text: 'I am a field ops!', sound: 'fieldops.wav' },
            { key: '5', text: 'I am a covert ops!', sound: 'covertops.wav' },
            { key: '6', text: 'Enemy in disguise!', sound: 'disguise.wav' },
            { key: '7', text: 'Mines spotted!', sound: 'mines.wav' }
        ],
        requests: [
            { key: '1', text: 'Need a medic!', sound: 'needmedic.wav' },
            { key: '2', text: 'Need ammo!', sound: 'needammo.wav' },
            { key: '3', text: 'Need backup!', sound: 'needbackup.wav' },
            { key: '4', text: 'Need an engineer!', sound: 'needengineer.wav' },
            { key: '5', text: 'Cover me!', sound: 'coverme.wav' },
            { key: '6', text: 'Hold fire!', sound: 'holdfire.wav' },
            { key: '7', text: 'Where to?', sound: 'whereto.wav' }
        ],
        commands: [
            { key: '1', text: 'Follow me!', sound: 'followme.wav' },
            { key: '2', text: 'Lets go!', sound: 'letsgo.wav' },
            { key: '3', text: 'Move!', sound: 'move.wav' },
            { key: '4', text: 'Clear the path!', sound: 'clearpath.wav' },
            { key: '5', text: 'Defend objective!', sound: 'defendobjective.wav' },
            { key: '6', text: 'Disarm dynamite!', sound: 'disarmdynamite.wav' },
            { key: '7', text: 'Fire in the hole!', sound: 'fireinhole.wav' }
        ],
        responses: [
            { key: '1', text: 'Yes!', sound: 'yes.wav' },
            { key: '2', text: 'No!', sound: 'no.wav' },
            { key: '3', text: 'Thanks!', sound: 'thanks.wav' },
            { key: '4', text: 'Sorry!', sound: 'sorry.wav' },
            { key: '5', text: 'Oops!', sound: 'oops.wav' },
            { key: '6', text: 'On my way!', sound: 'onmyway.wav' },
            { key: '7', text: 'Acknowledged!', sound: 'acknowledged.wav' }
        ],
        reactions: [
            { key: '1', text: 'Great shot!', sound: 'greatshot.wav' },
            { key: '2', text: 'Nice work!', sound: 'nicework.wav' },
            { key: '3', text: 'Good game!', sound: 'goodgame.wav' },
            { key: '4', text: 'Hi!', sound: 'hi.wav' },
            { key: '5', text: 'Bye!', sound: 'bye.wav' },
            { key: '6', text: 'Cheer!', sound: 'cheer.wav' },
            { key: '7', text: 'You idiot!', sound: 'idiot.wav' }
        ]
    },

    open() {
        if (!AppState.user) return; // Only when logged in
        this.isOpen = true;
        this.currentCategory = null;
        document.getElementById('voice-menu').style.display = 'flex';
        document.getElementById('voice-categories').style.display = 'flex';
        document.getElementById('voice-submenu').style.display = 'none';
    },

    close() {
        this.isOpen = false;
        this.currentCategory = null;
        document.getElementById('voice-menu').style.display = 'none';
    },

    selectCategory(category) {
        this.currentCategory = category;
        this.showSubmenu(category);
    },

    showSubmenu(category) {
        const submenu = document.getElementById('voice-submenu');
        const commands = this.commands[category];

        submenu.innerHTML = commands.map(cmd => `
            <div class="voice-command" data-sound="${cmd.sound}">
                <span class="voice-number">${cmd.key}</span>
                <span class="voice-label">${cmd.text}</span>
            </div>
        `).join('');

        document.getElementById('voice-categories').style.display = 'none';
        submenu.style.display = 'flex';

        // Add click listeners
        submenu.querySelectorAll('.voice-command').forEach(cmd => {
            cmd.addEventListener('click', () => {
                this.executeCommand(cmd.dataset.sound, cmd.querySelector('.voice-label').textContent);
            });
        });
    },

    back() {
        if (this.currentCategory) {
            this.currentCategory = null;
            document.getElementById('voice-categories').style.display = 'flex';
            document.getElementById('voice-submenu').style.display = 'none';
        } else {
            this.close();
        }
    },

    executeCommand(soundFile, text) {
        // Play sound
        this.playSound(soundFile);

        // Post to chat
        API.postMessage(`[Voice] ${text}`)
            .then(() => {
                loadMessages(); // Chat is always visible now
            })
            .catch(err => console.error('Failed to post voice command:', err));

        this.close();
    },

    playSound(soundFile) {
        // Try to play sound from /sounds/et/ directory
        const audio = new Audio(`/sounds/et/${soundFile}`);
        audio.volume = 0.7;
        audio.play().catch(err => {
            console.log('Sound file not found:', soundFile);
            // Fallback: just console log if sound not available
        });
    },

    handleNumberKey(num) {
        if (!this.currentCategory) {
            // Select category
            const categories = ['statements', 'requests', 'commands', 'responses', 'reactions'];
            if (num >= 1 && num <= categories.length) {
                this.selectCategory(categories[num - 1]);
            }
        } else {
            // Execute command
            const commands = this.commands[this.currentCategory];
            const cmd = commands.find(c => c.key === String(num));
            if (cmd) {
                this.executeCommand(cmd.sound, cmd.text);
            }
        }
    }
};

// Category click handlers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.voice-category').forEach(cat => {
        cat.addEventListener('click', () => {
            VoiceMenu.selectCategory(cat.dataset.category);
        });
    });

    // Close on overlay click
    document.querySelector('.voice-menu-overlay')?.addEventListener('click', () => {
        VoiceMenu.close();
    });
});

// Global keyboard handler
document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // V key - toggle voice menu
    if (e.key.toLowerCase() === 'v' && !VoiceMenu.isOpen) {
        e.preventDefault();
        VoiceMenu.open();
        return;
    }

    // If voice menu is open
    if (VoiceMenu.isOpen) {
        // ESC - close or go back
        if (e.key === 'Escape') {
            e.preventDefault();
            VoiceMenu.back();
            return;
        }

        // Number keys 1-7
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= 7) {
            e.preventDefault();
            VoiceMenu.handleNumberKey(num);
            return;
        }
    }
});

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize screen references now that DOM is loaded
    appScreen = document.getElementById('app-screen');
    cabinsScreen = document.getElementById('cabins-screen');
    gamesScreen = document.getElementById('games-screen');
    profileScreen = document.getElementById('profile-screen');
    adminScreen = document.getElementById('admin-screen');
    settingsScreen = document.getElementById('settings-screen');
    allScreens = [appScreen, cabinsScreen, gamesScreen, profileScreen, adminScreen, settingsScreen];

    // Initialize back buttons now that screens exist
    document.querySelectorAll('.page-back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.closest('.page-back-btn').getAttribute('data-navigate');
            navigateTo(target || 'home');
        });
    });

    checkAuth();

    // Header button event listeners
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            // Switch to Profile tab
            document.querySelector('[data-tab="profile"]')?.click();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Wirklich abmelden?')) {
                clearToken();
                showAuthScreen();
            }
        });
    }

    // ============================================
    // BURGER MENU
    // ============================================
    const burgerBtn = document.getElementById('burger-menu-btn');
    const mobileUserAvatarBtn = document.getElementById('mobile-user-avatar-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mobileHelpBtn = document.getElementById('mobile-help-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    // Open mobile menu (old burger button - kept for backwards compatibility)
    if (burgerBtn) {
        burgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    // Open mobile menu (new avatar button)
    if (mobileUserAvatarBtn) {
        mobileUserAvatarBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    // Close mobile menu
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // Mobile navigation items
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageName = item.getAttribute('data-navigate');

            // Update active state in mobile menu
            mobileNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Navigate to page
            navigateTo(pageName);
        });
    });

    // Mobile help button
    if (mobileHelpBtn) {
        mobileHelpBtn.addEventListener('click', () => {
            const helpBtn = document.getElementById('help-btn');
            if (helpBtn) {
                helpBtn.click();
            }
            mobileMenu.classList.remove('active');
        });
    }

    // Mobile logout button
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            if (confirm('Wirklich abmelden?')) {
                clearToken();
                showAuthScreen();
                mobileMenu.classList.remove('active');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !burgerBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    });

    // Admin menu visibility is now handled in showAppScreen()

    // ============================================
    // PWA & PUSH NOTIFICATIONS
    // ============================================

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);

                // Check for updates periodically (every 60 seconds)
                setInterval(() => {
                    registration.update();
                }, 60000);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });

        // Listen for service worker messages (e.g., update notifications)
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log('Service Worker updated to version:', event.data.version);
                showUpdateNotification();
            }
        });
    }

    // Show update notification to user
    function showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.id = 'update-banner';
        updateBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--color-primary);
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        updateBanner.innerHTML = `
            <span>🔄 Neue Version verfügbar!</span>
            <button id="reload-btn" style="
                background: white;
                color: var(--color-primary);
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            ">Jetzt aktualisieren</button>
        `;
        document.body.prepend(updateBanner);

        document.getElementById('reload-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Notification state management
    let notificationSubscription = null;

    // Check notification support and update UI
    function updateNotificationUI() {
        const unsupportedMsg = document.getElementById('notification-unsupported');
        const deniedMsg = document.getElementById('notification-denied');
        const enabledMsg = document.getElementById('notification-enabled');
        const disabledMsg = document.getElementById('notification-disabled');
        const enableBtn = document.getElementById('enable-notifications-btn');
        const preferencesDiv = document.getElementById('notification-preferences');

        // Hide all messages
        [unsupportedMsg, deniedMsg, enabledMsg, disabledMsg].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Check support
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            if (unsupportedMsg) unsupportedMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
            return;
        }

        // Check permission
        if (Notification.permission === 'denied') {
            if (deniedMsg) deniedMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
            return;
        }

        if (Notification.permission === 'granted' && notificationSubscription) {
            if (enabledMsg) enabledMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'block';
        } else {
            if (disabledMsg) disabledMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'block';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
        }
    }

    // Subscribe to push notifications
    async function subscribeToPushNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const { publicKey } = await API.request('/api/notifications?action=public-key');

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Send subscription to server
            await API.request('/api/notifications?action=subscribe', {
                method: 'POST',
                body: JSON.stringify({ subscription })
            });

            notificationSubscription = subscription;
            updateNotificationUI();
            await loadNotificationPreferences();

            showMessage('notification-preferences-message', 'Benachrichtigungen erfolgreich aktiviert!', 'success');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            showMessage('notification-preferences-message', 'Fehler beim Aktivieren der Benachrichtigungen', 'error');
        }
    }

    // Unsubscribe from push notifications
    async function unsubscribeFromPushNotifications() {
        try {
            if (notificationSubscription) {
                await notificationSubscription.unsubscribe();

                await API.request('/api/notifications?action=unsubscribe', {
                    method: 'POST',
                    body: JSON.stringify({ endpoint: notificationSubscription.endpoint })
                });

                notificationSubscription = null;
                updateNotificationUI();
            }
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
        }
    }

    // Load notification preferences
    async function loadNotificationPreferences() {
        try {
            const { preferences } = await API.request('/api/notifications?action=preferences');

            document.getElementById('notify-chat').checked = preferences.chat;
            document.getElementById('notify-games').checked = preferences.games;
            document.getElementById('notify-accommodations').checked = preferences.accommodations;
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    }

    // Save notification preferences
    async function saveNotificationPreferences() {
        try {
            const preferences = {
                chat: document.getElementById('notify-chat').checked,
                games: document.getElementById('notify-games').checked,
                accommodations: document.getElementById('notify-accommodations').checked
            };

            await API.request('/api/notifications?action=preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences)
            });

            showMessage('notification-preferences-message', 'Einstellungen gespeichert!', 'success');
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            showMessage('notification-preferences-message', 'Fehler beim Speichern der Einstellungen', 'error');
        }
    }

    // Utility function to convert VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Event listeners for notification settings
    const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', async () => {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await subscribeToPushNotifications();
            } else {
                updateNotificationUI();
            }
        });
    }

    const saveNotificationPreferencesBtn = document.getElementById('save-notification-preferences-btn');
    if (saveNotificationPreferencesBtn) {
        saveNotificationPreferencesBtn.addEventListener('click', saveNotificationPreferences);
    }

    // Check existing subscription on load
    async function checkExistingSubscription() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    notificationSubscription = subscription;
                    await loadNotificationPreferences();
                }

                updateNotificationUI();
            } catch (error) {
                console.error('Error checking existing subscription:', error);
                updateNotificationUI();
            }
        } else {
            updateNotificationUI();
        }
    }

    // Initialize notifications when user is authenticated
    const originalShowAppScreen = showAppScreen;
    showAppScreen = function() {
        originalShowAppScreen.apply(this, arguments);
        setTimeout(checkExistingSubscription, 500);
    };

    // ============================================
    // SETTINGS SCREEN
    // ============================================

    const settingsBackBtn = document.getElementById('settings-back-btn');
    const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Show settings screen
    function showSettings() {
        // Load current user data
        if (AppState.user) {
            document.getElementById('settings-username').textContent = AppState.user.username;
            document.getElementById('settings-email').value = AppState.user.email || '';
            document.getElementById('settings-is-attending').checked = AppState.user.isAttending;
        }

        // Update notification UI elements in settings
        updateSettingsNotificationUI();

        // Hide app, show settings
        appScreen.style.display = 'none';
        settingsScreen.style.display = 'block';

        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
        }
    }

    // Hide settings screen
    function hideSettings() {
        settingsScreen.style.display = 'none';
        appScreen.style.display = 'block';
    }

    // Update notification UI in settings screen
    function updateSettingsNotificationUI() {
        const unsupportedMsg = document.getElementById('settings-notification-unsupported');
        const deniedMsg = document.getElementById('settings-notification-denied');
        const enabledMsg = document.getElementById('settings-notification-enabled');
        const disabledMsg = document.getElementById('settings-notification-disabled');
        const enableBtn = document.getElementById('settings-enable-notifications-btn');
        const preferencesDiv = document.getElementById('settings-notification-preferences');

        // Hide all messages
        [unsupportedMsg, deniedMsg, enabledMsg, disabledMsg].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Check support
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            if (unsupportedMsg) unsupportedMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
            return;
        }

        // Check permission
        if (Notification.permission === 'denied') {
            if (deniedMsg) deniedMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
            return;
        }

        if (Notification.permission === 'granted' && notificationSubscription) {
            if (enabledMsg) enabledMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'none';
            if (preferencesDiv) preferencesDiv.style.display = 'block';
        } else {
            if (disabledMsg) disabledMsg.style.display = 'block';
            if (enableBtn) enableBtn.style.display = 'block';
            if (preferencesDiv) preferencesDiv.style.display = 'none';
        }
    }

    // Load notification preferences in settings
    async function loadSettingsNotificationPreferences() {
        try {
            const { preferences } = await API.request('/api/notifications?action=preferences');

            document.getElementById('settings-notify-chat').checked = preferences.chat;
            document.getElementById('settings-notify-games').checked = preferences.games;
            document.getElementById('settings-notify-accommodations').checked = preferences.accommodations;
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    }

    // Save all settings
    async function saveSettings() {
        try {
            const email = document.getElementById('settings-email').value;
            const isAttending = document.getElementById('settings-is-attending').checked;
            const currentPassword = document.getElementById('settings-current-password').value;
            const newPassword = document.getElementById('settings-new-password').value;

            // Update profile
            const updateData = { email, isAttending };

            // Add password if provided
            if (currentPassword && newPassword) {
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }

            await API.updateProfile(updateData);

            // Save notification preferences if enabled
            if (Notification.permission === 'granted' && notificationSubscription) {
                const preferences = {
                    chat: document.getElementById('settings-notify-chat').checked,
                    games: document.getElementById('settings-notify-games').checked,
                    accommodations: document.getElementById('settings-notify-accommodations').checked
                };

                await API.request('/api/notifications?action=preferences', {
                    method: 'PUT',
                    body: JSON.stringify(preferences)
                });
            }

            // Clear password fields
            document.getElementById('settings-current-password').value = '';
            document.getElementById('settings-new-password').value = '';

            // Update app state
            AppState.user.email = email;
            AppState.user.isAttending = isAttending;

            showMessage('settings-message', 'Einstellungen erfolgreich gespeichert!', 'success');

            // Refresh participant list if attendance changed
            if (typeof loadParticipantsList === 'function') {
                loadParticipantsList();
            }

        } catch (error) {
            console.error('Failed to save settings:', error);
            showMessage('settings-message', error.message || 'Fehler beim Speichern der Einstellungen', 'error');
        }
    }

    // Event listeners
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', hideSettings);
    }

    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', showSettings);
    }

    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', showSettings);
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Settings: Enable notifications button
    const settingsEnableNotificationsBtn = document.getElementById('settings-enable-notifications-btn');
    if (settingsEnableNotificationsBtn) {
        settingsEnableNotificationsBtn.addEventListener('click', async () => {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await subscribeToPushNotifications();
                updateSettingsNotificationUI();
                await loadSettingsNotificationPreferences();
            } else {
                updateSettingsNotificationUI();
            }
        });
    }

    // When opening settings, load notification preferences
    const originalShowSettings = showSettings;
    showSettings = function() {
        originalShowSettings.apply(this, arguments);
        if (Notification.permission === 'granted' && notificationSubscription) {
            loadSettingsNotificationPreferences();
        }
    };
});
