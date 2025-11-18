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

    async updateProfile(email, currentPassword, newPassword) {
        return this.request('/api/auth?action=update-profile', {
            method: 'POST',
            body: JSON.stringify({ email, currentPassword, newPassword })
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

    try {
        const response = await API.verifyToken();
        AppState.user = response.user;
        AppState.isAdmin = response.user.isAdmin;
        showAppScreen();
        return true;
    } catch (error) {
        console.error('Auth verification failed:', error);
        clearToken();
        showAuthScreen();
        return false;
    }
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showAppScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';

    // Update UI
    document.getElementById('user-display').textContent = AppState.user.username;

    // Show admin tab if admin
    if (AppState.isAdmin) {
        document.getElementById('admin-tab-btn').style.display = 'block';
        document.getElementById('add-cabin-btn').style.display = 'inline-block';
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

document.getElementById('user-menu-btn').addEventListener('click', () => {
    // Switch to Profile tab
    document.querySelector('[data-tab="profile"]').click();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Wirklich abmelden?')) {
        clearToken();
        showAuthScreen();
    }
});

// ============================================
// TAB NAVIGATION
// ============================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Remove active class from all
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to selected
        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Load data if needed
        if (tabName === 'chat') {
            scrollChatToBottom();
        } else if (tabName === 'admin') {
            loadAdminUsers();
        } else if (tabName === 'profile') {
            loadProfileForm();
        }
    });
});

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

    // Update title
    document.getElementById('auth-event-title').textContent = event.title || 'LAN PARTY 2026';
    document.getElementById('app-event-title').textContent = event.title || 'LAN PARTY 2026';
    document.title = (event.title || 'LAN Party 2026') + ' - Management';

    // Update date with time range
    if (event.eventDate) {
        const startDate = new Date(event.eventDate);
        const dateStr = startDate.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = startDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });

        document.getElementById('event-date-hero').textContent = `${dateStr}, ab ${timeStr} Uhr`;
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

    if (diff < 0) {
        document.getElementById('countdown-days').textContent = '00';
        document.getElementById('countdown-hours').textContent = '00';
        document.getElementById('countdown-minutes').textContent = '00';
        document.getElementById('countdown-seconds').textContent = '00';
        document.querySelector('.countdown-label').textContent = 'EVENT LÄUFT! 🎉';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown-days').textContent = String(days).padStart(2, '0');
    document.getElementById('countdown-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = String(seconds).padStart(2, '0');

    // Update every second for live countdown
    setTimeout(() => updateCountdown(targetDate), 1000);
}

// ============================================
// PARTICIPANTS LIST
// ============================================
async function loadParticipantsList() {
    try {
        const response = await API.getUsers();
        const users = response.users;

        const listContainer = document.getElementById('participants-list');

        if (users.length === 0) {
            listContainer.innerHTML = '<div class="participant-item">Noch keine Teilnehmer</div>';
            return;
        }

        listContainer.innerHTML = users.map(user => `
            <div class="participant-item">
                <span class="participant-avatar">${user.username.charAt(0).toUpperCase()}</span>
                <span class="participant-name">${user.username}</span>
                ${user.is_admin ? '<span class="participant-badge">👑</span>' : ''}
            </div>
        `).join('');
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
    } catch (error) {
        console.error('Failed to load cabins:', error);
        document.getElementById('cabins-grid').innerHTML = '<p class="error">Fehler beim Laden der Unterkünfte</p>';
    }
}

function renderCabins() {
    const grid = document.getElementById('cabins-grid');

    if (AppState.cabins.length === 0) {
        grid.innerHTML = '<p class="empty-state">Noch keine Unterkünfte hinzugefügt</p>';
        return;
    }

    grid.innerHTML = AppState.cabins.map(cabin => `
        <div class="cabin-card">
            ${cabin.image_url ? `<img src="${cabin.image_url}" alt="${cabin.name}" class="cabin-image">` : ''}
            <div class="cabin-content">
                <h3 class="cabin-name">${cabin.name}</h3>
                ${cabin.description ? `<p class="cabin-description">${cabin.description}</p>` : ''}
                ${cabin.url ? `<a href="${cabin.url}" target="_blank" class="cabin-link">Link öffnen →</a>` : ''}
                <div class="cabin-votes">
                    <button class="vote-btn ${cabin.user_voted ? 'voted' : ''}" data-cabin-id="${cabin.id}">
                        ${cabin.user_voted ? '✓' : '♡'} ${cabin.vote_count} Stimme(n)
                    </button>
                    ${AppState.isAdmin ? `<button class="delete-btn" data-cabin-id="${cabin.id}" data-type="cabin">🗑️</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add vote event listeners
    grid.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
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
        btn.addEventListener('click', async () => {
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
    const topGames = AppState.games.slice(0, 3);
    const list = document.getElementById('top-games-list');

    if (topGames.length === 0) {
        list.innerHTML = '<div class="top-game-item">Noch keine Spiele</div>';
        return;
    }

    list.innerHTML = topGames.map((game, index) => `
        <div class="top-game-item">
            <span class="top-game-rank">#${index + 1}</span>
            <span class="top-game-name">${game.name}</span>
            <span class="top-game-votes">${game.vote_count} ♡</span>
        </div>
    `).join('');
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

// Auto-refresh messages every 10 seconds
setInterval(() => {
    const chatTab = document.getElementById('tab-chat');
    if (chatTab.classList.contains('active')) {
        loadMessages();
    }
}, 10000);

// ============================================
// PROFILE
// ============================================
function loadProfileForm() {
    document.getElementById('profile-username').value = AppState.user.username;
    document.getElementById('profile-email').value = AppState.user.email;
    document.getElementById('profile-current-password').value = '';
    document.getElementById('profile-new-password').value = '';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('profile-email').value;
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const messageDiv = document.getElementById('profile-message');

    // Check if changing password
    if (newPassword && !currentPassword) {
        messageDiv.textContent = 'Bitte aktuelles Passwort eingeben';
        messageDiv.className = 'form-response error';
        messageDiv.style.display = 'block';
        return;
    }

    try {
        await API.updateProfile(email, currentPassword || undefined, newPassword || undefined);
        messageDiv.textContent = 'Profil erfolgreich aktualisiert';
        messageDiv.className = 'form-response success';
        messageDiv.style.display = 'block';

        // Clear password fields
        document.getElementById('profile-current-password').value = '';
        document.getElementById('profile-new-password').value = '';

        // Update user email in state
        AppState.user.email = email;

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
    const location = document.getElementById('admin-event-location').value;
    const password = document.getElementById('admin-event-password').value;

    try {
        await API.updateEventData({
            title,
            eventDate: dateValue ? new Date(dateValue).toISOString() : null,
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

document.getElementById('add-game-btn').addEventListener('click', () => {
    document.getElementById('add-game-modal').style.display = 'flex';
});

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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
