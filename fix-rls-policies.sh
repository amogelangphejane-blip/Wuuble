#!/bin/bash

# RLS Policy Fix Script
# This script helps apply the RLS policy fixes to your Supabase database

echo "🔧 RLS Policy Fix Script"
echo "========================"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "🔄 Alternative: Apply migrations manually in your Supabase dashboard"
    echo "   1. Go to your Supabase dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Run the following migrations in order:"
    echo "      - supabase/migrations/20250108000001_comprehensive_rls_fix.sql"
    echo "      - supabase/migrations/20250108000002_validate_rls_policies.sql"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo "   Please run this script from your project root"
    exit 1
fi

echo "✅ Supabase project detected"

# Check Supabase status
echo ""
echo "📊 Checking Supabase status..."
supabase status

# Ask for confirmation
echo ""
echo "🚨 This will apply RLS policy fixes to your database"
echo "   This will:"
echo "   - Drop existing conflicting policies"
echo "   - Create new non-recursive policies"
echo "   - Fix storage bucket policies"
echo "   - Validate the changes"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

# Apply the comprehensive fix
echo ""
echo "🔧 Applying comprehensive RLS fix..."
if supabase db push; then
    echo "✅ RLS policies updated successfully"
else
    echo "❌ Failed to apply migrations"
    echo "   Please check the error messages above"
    echo "   You may need to apply the migrations manually"
    exit 1
fi

# Run validation
echo ""
echo "🔍 Validating RLS policies..."
echo "   You can also run the validation migration manually in your Supabase dashboard"

echo ""
echo "✅ RLS Policy Fix Complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test your application functionality"
echo "   2. Use the StoragePolicyTest component in Profile Settings"
echo "   3. Check that communities, posts, and storage work correctly"
echo "   4. Monitor for any remaining policy violations"
echo ""
echo "📚 For troubleshooting, see: RLS_TROUBLESHOOTING_GUIDE.md"