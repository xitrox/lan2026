#!/bin/bash

echo "========================================"
echo "LAN Party 2026 - PWA Setup"
echo "========================================"
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Check if database connection is configured
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
    echo ""
    echo "⚠️  WARNING: No database connection string found!"
    echo "Please set DATABASE_URL or POSTGRES_URL environment variable."
    echo ""
    read -p "Do you want to enter a connection string now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter PostgreSQL connection string: " CONN_STRING
        export DATABASE_URL="$CONN_STRING"
    else
        echo "Skipping database migration. You can run it manually later with:"
        echo "  psql \"your_connection_string\" -f migrations/add_notifications.sql"
        echo ""
    fi
fi

# 3. Run database migration
if [ ! -z "$DATABASE_URL" ] || [ ! -z "$POSTGRES_URL" ]; then
    echo ""
    echo "🗄️  Running database migrations..."

    CONN="${DATABASE_URL:-$POSTGRES_URL}"

    if command -v psql &> /dev/null; then
        psql "$CONN" -f migrations/add_notifications.sql
        if [ $? -eq 0 ]; then
            echo "✅ Database migration completed successfully!"
        else
            echo "❌ Database migration failed. Please check your connection string."
        fi
    else
        echo "⚠️  psql command not found. Please install PostgreSQL client or run migration manually:"
        echo "  psql \"your_connection_string\" -f migrations/add_notifications.sql"
    fi
fi

# 4. Generate VAPID keys (optional)
echo ""
read -p "Do you want to generate VAPID keys for push notifications? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔑 Generating VAPID keys..."
    npx web-push generate-vapid-keys
    echo ""
    echo "⚠️  IMPORTANT: Save these keys as environment variables!"
    echo "Add to your .env file or Vercel environment variables:"
    echo "  VAPID_PUBLIC_KEY=<public_key>"
    echo "  VAPID_PRIVATE_KEY=<private_key>"
else
    echo "ℹ️  Using default VAPID keys (development only)."
    echo "For production, generate keys with: npx web-push generate-vapid-keys"
fi

# 5. Check for icons
echo ""
echo "🎨 Checking for PWA icons..."
ICON_COUNT=$(find icons -name "icon-*.png" 2>/dev/null | wc -l)

if [ "$ICON_COUNT" -eq 0 ]; then
    echo "⚠️  No PWA icons found in /icons/ directory."
    echo "The app will work, but icons won't be displayed properly."
    echo ""
    echo "To create icons, see: PWA_SETUP.md"
    echo "Quick option: Use https://www.pwabuilder.com/imageGenerator"
else
    echo "✅ Found $ICON_COUNT icon file(s)."
fi

# Done
echo ""
echo "========================================"
echo "✅ PWA Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start development server: npm run dev"
echo "2. Open https://localhost:3000 in your browser"
echo "3. Navigate to Profile tab and enable notifications"
echo "4. Install the PWA to your home screen"
echo ""
echo "📚 For more information, see: PWA_SETUP.md"
echo ""
