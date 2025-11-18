# LAN Party 2026 - Database Setup

## Status: ✅ Vollständig eingerichtet

Die Datenbank ist erfolgreich konfiguriert und mit Test-Daten gefüllt!

## 📊 Datenbankstruktur

### Tabellen

1. **users** - Benutzerkonten
   - id, username, email, password_hash, is_admin, created_at
   - ✓ 2 Test-Users (admin/testuser)

2. **event_data** - Event-Informationen
   - id, title, event_date, location, max_participants, registration_password
   - ✓ 1 Event konfiguriert

3. **cabins** - Hütten-Vorschläge
   - id, name, url, image_url, description, created_by
   - ✓ 3 Hütten angelegt

4. **cabin_votes** - Hütten-Votes
   - id, user_id, cabin_id, created_at
   - ✓ 3 Votes

5. **games** - Spiel-Vorschläge
   - id, name, created_by, created_at
   - ✓ 5 Spiele angelegt

6. **game_votes** - Spiel-Votes
   - id, user_id, game_id, created_at
   - ✓ 5 Votes

7. **messages** - Chat-Nachrichten
   - id, user_id, content, created_at, updated_at
   - ✓ 3 Nachrichten

## 🔧 Scripts

### Database Migration
```bash
npm run db:migrate
```
Wendet das Schema (db/schema.sql) auf die Datenbank an.

### Database Seeding
```bash
npm run db:seed
```
Fügt Test-Daten hinzu:
- Admin-User: admin / admin123
- Test-User: testuser / test123
- 3 Hütten mit Beispiel-Daten
- 5 Spiele (inkl. Enemy Territory)
- 3 Chat-Nachrichten

### Komplettes Setup
```bash
npm run db:setup
```
Führt Migration + Seeding in einem Schritt aus.

## 🌐 API Endpoints

Alle API-Endpoints sind implementiert und bereit:

### Authentication (`/api/auth`)
- ✅ POST `?action=login` - Login
- ✅ POST `?action=register` - Registrierung
- ✅ GET `?action=verify` - Token-Verifizierung
- ✅ POST `?action=update-profile` - Profil aktualisieren

### Event (`/api/event`)
- ✅ GET `?action=get` - Event-Daten abrufen
- ✅ PUT `?action=update` - Event-Daten aktualisieren (Admin)

### Cabins (`/api/cabins`)
- ✅ GET `?action=list` - Hütten auflisten
- ✅ POST `?action=add` - Hütte hinzufügen (Admin)
- ✅ POST `?action=vote` - Für Hütte voten
- ✅ DELETE `?action=delete` - Hütte löschen (Admin)

### Games (`/api/games`)
- ✅ GET `?action=list` - Spiele auflisten
- ✅ POST `?action=add` - Spiel hinzufügen
- ✅ POST `?action=vote` - Für Spiel voten
- ✅ DELETE `?action=delete` - Spiel löschen (Admin)

### Messages (`/api/messages`)
- ✅ GET `?action=list` - Nachrichten auflisten
- ✅ POST `?action=post` - Nachricht senden
- ✅ PUT `?action=edit` - Nachricht bearbeiten
- ✅ DELETE `?action=delete` - Nachricht löschen

### Admin (`/api/admin`)
- ✅ GET `?action=users` - Alle User auflisten
- ✅ DELETE `?action=delete-user` - User löschen
- ✅ POST `?action=toggle-admin` - Admin-Status ändern
- ✅ POST `?action=reset-password` - Passwort zurücksetzen

## 🧪 Testing

### Lokales Testen
Die API-Endpoints benötigen die Vercel-Runtime. Zum Testen:

1. **Deploy to Vercel:**
   ```bash
   npm run deploy
   ```

2. **Oder verwende die Vercel Dev-Umgebung:**
   ```bash
   vercel dev --listen 3000
   ```

### Test-Credentials
- **Admin:** username: `admin`, password: `admin123`
- **User:** username: `testuser`, password: `test123`
- **Registration Password:** `lanparty2026`

## 📝 Nächste Schritte

1. ✅ Datenbank konfiguriert
2. ✅ Schema erstellt und migriert
3. ✅ Test-Daten hinzugefügt
4. ✅ API-Endpoints implementiert
5. 🔜 Frontend-Integration
6. 🔜 Deployment zu Vercel

## 🔐 Sicherheit

- Passwörter werden mit bcrypt gehasht (SALT_ROUNDS=10)
- JWT-Tokens für Authentication
- SQL-Injection-Schutz durch parametrisierte Queries
- CSRF-Schutz durch Token-basierte Auth
- Zugriffskontrolle (User/Admin-Rollen)

## 📚 Weitere Informationen

- **Schema:** `db/schema.sql`
- **Migration:** `db/migrate.js`
- **Seeding:** `db/seed.js`
- **Auth Library:** `lib/auth.js`
- **DB Library:** `lib/db.js`
