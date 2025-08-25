#!/bin/bash

# Thumbnail System Setup Script
# This script applies the SQL fixes and runs diagnostics

echo "🔧 Setting up thumbnail system..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Source environment variables
source .env

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY"
    echo "Please set these in your .env file."
    exit 1
fi

echo "✅ Environment variables loaded"

# Apply SQL fixes
echo "📝 Applying SQL fixes..."
if command -v psql &> /dev/null; then
    # If psql is available, try to run the SQL script
    echo "Using psql to apply fixes..."
    # Note: You'll need to replace this with your actual database connection
    # psql "$DATABASE_URL" -f fix-thumbnail-system.sql
    echo "⚠️  Please run the SQL script manually in your Supabase SQL editor:"
    echo "   1. Open Supabase Dashboard > SQL Editor"
    echo "   2. Copy and paste the contents of fix-thumbnail-system.sql"
    echo "   3. Run the script"
else
    echo "⚠️  psql not found. Please run the SQL script manually:"
    echo "   1. Open Supabase Dashboard > SQL Editor"
    echo "   2. Copy and paste the contents of fix-thumbnail-system.sql"
    echo "   3. Run the script"
fi

# Run diagnostic
echo "🔍 Running thumbnail diagnostic..."
if command -v node &> /dev/null; then
    if [ -f "node_modules/@supabase/supabase-js/package.json" ]; then
        node test-and-fix-thumbnails.js --fix
    else
        echo "⚠️  @supabase/supabase-js not installed. Run 'npm install' first."
        echo "   Then run: node test-and-fix-thumbnails.js --fix"
    fi
else
    echo "⚠️  Node.js not found. Please install Node.js to run the diagnostic."
fi

# Instructions
echo ""
echo "📋 Manual steps to complete setup:"
echo "1. Open your Supabase dashboard"
echo "2. Go to Storage > Policies"
echo "3. Ensure stream-thumbnails bucket exists and is public"
echo "4. Test thumbnail upload in your application"
echo "5. Use the web diagnostic: http://localhost:8080/diagnose-thumbnail-issue.html"
echo ""
echo "🎉 Setup script completed!"