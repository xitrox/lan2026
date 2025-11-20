# PWA Installation Guide - Android

## Installation auf Android

### Chrome (empfohlen)

1. **Öffnen Sie die App-URL** in Chrome: `https://ihre-domain.vercel.app`
2. **Warten Sie** bis oben ein Banner erscheint: "App installieren"
3. **Tippen Sie auf "Installieren"**
   - ODER tippen Sie auf das **⋮ Menü** (oben rechts)
   - Wählen Sie **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**
4. **Bestätigen Sie** mit "Installieren"
5. Die App wird zum **Home Screen** hinzugefügt

**Alternative Methode:**
1. Tippen Sie auf **⋮ Menü** → **"Teilen"**
2. Wählen Sie **"Zum Startbildschirm hinzufügen"**

### Firefox

1. **Öffnen Sie die App-URL** in Firefox
2. Tippen Sie auf das **⋮ Menü** (oben rechts)
3. Wählen Sie **"Installieren"**
4. Bestätigen Sie mit **"Installieren"**
5. Die App erscheint auf dem Home Screen

### Edge

1. **Öffnen Sie die App-URL** in Edge
2. Tippen Sie auf das **⋮ Menü** (unten)
3. Wählen Sie **"Zu Telefon hinzufügen"** oder **"Installieren"**
4. Bestätigen Sie
5. Die App wird installiert

### Brave Browser

⚠️ **Wichtig:** Brave blockiert standardmäßig viele PWA-Features aus Datenschutzgründen.

**Option 1: Shields deaktivieren (für diese Seite)**
1. Tippen Sie auf das **Brave-Schild-Symbol** (oben rechts)
2. Tippen Sie auf **"Shields für diese Seite deaktivieren"**
3. Seite neu laden
4. Tippen Sie auf **⋮ Menü** → **"Zum Startbildschirm hinzufügen"**

**Option 2: Chrome verwenden (empfohlen)**
- Brave blockiert Service Worker und Push-Benachrichtigungen
- Für die beste Erfahrung: **Chrome verwenden**

### Samsung Internet

1. **Öffnen Sie die App-URL** in Samsung Internet
2. Tippen Sie auf das **☰ Menü** (unten)
3. Wählen Sie **"Seite hinzufügen zu"**
4. Wählen Sie **"Startbildschirm"**
5. Passen Sie den Namen an
6. Tippen Sie auf **"Hinzufügen"**

## Nach der Installation

### Die App öffnen
- Tippen Sie auf das **App-Icon** auf Ihrem Home Screen
- Die App öffnet sich im **Vollbild-Modus** (ohne Browser-UI)
- Sieht aus wie eine native App!

### Push-Benachrichtigungen aktivieren
1. Öffnen Sie die App
2. Melden Sie sich an
3. Gehen Sie zum **Profil-Tab** (👤)
4. Scrollen Sie zu **"Benachrichtigungs-Einstellungen"**
5. Tippen Sie auf **"Benachrichtigungen aktivieren"**
6. Erlauben Sie Benachrichtigungen im Browser-Dialog

### Funktioniert die Installation?

**So testen Sie:**
- ✅ App-Icon auf dem Home Screen sichtbar
- ✅ App öffnet im Vollbild (keine Browser-Leiste oben)
- ✅ App erscheint in den "Zuletzt verwendeten Apps"
- ✅ App funktioniert offline (nach dem ersten Laden)

## Troubleshooting

### "Installieren" Option nicht sichtbar

**Grund:** Die PWA-Kriterien sind nicht erfüllt

**Lösung:**
1. Stellen Sie sicher, dass Sie über **HTTPS** zugreifen (nicht HTTP)
2. Warten Sie 30 Sekunden nach dem Laden der Seite
3. Prüfen Sie, ob ein Service Worker registriert ist:
   - Chrome: **⋮ Menü** → **Einstellungen** → **Website-Einstellungen** → **Alle Websites**
   - Suchen Sie Ihre Domain
   - Prüfen Sie unter "Berechtigungen"

### Brave Browser funktioniert nicht

**Problem:** Brave blockiert Service Worker, Push-Benachrichtigungen, etc.

**Lösung:**
- **Option A:** Shields für diese Seite deaktivieren
- **Option B:** Chrome verwenden (empfohlen für beste Erfahrung)

### Push-Benachrichtigungen funktionieren nicht

**Checkliste:**
1. ✅ Haben Sie die Berechtigung erteilt?
   - Einstellungen → Apps → Ihre App → Benachrichtigungen
2. ✅ Sind die Benachrichtigungen in der App aktiviert?
   - Profil-Tab → Benachrichtigungs-Einstellungen
3. ✅ Ist "Nicht stören" deaktiviert?
   - Android-Einstellungen prüfen
4. ✅ Ist die App über HTTPS geladen?
   - Muss mit https:// beginnen

### App lädt nicht offline

**Problem:** Service Worker wurde nicht registriert

**Lösung:**
1. App deinstallieren
2. Browser-Cache leeren
3. App neu installieren
4. Warten bis "Service Worker registered" in der Konsole erscheint

### App-Icon fehlt oder sieht falsch aus

**Problem:** Icons wurden nicht korrekt hochgeladen

**Lösung:**
1. App deinstallieren
2. Browser-Cache leeren
3. Seite neu laden
4. Warten bis alle Icons geladen sind
5. App neu installieren

## Browser-Kompatibilität

| Browser | PWA-Installation | Push-Benachrichtigungen | Offline |
|---------|------------------|-------------------------|---------|
| Chrome | ✅ Perfekt | ✅ Ja | ✅ Ja |
| Firefox | ✅ Gut | ✅ Ja | ✅ Ja |
| Edge | ✅ Perfekt | ✅ Ja | ✅ Ja |
| Samsung Internet | ✅ Gut | ✅ Ja | ✅ Ja |
| Brave | ⚠️ Eingeschränkt | ❌ Blockiert | ⚠️ Eingeschränkt |
| Opera | ✅ Gut | ✅ Ja | ✅ Ja |

## PWA deinstallieren

### Methode 1: Vom Home Screen
1. **Halten Sie** das App-Icon gedrückt
2. Ziehen Sie es auf **"Deinstallieren"** oder **"Entfernen"**
3. Bestätigen Sie

### Methode 2: Über Android-Einstellungen
1. Öffnen Sie **Einstellungen**
2. Gehen Sie zu **Apps**
3. Suchen Sie **"LAN Party 2026"**
4. Tippen Sie auf **"Deinstallieren"**

### Methode 3: Über Chrome
1. Öffnen Sie **Chrome**
2. Tippen Sie auf **⋮ Menü** → **Einstellungen**
3. Gehen Sie zu **"Website-Einstellungen"** → **"Alle Websites"**
4. Suchen Sie Ihre Domain
5. Tippen Sie auf **"Löschen & Zurücksetzen"**

## iOS (iPhone/iPad)

### Safari

1. **Öffnen Sie die App-URL** in Safari
2. Tippen Sie auf das **Teilen-Symbol** (📤)
3. Scrollen Sie nach unten
4. Wählen Sie **"Zum Home-Bildschirm"**
5. Passen Sie den Namen an
6. Tippen Sie auf **"Hinzufügen"**

**Hinweis:** iOS unterstützt Push-Benachrichtigungen nur ab iOS 16.4+

## Vorteile der PWA-Installation

✅ **Schnellerer Zugriff** - Icon direkt auf dem Home Screen
✅ **App-ähnliches Erlebnis** - Vollbild, keine Browser-UI
✅ **Offline-Funktionalität** - Funktioniert ohne Internet
✅ **Push-Benachrichtigungen** - Bleiben Sie auf dem Laufenden
✅ **Weniger Datenverbrauch** - Inhalte werden gecacht
✅ **Kein App Store nötig** - Direkt vom Browser installieren
✅ **Automatische Updates** - Immer die neueste Version

## Support

Bei Problemen:
- Prüfen Sie die Browser-Konsole (DevTools)
- Stellen Sie sicher, dass HTTPS verwendet wird
- Testen Sie mit Chrome (beste Kompatibilität)
- Leeren Sie den Browser-Cache bei Problemen
