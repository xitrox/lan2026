# LAN Party 2026 - Operation Reunion 🎮

Eine vollständige Web-Applikation für die Organisation einer LAN-Party mit Enemy Territory-inspiriertem Design.

## ✨ Features

### 🔐 **Benutzer-Authentifizierung**
- Registrierung mit gemeinsamem Start-Passwort
- Login mit JWT-Token (lang-lebig bis Logout)
- Profilverwaltung (E-Mail & Passwort ändern)
- Admin-Accounts mit erweiterten Rechten

### 🏠 **Unterkunfts-Voting**
- Admins können Unterkünfte hinzufügen (inkl. Airbnb-Links)
- Alle User können für Unterkünfte voten
- Live-Anzeige der Votes für alle Teilnehmer

### 🎮 **Spiele-Voting**
- Jeder User kann neue Spiele vorschlagen
- Voting-System für alle Spiele
- Live-Anzeige der Top 3 Spiele
- Admins können Spiele entfernen

### 💬 **Message Board (ET-Style Chat)**
- Enemy Territory Color Codes (^0 bis ^7)
- Kein Timestamp (wie im Original!)
- Nachrichten bearbeiten & löschen
- Auto-Refresh alle 10 Sekunden

### 📊 **Event-Management**
- Event-Infosektion mit Datum, Countdown, Teilnehmer, Ort
- Live-Anzeige der angemeldeten Spieler
- Admins können Event-Stammdaten verwalten

### ⚙️ **Admin-Panel**
- Benutzerverwaltung (löschen, Admin-Status ändern)
- Passwörter zurücksetzen
- Event-Daten bearbeiten
- Registrierungspasswort ändern
- Nachrichten moderieren

## 🚀 Quick Start

### 1. Repository klonen

```bash
git clone <dein-repo>
cd lan2026
```

### 2. Dependencies installieren

```bash
npm install
```

Dies installiert:
- `bcrypt` - Passwort-Hashing
- `jsonwebtoken` - JWT-Token-Generierung
- `@vercel/postgres` - PostgreSQL-Datenbank
- `vercel` - Deployment-Tool (Dev-Dependency)

### 3. Vercel Postgres Datenbank erstellen

1. Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Gehe zu **Storage** → **Create Database** → **Postgres**
4. Wähle den kostenlosen Plan
5. Erstelle die Datenbank

Vercel setzt automatisch die Environment Variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- etc.

### 4. Datenbank-Schema initialisieren

**Option A: Via Vercel Dashboard**
```bash
# 1. Gehe zu Storage → Dein Postgres → Query Tab
# 2. Kopiere den Inhalt von db/schema.sql
# 3. Führe das SQL aus
```

**Option B: Via CLI (erfordert psql)**
```bash
# Hole Environment Variables
vercel env pull .env.local

# Führe Schema aus
psql $POSTGRES_URL < db/schema.sql
```

### 5. JWT Secret festlegen (Optional, aber empfohlen)

Füge eine Environment Variable hinzu:

```bash
vercel env add JWT_SECRET
# Gib einen sicheren, zufälligen String ein
```

Wenn nicht gesetzt, wird ein Default-Secret verwendet (nicht für Production!).

### 6. Deploy!

```bash
vercel --prod
```

### 7. Ersten Admin-User erstellen

Nach dem Deployment musst du einen ersten Admin-User manuell in der Datenbank erstellen:

**Via Vercel Dashboard:**
1. Gehe zu Storage → Dein Postgres → Query Tab
2. Führe folgenden SQL-Befehl aus:

```sql
-- Erst registrieren (über die Website mit dem Registrierungspasswort)
-- Dann Admin-Status setzen:
UPDATE users SET is_admin = true WHERE username = 'dein-username';
```

**Oder:** Nutze die normale Registrierung und setze dann manuell `is_admin = true` in der Datenbank.

## 📁 Projekt-Struktur

```
lan2026/
├── index.html              # Haupt-HTML (Login + App)
├── app.js                  # Frontend JavaScript
├── styles.css              # Styling (ET-inspiriert)
├── package.json            # Dependencies
├── vercel.json             # Vercel-Konfiguration
│
├── api/                    # Serverless Functions (6 Functions)
│   ├── auth.js            # Auth-API (Login, Register, Verify, Update-Profile)
│   ├── admin.js           # Admin-API (User-Management, Password-Reset)
│   ├── cabins.js          # Cabins-API (List, Add, Vote, Delete)
│   ├── games.js           # Games-API (List, Add, Vote, Delete)
│   ├── messages.js        # Messages-API (List, Post, Edit, Delete)
│   └── event.js           # Event-API (Get, Update)
│
├── lib/                    # Utility-Module
│   ├── auth.js            # Auth-Funktionen
│   └── db.js              # Datenbank-Helpers
│
└── db/                     # Datenbank-Schema
    ├── schema.sql         # PostgreSQL Schema
    └── README.md          # Datenbank-Dokumentation
```

**✅ Optimiert für Vercel Hobby Plan (max. 12 Functions)**

Die APIs sind konsolidiert und nutzen Query-Parameter für verschiedene Operationen:
- `/api/auth?action=login` - Login
- `/api/auth?action=register` - Registrierung
- `/api/cabins?action=list` - Hütten abrufen
- `/api/cabins?action=vote` - Für Hütte voten
- usw.

## 🎨 Enemy Territory Color Codes

Im Chat können folgende Color Codes verwendet werden:

- `^0` - Schwarz
- `^1` - Rot
- `^2` - Grün
- `^3` - Gelb
- `^4` - Blau
- `^5` - Cyan
- `^6` - Magenta
- `^7` - Weiß

**Beispiel:** `^1Hallo ^7Welt!` wird zu <span style="color: red">Hallo</span> <span style="color: white">Welt!</span>

## 🔧 Lokale Entwicklung

```bash
# Environment Variables holen
vercel env pull .env.local

# Dev-Server starten
vercel dev
```

Die App läuft dann auf `http://localhost:3000`

## 🔐 Sicherheit

### Standard-Registrierungspasswort

Das Standard-Registrierungspasswort ist: **`lan2026reunion`**

**⚠️ WICHTIG:** Ändere dieses Passwort im Admin-Panel unter "Event-Stammdaten" → "Registrierungspasswort"!

### JWT Secret

Setze ein sicheres JWT Secret als Environment Variable:

```bash
vercel env add JWT_SECRET production
# Gib einen langen, zufälligen String ein (z.B. 32+ Zeichen)
```

### Best Practices

- Teile das Registrierungspasswort nur über sichere Kanäle (Signal, WhatsApp, etc.)
- Ändere das Registrierungspasswort nach der Event-Registrierungsphase
- Sichere Admin-Passwörter verwenden (min. 12 Zeichen)
- Vercel Postgres ist standardmäßig verschlüsselt (SSL)

## 📱 Responsive Design

Die App ist vollständig responsive und funktioniert auf:
- 📱 Smartphones (iOS & Android)
- 💻 Tablets
- 🖥️ Desktop-PCs

## 🛠️ Troubleshooting

### "Datenbankverbindung fehlgeschlagen"

Stelle sicher, dass:
1. Die Vercel Postgres Datenbank erstellt wurde
2. Die Environment Variables korrekt gesetzt sind
3. Das Schema initialisiert wurde

### "Token ungültig"

Lösche die Cookies/LocalStorage und logge dich erneut ein.

### "Registrierungspasswort ungültig"

Das Standard-Passwort ist `lan2026reunion`. Falls geändert, frage einen Admin.

### API-Endpunkte funktionieren nicht

Überprüfe die Vercel-Function-Logs:
```bash
vercel logs
```

## 📊 Datenbank-Management

### Backup erstellen

```bash
# Via Vercel Dashboard: Storage → Data → Export
# Oder via CLI:
pg_dump $POSTGRES_URL > backup.sql
```

### Daten zurücksetzen

```bash
# Achtung: Löscht ALLE Daten!
psql $POSTGRES_URL < db/schema.sql
```

## 🎯 Feature-Roadmap

Mögliche zukünftige Erwebnisse:

- [ ] Benachrichtigungen bei neuen Chat-Nachrichten
- [ ] Bildupload für Unterkünfte
- [ ] Teilnehmerliste mit Avataren
- [ ] Turnier-Bracket-System
- [ ] Event-Fotos-Galerie
- [ ] RSS-Feed für Ankündigungen

## 📄 Lizenz

MIT License - Free to use and modify for your LAN party!

## 🙏 Credits

- Inspiriert von **Wolfenstein: Enemy Territory**
- Gebaut mit ❤️ und roten Pixeln
- Powered by **Vercel** & **PostgreSQL**

---

**Viel Spaß bei eurer LAN Party! 🎮🔥**

Bei Fragen oder Problemen: Erstelle ein Issue auf GitHub oder kontaktiere den Admin.
