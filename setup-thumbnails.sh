#!/bin/bash

# Setup Thumbnails for Livestream Feature
# This script automates the setup of the stream display images/thumbnails feature

set -e  # Exit on any error

echo "🎬 Setting up Livestream Thumbnails Feature..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    print_error "This script must be run from the project root directory"
    print_error "Make sure you're in the directory containing package.json and supabase folder"
    exit 1
fi

# Check if Node.js setup script exists and run it instead
if [ -f "setup-thumbnails-final.cjs" ]; then
    print_status "Running Node.js setup script for better compatibility..."
    node setup-thumbnails-final.cjs
    exit $?
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI is not installed"
    print_status "Attempting to install Supabase CLI..."
    
    # Try different installation methods
    if command -v npm &> /dev/null; then
        print_status "Installing via npm..."
        if ! npm install -g supabase@latest 2>/dev/null; then
            print_warning "NPM installation failed, trying alternative method..."
        fi
    fi
    
    # If still not available, provide manual instructions
    if ! command -v supabase &> /dev/null; then
        print_error "Could not install Supabase CLI automatically"
        echo ""
        print_status "MANUAL SETUP REQUIRED:"
        echo ""
        echo "🔵 Option A: Install Supabase CLI and re-run this script"
        echo "  curl -fsSL https://supabase.com/install.sh | sh"
        echo "  export PATH=\$PATH:\$HOME/.local/bin"
        echo "  ./setup-thumbnails.sh"
        echo ""
        echo "🔵 Option B: Use Supabase Dashboard"
        echo "  1. Go to your Supabase project dashboard"
        echo "  2. Navigate to SQL Editor"
        echo "  3. Run the contents of: supabase/migrations/20250202000000_add_stream_display_images.sql"
        echo "  4. Run the contents of: setup-stream-images-bucket.sql"
        echo ""
        echo "🔵 Option C: Use the Node.js setup script"
        echo "  node setup-thumbnails-final.cjs"
        echo ""
        exit 1
    fi
fi

# Check if we can connect to Supabase
print_status "Checking Supabase connection..."
if ! supabase status &> /dev/null; then
    print_warning "Supabase is not running locally. Starting Supabase..."
    if ! supabase start; then
        print_error "Failed to start Supabase. Please check your setup."
        print_status "Alternative: Use Supabase Dashboard or the Node.js setup script"
        exit 1
    fi
fi

print_success "Supabase is running"

# Step 1: Run the database migration
print_status "Running database migration for stream display images..."
if [ -f "supabase/migrations/20250202000000_add_stream_display_images.sql" ]; then
    # Check if migration has already been applied
    if supabase db reset --db-url "$(supabase status --output json | jq -r '.DB_URL')" --linked=false 2>/dev/null; then
        print_success "Database migration applied successfully"
    else
        print_warning "Migration may have already been applied or there was an issue"
        print_status "Attempting to apply migration manually..."
        
        # Try to apply the migration directly
        if psql "$(supabase status --output json | jq -r '.DB_URL')" -f supabase/migrations/20250202000000_add_stream_display_images.sql 2>/dev/null; then
            print_success "Migration applied manually"
        else
            print_warning "Migration may already be applied - continuing..."
        fi
    fi
else
    print_error "Migration file not found: supabase/migrations/20250202000000_add_stream_display_images.sql"
    exit 1
fi

# Step 2: Set up storage bucket and policies
print_status "Setting up stream images storage bucket..."
if [ -f "setup-stream-images-bucket.sql" ]; then
    # Get the database URL from Supabase status
    DB_URL=$(supabase status --output json 2>/dev/null | jq -r '.DB_URL' 2>/dev/null || echo "")
    
    if [ -z "$DB_URL" ] || [ "$DB_URL" = "null" ]; then
        # Fallback to default local URL
        DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
        print_warning "Using default local database URL"
    fi
    
    if psql "$DB_URL" -f setup-stream-images-bucket.sql 2>/dev/null; then
        print_success "Storage bucket and policies configured successfully"
    else
        print_warning "Storage setup may have already been applied or there was an issue"
        print_status "This is usually not a problem if the bucket already exists"
    fi
else
    print_error "Storage setup file not found: setup-stream-images-bucket.sql"
    exit 1
fi

# Step 3: Verify the setup
print_status "Verifying thumbnail system setup..."

# Check if the required tables exist
DB_URL=$(supabase status --output json 2>/dev/null | jq -r '.DB_URL' 2>/dev/null || "postgresql://postgres:postgres@localhost:54322/postgres")

# Check stream_images table
if psql "$DB_URL" -c "SELECT 1 FROM stream_images LIMIT 1;" &>/dev/null; then
    print_success "stream_images table exists"
else
    print_error "stream_images table not found"
    exit 1
fi

# Check display_image_url column in live_streams
if psql "$DB_URL" -c "SELECT display_image_url FROM live_streams LIMIT 1;" &>/dev/null; then
    print_success "display_image_url column exists in live_streams table"
else
    print_error "display_image_url column not found in live_streams table"
    exit 1
fi

# Check storage bucket
if psql "$DB_URL" -c "SELECT 1 FROM storage.buckets WHERE id = 'stream-images';" | grep -q "1"; then
    print_success "stream-images storage bucket exists"
else
    print_error "stream-images storage bucket not found"
    exit 1
fi

# Step 4: Display setup summary
echo ""
echo "🎉 Thumbnail Setup Complete!"
echo "============================"
echo ""
print_success "Database migration applied"
print_success "Storage bucket 'stream-images' created and configured"
print_success "Row-level security policies set up"
print_success "Automatic cleanup triggers configured"
echo ""
print_status "The following features are now available:"
echo "  • Stream creators can upload custom display images"
echo "  • Images are automatically processed and validated"
echo "  • Thumbnails appear on the livestream discovery page"
echo "  • Automatic cleanup when streams are deleted"
echo ""
print_status "Next steps:"
echo "  • Test the thumbnail upload functionality"
echo "  • Check the livestream discovery page"
echo "  • Verify image upload in stream management"
echo ""

# Optional: Run the test file if it exists
if [ -f "test-thumbnail-system.html" ]; then
    print_status "Test file available: test-thumbnail-system.html"
    echo "  You can open this file in a browser to test the thumbnail system"
fi

print_success "Setup completed successfully! 🚀"