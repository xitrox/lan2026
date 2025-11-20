# PWA & Push-Benachrichtigungen Setup

Die LAN Party 2026 App ist jetzt als Progressive Web App (PWA) mit Push-Benachrichtigungen konfiguriert.

## 1. Installation der Abhängigkeiten

```bash
npm install
```

Dies installiert `web-push` und alle anderen notwendigen Pakete.

## 2. Datenbank-Migration ausführen

Die neuen Tabellen und Spalten für Push-Benachrichtigungen müssen zur Datenbank hinzugefügt werden:

```bash
psql -U your_username -d your_database -f migrations/add_notifications.sql
```

Oder wenn Sie eine Connection-String verwenden:

```bash
psql "your_connection_string" -f migrations/add_notifications.sql
```

## 3. VAPID-Keys generieren (Optional, aber empfohlen)

Für Produktions-Umgebungen sollten Sie eigene VAPID-Keys generieren:

```bash
npx web-push generate-vapid-keys
```

Dies generiert ein Public/Private Key-Paar. Speichern Sie diese als Umgebungsvariablen:

```bash
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

Wenn Sie keine eigenen Keys setzen, werden die Standard-Keys aus dem Code verwendet (nur für Entwicklung geeignet).

## 4. PWA Icons erstellen

Die App benötigt Icons in verschiedenen Größen. Legen Sie diese im `/icons/` Verzeichnis ab:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Schnelle Icon-Generierung:**

Sie können ein Online-Tool wie [PWA Builder](https://www.pwabuilder.com/imageGenerator) verwenden, oder mit ImageMagick:

```bash
# Wenn Sie ein großes Logo haben (z.B. logo.png):
for size in 72 96 128 144 152 192 384 512; do
  convert logo.png -resize ${size}x${size} icons/icon-${size}x${size}.png
done
```

## 5. Vercel-Konfiguration (falls noch nicht vorhanden)

Stellen Sie sicher, dass die `vercel.json` die neue Notifications-API Route enthält:

```json
{
  "rewrites": [
    { "source": "/api/notifications", "destination": "/api/notifications.js" }
  ]
}
```

## 6. Server starten

```bash
npm run dev
```

## Features

### PWA-Funktionen

- ✅ Offline-Funktionalität durch Service Worker
- ✅ Installierbar auf Home Screen (Mobile & Desktop)
- ✅ App-ähnliches Erlebnis
- ✅ Schnelleres Laden durch Caching

### Push-Benachrichtigungen

Nutzer werden benachrichtigt bei:

- 💬 **Neuen Chat-Nachrichten** - Echtzeit-Benachrichtigungen für neue Nachrichten
- 🎮 **Neuen Spielen** - Wenn ein neues Spiel zur Liste hinzugefügt wird
- 🏠 **Unterkunft-Änderungen** - Wenn neue Unterkünfte hinzugefügt werden

### Benachrichtigungs-Einstellungen

Nutzer können im Profil-Tab:

1. Push-Benachrichtigungen aktivieren/deaktivieren
2. Einzelne Benachrichtigungs-Kategorien an/ausschalten:
   - Chat-Nachrichten
   - Spiele
   - Unterkünfte
3. Ihr Passwort ändern
4. Ihre Teilnahme am Event verwalten

## Datenbank-Schema

### Neue Tabellen

**push_subscriptions:**
- `id` - Primary Key
- `user_id` - Referenz zu users
- `endpoint` - Push-Service-URL
- `p256dh` - Verschlüsselungs-Key
- `auth` - Auth-Key
- `created_at` - Timestamp

### Neue Spalten in users

- `notify_chat` - Boolean (Standard: true)
- `notify_games` - Boolean (Standard: true)
- `notify_accommodations` - Boolean (Standard: true)

## API-Endpunkte

### `/api/notifications`

**GET ?action=public-key**
- Gibt den VAPID Public Key zurück

**POST ?action=subscribe**
- Body: `{ subscription: PushSubscription }`
- Registriert eine neue Push-Subscription

**POST ?action=unsubscribe**
- Body: `{ endpoint: string }`
- Entfernt eine Push-Subscription

**GET ?action=preferences**
- Gibt die Notification-Präferenzen des Nutzers zurück

**PUT ?action=preferences**
- Body: `{ chat: boolean, games: boolean, accommodations: boolean }`
- Aktualisiert die Notification-Präferenzen

**POST ?action=send** (Internal)
- Body: `{ type: string, title: string, body: string, data?: object }`
- Sendet eine Push-Benachrichtigung an alle abonnierten Nutzer

## Verwendung in anderen APIs

```javascript
const { sendNotification } = require('../lib/notifications');

// Benachrichtigung senden
sendNotification('chat', 'Neue Nachricht', 'Max: Hallo Welt!')
  .catch(err => console.error('Failed to send notification:', err));
```

## Testing

### Lokal testen

1. HTTPS ist erforderlich für Service Worker (außer auf localhost)
2. Öffnen Sie die App in einem unterstützten Browser (Chrome, Firefox, Edge)
3. Navigieren Sie zum Profil-Tab
4. Klicken Sie auf "Benachrichtigungen aktivieren"
5. Erlauben Sie Browser-Benachrichtigungen
6. Testen Sie durch Senden einer Chat-Nachricht oder Hinzufügen eines Spiels

### Browser-Unterstützung

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Mobile) - iOS 16.4+
- ❌ Safari (Desktop) - Keine Push-Unterstützung

## Troubleshooting

### "Service Worker registration failed"
- Stellen Sie sicher, dass die App über HTTPS läuft (oder localhost)
- Prüfen Sie Browser-Konsole auf Fehler

### "Benachrichtigungen werden nicht empfangen"
- Prüfen Sie, ob Browser-Benachrichtigungen erlaubt sind
- Stellen Sie sicher, dass die VAPID-Keys korrekt konfiguriert sind
- Überprüfen Sie die Datenbank-Einträge in `push_subscriptions`

### "Icons werden nicht angezeigt"
- Stellen Sie sicher, dass alle Icon-Dateien im `/icons/` Verzeichnis vorhanden sind
- Prüfen Sie die Pfade in `manifest.json`

## Sicherheit

- VAPID-Keys sollten als Umgebungsvariablen gesetzt werden
- Verwenden Sie niemals die Standard-Keys in Produktion
- Push-Subscriptions werden automatisch gelöscht, wenn sie ungültig werden (410/404 Fehler)

## Mobile Installation

### iOS (Safari)
1. Öffnen Sie die App in Safari
2. Tippen Sie auf das Teilen-Symbol
3. Wählen Sie "Zum Home-Bildschirm"
4. Tippen Sie auf "Hinzufügen"

### Android (Chrome)
1. Öffnen Sie die App in Chrome
2. Tippen Sie auf das Menü (⋮)
3. Wählen Sie "App installieren" oder "Zum Startbildschirm hinzufügen"
4. Tippen Sie auf "Installieren"

## Weitere Informationen

- [Web Push Protokoll](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa/)
