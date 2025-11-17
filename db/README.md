# Datenbank Setup für LAN Party 2026

## Vercel Postgres einrichten

1. **Vercel Dashboard öffnen**
   - Gehe zu [vercel.com/dashboard](https://vercel.com/dashboard)
   - Wähle dein Projekt aus

2. **Postgres Datenbank erstellen**
   - Gehe zu "Storage" Tab
   - Klicke auf "Create Database"
   - Wähle "Postgres"
   - Wähle den kostenlosen Plan
   - Klicke auf "Create"

3. **Environment Variables werden automatisch gesetzt**
   Vercel setzt automatisch diese Variablen:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

4. **Schema initialisieren**

   **Option A: Über Vercel Dashboard**
   - Gehe zu Storage → Dein Postgres → Query Tab
   - Kopiere den Inhalt von `schema.sql`
   - Füge ihn ein und führe ihn aus

   **Option B: Über Vercel CLI**
   ```bash
   # Mit deinem Projekt verbinden
   vercel link

   # Datenbank-Credentials holen
   vercel env pull .env.local

   # Schema mit psql anwenden (erfordert PostgreSQL Client)
   psql $POSTGRES_URL < db/schema.sql
   ```

5. **Ersten Admin-User erstellen**
   Nach dem Deploy kannst du einen Admin-User über die API erstellen:
   ```bash
   curl -X POST https://deine-domain.vercel.app/api/admin/create-first-admin \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@example.com",
       "password": "dein-sicheres-passwort",
       "secret": "first-time-setup-secret"
     }'
   ```

## Lokale Entwicklung

Für lokale Entwicklung:

```bash
# .env.local erstellen mit deinen Vercel Postgres Credentials
vercel env pull .env.local

# Lokalen Dev-Server starten
vercel dev
```

## Standard-Passwort für Registrierung

Das Standard-Registrierungspasswort ist in `event_data.registration_password` gespeichert.

Standard-Wert: `lan2026reunion`

Dieses Passwort sollte über das Admin-Panel geändert werden!

## Tabellen-Übersicht

- **users** - Benutzer-Accounts (inklusive Admin-Flag)
- **event_data** - Event-Stammdaten (Titel, Datum, Ort, etc.)
- **cabins** - Unterkunfts-Optionen zur Abstimmung
- **cabin_votes** - Votes für Unterkünfte
- **games** - Spiele zur Abstimmung
- **game_votes** - Votes für Spiele
- **messages** - Message Board Nachrichten (ET-Style Chat)

## Sicherheit

⚠️ **Wichtig**:
- Ändere das `registration_password` nach dem ersten Setup!
- Erstelle einen starken Admin-Passwort!
- Teile das Registrierungspasswort nur über sichere Kanäle mit den Teilnehmern!
