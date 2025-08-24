#!/bin/bash

# Live Stream Thumbnail System Setup Script
# This script helps set up and troubleshoot the thumbnail system

set -e

echo "🔧 Live Stream Thumbnail System Setup"
echo "====================================="

# Check if we have the necessary files
if [ ! -f "fix-thumbnail-system.sql" ]; then
    echo "❌ fix-thumbnail-system.sql not found!"
    echo "Make sure you're running this from the project root directory."
    exit 1
fi

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "⚠️  Database connection not configured"
    echo ""
    echo "Please set one of these environment variables:"
    echo "  DATABASE_URL=postgresql://user:pass@host:port/dbname"
    echo "  SUPABASE_DB_URL=postgresql://postgres:pass@db.project.supabase.co:5432/postgres"
    echo ""
    echo "Or provide connection details manually:"
    read -p "Database host: " DB_HOST
    read -p "Database port (5432): " DB_PORT
    read -p "Database name: " DB_NAME
    read -p "Database user: " DB_USER
    read -s -p "Database password: " DB_PASS
    echo ""
    
    DB_PORT=${DB_PORT:-5432}
    DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
fi

# Use SUPABASE_DB_URL if DATABASE_URL is not set
if [ -z "$DATABASE_URL" ] && [ -n "$SUPABASE_DB_URL" ]; then
    DATABASE_URL=$SUPABASE_DB_URL
fi

echo ""
echo "🔍 Step 1: Testing database connection..."
if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "Please check your connection details and try again."
        exit 1
    fi
else
    echo "⚠️  psql not found. Skipping connection test."
    echo "Make sure you have PostgreSQL client installed."
fi

echo ""
echo "🗄️  Step 2: Applying database fixes..."
echo "Running fix-thumbnail-system.sql..."

if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -f fix-thumbnail-system.sql; then
        echo "✅ Database fixes applied successfully"
    else
        echo "❌ Failed to apply database fixes"
        echo "Check the error messages above and try again."
        exit 1
    fi
else
    echo "❌ psql not found. Cannot apply database fixes."
    echo "Please install PostgreSQL client or apply the SQL manually:"
    echo "  psql your-database-url -f fix-thumbnail-system.sql"
    exit 1
fi

echo ""
echo "📊 Step 3: Checking system status..."
psql "$DATABASE_URL" -c "SELECT * FROM get_thumbnail_stats();" 2>/dev/null || echo "⚠️  Could not get thumbnail stats"

echo ""
echo "🧪 Step 4: Testing tools available..."

# Check if Node.js is available for debugging script
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js available for debugging script"
    if [ -f "debug-thumbnail-issues.js" ]; then
        echo "   Run: SUPABASE_URL=your-url SUPABASE_ANON_KEY=your-key node debug-thumbnail-issues.js"
    fi
else
    echo "⚠️  Node.js not found. Debug script won't work."
fi

# Check if npm is available for the React app
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm available for React app"
    echo "   Run: npm run dev (then visit /debug-thumbnails if you added the debugger)"
else
    echo "⚠️  npm not found. React debugging component won't work."
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start your application: npm run dev"
echo "2. Log in as a user who owns a stream"
echo "3. Try uploading a thumbnail"
echo "4. If issues persist, use the debugging tools:"
echo "   - Open test-thumbnail-system.html in a browser"
echo "   - Run the Node.js debug script"
echo "   - Use the ThumbnailDebugger component"
echo ""
echo "📖 For detailed troubleshooting, see:"
echo "   THUMBNAIL_TROUBLESHOOTING_GUIDE.md"
echo ""
echo "🆘 If you need help:"
echo "   - Check browser console for errors"
echo "   - Look at Supabase logs"
echo "   - Verify storage bucket policies"
echo "   - Ensure user authentication is working"

# Make the script executable
chmod +x "$0" 2>/dev/null || true