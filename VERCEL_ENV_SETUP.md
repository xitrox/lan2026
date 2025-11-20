# Vercel Umgebungsvariablen einrichten

## Methode 1: Über das Vercel Dashboard (UI)

1. Gehen Sie zu Ihrem Projekt auf [vercel.com](https://vercel.com)
2. Klicken Sie auf **Settings** (Einstellungen)
3. Wählen Sie **Environment Variables** im Seitenmenü
4. Fügen Sie folgende Variablen hinzu:

### Erforderliche Variablen:

| Name | Value | Environment |
|------|-------|-------------|
| `VAPID_PUBLIC_KEY` | `BDein...` | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | `Dein...` | Production, Preview, Development |

**Wichtig:** Wählen Sie alle drei Environments aus (Production, Preview, Development)

### Optional, aber empfohlen:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `POSTGRES_URL` | `postgres://...` | Production (Vercel Postgres) |

## Methode 2: Über die Vercel CLI

```bash
# Installieren Sie die Vercel CLI (falls noch nicht geschehen)
npm i -g vercel

# Melden Sie sich an
vercel login

# Link zum Projekt (im Projekt-Verzeichnis)
vercel link

# VAPID Keys generieren
npx web-push generate-vapid-keys

# Setzen Sie die Environment Variables
vercel env add VAPID_PUBLIC_KEY
# Wenn gefragt: Fügen Sie den generierten Public Key ein
# Environment: Production, Preview, Development (alle auswählen)

vercel env add VAPID_PRIVATE_KEY
# Wenn gefragt: Fügen Sie den generierten Private Key ein
# Environment: Production, Preview, Development (alle auswählen)
```

## Methode 3: Über vercel.json (NICHT EMPFOHLEN für Secrets)

⚠️ **WICHTIG:** Speichern Sie niemals Secret Keys direkt in vercel.json!
Diese Datei wird in Git committed und ist öffentlich sichtbar.

Verwenden Sie stattdessen immer das Dashboard oder die CLI für sensible Daten.

## VAPID Keys generieren

```bash
# Im Projekt-Verzeichnis:
npx web-push generate-vapid-keys
```

**Ausgabe:**
```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-FbRouAevSmBQ6O4KIMGt_2H8xLWOvgfBZIQ

=======================================
```

Kopieren Sie beide Keys und fügen Sie sie als Umgebungsvariablen hinzu.

## Environment Variables testen

Nach dem Deployment können Sie testen, ob die Variablen gesetzt sind:

1. Öffnen Sie die Vercel Deployment-URL
2. Öffnen Sie die Browser-Konsole (F12)
3. Gehen Sie zum Profil-Tab
4. Klicken Sie auf "Benachrichtigungen aktivieren"
5. Prüfen Sie die Netzwerk-Anfragen (Network Tab)
   - `GET /api/notifications?action=public-key`
   - Response sollte Ihren Public Key enthalten (nicht den Default-Key)

## Umgebungsvariablen aktualisieren

Wenn Sie die Keys später ändern möchten:

**Via Dashboard:**
1. Settings → Environment Variables
2. Finden Sie die Variable
3. Klicken Sie auf "Edit"
4. Geben Sie den neuen Wert ein
5. Speichern

**Via CLI:**
```bash
# Entfernen Sie die alte Variable
vercel env rm VAPID_PUBLIC_KEY production

# Fügen Sie die neue hinzu
vercel env add VAPID_PUBLIC_KEY production
```

**Wichtig:** Nach Änderungen muss das Projekt neu deployed werden:
```bash
vercel --prod
```

## Lokale Entwicklung

Für lokale Entwicklung erstellen Sie eine `.env` Datei:

```bash
# .env (im Projekt-Root)
VAPID_PUBLIC_KEY=BIhrPublicKey...
VAPID_PRIVATE_KEY=IhrPrivateKey...
DATABASE_URL=postgresql://localhost/lanparty2026
```

**Wichtig:** Fügen Sie `.env` zu `.gitignore` hinzu:
```bash
echo ".env" >> .gitignore
```

## Troubleshooting

### "Push notifications not working in production"
- Prüfen Sie, ob die VAPID-Keys auf Vercel gesetzt sind
- Stellen Sie sicher, dass alle Environments (Production, Preview, Development) ausgewählt wurden
- Testen Sie mit: `console.log(process.env.VAPID_PUBLIC_KEY)` in der API

### "Using default VAPID keys"
- Die Umgebungsvariablen sind nicht gesetzt oder haben den falschen Namen
- Prüfen Sie die Schreibweise: `VAPID_PUBLIC_KEY` (genau so, mit Unterstrichen)

### "Invalid VAPID keys"
- Die Keys wurden beim Kopieren beschädigt
- Generieren Sie neue Keys und fügen Sie sie vorsichtig ein
- Achten Sie auf zusätzliche Leerzeichen am Anfang/Ende

## Weitere Informationen

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Web Push VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)
