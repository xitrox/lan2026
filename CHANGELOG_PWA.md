# PWA & Push-Benachrichtigungen - Änderungsprotokoll

## Zusammenfassung

Die LAN Party 2026 Anwendung wurde erfolgreich in eine Progressive Web App (PWA) mit vollständiger Push-Benachrichtigungs-Funktionalität umgewandelt.

## Neue Dateien

### PWA-Kern
- `manifest.json` - PWA Manifest mit App-Metadaten
- `service-worker.js` - Service Worker für Offline-Funktionalität und Push-Benachrichtigungen
- `icons/` - Verzeichnis für App-Icons (verschiedene Größen)

### Backend
- `api/notifications.js` - API-Endpunkt für Push-Benachrichtigungen
- `lib/notifications.js` - Hilfsfunktionen für das Versenden von Benachrichtigungen
- `migrations/add_notifications.sql` - Datenbank-Migration für Notification-Features

### Dokumentation & Setup
- `PWA_SETUP.md` - Vollständige Anleitung zur Einrichtung
- `setup-pwa.sh` - Automatisiertes Setup-Script
- `CHANGELOG_PWA.md` - Dieses Dokument

## Geänderte Dateien

### Frontend

**index.html**
- PWA Meta-Tags hinzugefügt (theme-color, apple-mobile-web-app-*)
- Manifest-Link hinzugefügt
- Notification-Einstellungen im Profil-Tab hinzugefügt
  - Status-Anzeigen (unterstützt/nicht unterstützt/aktiviert/deaktiviert)
  - Aktivierungs-Button
  - Präferenz-Toggles für Chat, Spiele, Unterkünfte

**app.js**
- Service Worker Registration
- Push-Subscription Management
- Notification-Permission Handling
- UI-Updates für Notification-Status
- VAPID-Key Konvertierung
- Integration mit Backend-API

**styles.css**
- Notification-Settings Styling
- PWA-Install-Prompt Styling
- Mobile-optimierte Styles für Notifications
- Responsive Design-Anpassungen

### Backend

**api/messages.js**
- Import von `sendNotification`
- Notification-Trigger bei neuen Chat-Nachrichten

**api/games.js**
- Import von `sendNotification`
- Notification-Trigger bei neuen Spielen

**api/cabins.js**
- Import von `sendNotification`
- Notification-Trigger bei neuen Unterkünften

**api/event.js**
- Korrektur der Teilnehmer-Zählung (nur `is_attending = true`)

### Konfiguration

**package.json**
- `web-push` Dependency hinzugefügt (^3.6.7)

**vercel.json**
- Service Worker Header konfiguriert
- Manifest.json Header konfiguriert
- Korrekte Content-Types und Caching

## Datenbank-Änderungen

### Neue Tabelle: `push_subscriptions`
```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, endpoint)
);
```

### Neue Spalten in `users`
```sql
ALTER TABLE users ADD COLUMN notify_chat BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN notify_games BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN notify_accommodations BOOLEAN DEFAULT true;
```

## Features

### 1. Progressive Web App (PWA)
- ✅ Installierbar auf Home Screen (iOS & Android)
- ✅ Offline-Funktionalität durch Service Worker
- ✅ App-ähnliches Vollbild-Erlebnis
- ✅ Schnelleres Laden durch intelligentes Caching
- ✅ Automatische Updates des Service Workers

### 2. Push-Benachrichtigungen
- ✅ Web Push Notifications mit VAPID
- ✅ Benachrichtigungen für neue Chat-Nachrichten
- ✅ Benachrichtigungen für neue Spiele
- ✅ Benachrichtigungen für neue Unterkünfte
- ✅ Granulare Präferenz-Einstellungen
- ✅ Automatische Bereinigung ungültiger Subscriptions

### 3. Benutzer-Einstellungen (Profil-Tab)
- ✅ Passwort ändern
- ✅ Teilnahme-Status (An/Aus)
- ✅ E-Mail ändern
- ✅ Push-Benachrichtigungen aktivieren/deaktivieren
- ✅ Kategorie-spezifische Notification-Präferenzen

### 4. Mobile-First Design
- ✅ Responsive UI für alle Bildschirmgrößen
- ✅ Touch-optimierte Bedienelemente
- ✅ Optimierte Performance für mobile Geräte

## API-Endpunkte

### GET `/api/notifications?action=public-key`
Gibt den VAPID Public Key zurück.

**Response:**
```json
{
  "success": true,
  "publicKey": "..."
}
```

### POST `/api/notifications?action=subscribe`
Registriert eine neue Push-Subscription.

**Request:**
```json
{
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### POST `/api/notifications?action=unsubscribe`
Entfernt eine Push-Subscription.

**Request:**
```json
{
  "endpoint": "..."
}
```

### GET `/api/notifications?action=preferences`
Gibt die Notification-Präferenzen des Benutzers zurück.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "chat": true,
    "games": true,
    "accommodations": false
  }
}
```

### PUT `/api/notifications?action=preferences`
Aktualisiert die Notification-Präferenzen.

**Request:**
```json
{
  "chat": true,
  "games": false,
  "accommodations": true
}
```

## Installation & Setup

Siehe `PWA_SETUP.md` für detaillierte Anweisungen.

**Schnellstart:**
```bash
# 1. Dependencies installieren
npm install

# 2. Datenbank migrieren
psql "your_connection_string" -f migrations/add_notifications.sql

# 3. (Optional) VAPID Keys generieren
npx web-push generate-vapid-keys

# 4. Server starten
npm run dev
```

**Oder das automatische Setup nutzen:**
```bash
./setup-pwa.sh
```

## Browser-Unterstützung

| Browser | PWA | Push Notifications |
|---------|-----|-------------------|
| Chrome (Desktop) | ✅ | ✅ |
| Chrome (Android) | ✅ | ✅ |
| Firefox (Desktop) | ✅ | ✅ |
| Firefox (Android) | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ |
| Safari (iOS 16.4+) | ✅ | ✅ |
| Safari (Desktop) | ✅ | ❌ |

## Sicherheit

- VAPID-Keys sollten als Umgebungsvariablen gespeichert werden
- Service Worker nur über HTTPS (außer localhost)
- Push-Subscriptions werden bei ungültigen Responses (410/404) automatisch gelöscht
- Keine sensiblen Daten in Push-Payloads

## Testing

1. Öffnen Sie die App in einem unterstützten Browser
2. Navigieren Sie zum Profil-Tab
3. Klicken Sie auf "Benachrichtigungen aktivieren"
4. Erlauben Sie Browser-Benachrichtigungen
5. Testen Sie durch:
   - Senden einer Chat-Nachricht (anderer Tab/Browser)
   - Hinzufügen eines Spiels (Admin)
   - Hinzufügen einer Unterkunft (Admin)

## Bekannte Einschränkungen

- Safari Desktop unterstützt keine Web Push Notifications
- Icons müssen manuell erstellt/hochgeladen werden
- VAPID-Keys müssen für Produktion generiert werden

## Zukünftige Verbesserungen

Mögliche Erweiterungen:
- [ ] Background Sync für Offline-Chat-Nachrichten
- [ ] Rich Notifications mit Bildern/Actions
- [ ] Notification Badges für ungelesene Nachrichten
- [ ] Periodisches Background Sync
- [ ] App-Update-Benachrichtigungen

## Migration für bestehende Installationen

Wenn Sie bereits eine laufende Installation haben:

1. Backup der Datenbank erstellen
2. `npm install` ausführen
3. Datenbank-Migration ausführen
4. Server neu starten
5. Benutzer über neue Features informieren

## Support

Bei Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehler
2. Stellen Sie sicher, dass die App über HTTPS läuft
3. Überprüfen Sie die VAPID-Keys
4. Siehe `PWA_SETUP.md` Troubleshooting-Sektion

---

**Version:** 2.0.0
**Datum:** 2025-11-20
**Autor:** Claude Code
