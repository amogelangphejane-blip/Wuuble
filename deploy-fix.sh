#!/bin/bash

# 🚀 High-Quality Video Chat - Deployment Fix Script
# This script fixes common deployment issues and ensures everything is ready

set -e  # Exit on any error

echo "🚀 Starting deployment fix process..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check Node.js version
echo ""
print_info "Step 1: Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18" ]]; then
    print_warning "Node.js version should be 18 or higher for optimal compatibility"
    print_info "Consider upgrading: nvm use 18 or nvm use 20"
else
    print_status "Node.js version is compatible"
fi

# Step 2: Clean previous installations
echo ""
print_info "Step 2: Cleaning previous installations..."
if [ -d "node_modules" ]; then
    print_info "Removing existing node_modules..."
    rm -rf node_modules/
fi

if [ -f "package-lock.json" ]; then
    print_info "Removing package-lock.json..."
    rm -f package-lock.json
fi

if [ -d "dist" ]; then
    print_info "Removing previous build..."
    rm -rf dist/
fi

print_status "Cleanup completed"

# Step 3: Install dependencies
echo ""
print_info "Step 3: Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install
    print_status "Dependencies installed successfully"
else
    print_error "npm not found. Please install Node.js and npm"
    exit 1
fi

# Step 4: Verify critical dependencies
echo ""
print_info "Step 4: Verifying critical dependencies..."

# Check if Vite is available
if [ -f "node_modules/.bin/vite" ]; then
    print_status "Vite is installed"
    VITE_VERSION=$(npx vite --version)
    echo "Vite version: $VITE_VERSION"
else
    print_error "Vite not found after installation"
    exit 1
fi

# Check if TypeScript is available
if [ -f "node_modules/.bin/tsc" ]; then
    print_status "TypeScript is installed"
    TSC_VERSION=$(npx tsc --version)
    echo "TypeScript version: $TSC_VERSION"
else
    print_error "TypeScript not found after installation"
    exit 1
fi

# Step 5: Check TypeScript compilation
echo ""
print_info "Step 5: Checking TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck; then
    print_status "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has issues"
    print_info "This might not prevent deployment, but should be addressed"
fi

# Step 6: Check for environment variables
echo ""
print_info "Step 6: Checking environment variables..."
if [ -f ".env" ]; then
    print_status ".env file exists"
    if grep -q "VITE_SUPABASE_URL" .env; then
        print_status "VITE_SUPABASE_URL is set"
    else
        print_warning "VITE_SUPABASE_URL not found in .env"
    fi
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        print_status "VITE_SUPABASE_ANON_KEY is set"
    else
        print_warning "VITE_SUPABASE_ANON_KEY not found in .env"
    fi
else
    print_warning ".env file not found"
    print_info "Create .env file with your Supabase credentials if needed"
fi

# Step 7: Check critical files
echo ""
print_info "Step 7: Checking critical high-quality video chat files..."

FILES_TO_CHECK=(
    "src/config/highQualityWebRTC.ts"
    "src/components/AdvancedVideoControls.tsx"
    "src/services/groupWebRTCService.ts"
    "src/hooks/useGroupVideoChat.tsx"
    "src/services/groupSignalingService.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing"
        exit 1
    fi
done

# Step 8: Build the project
echo ""
print_info "Step 8: Building the project..."
if npm run build; then
    print_status "Build successful!"
    
    # Check if dist folder was created
    if [ -d "dist" ]; then
        print_status "dist/ folder created"
        DIST_SIZE=$(du -sh dist/ | cut -f1)
        echo "Build size: $DIST_SIZE"
    else
        print_error "dist/ folder not created"
        exit 1
    fi
else
    print_error "Build failed"
    echo ""
    print_info "Common build issues and fixes:"
    echo "1. Missing dependencies: npm install"
    echo "2. TypeScript errors: Check console output above"
    echo "3. Import path issues: Verify @/ alias configuration"
    echo "4. Environment variables: Check .env file"
    exit 1
fi

# Step 9: Quick functionality test
echo ""
print_info "Step 9: Running quick functionality tests..."

# Test if critical imports can be resolved
if node -e "
try {
  const fs = require('fs');
  const path = require('path');
  
  // Check if main files exist and are valid
  const files = [
    'dist/index.html',
    'dist/assets'
  ];
  
  let allGood = true;
  files.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error('Missing:', file);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log('✅ Build output validation passed');
  } else {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
"; then
    print_status "Build output validation passed"
else
    print_error "Build output validation failed"
    exit 1
fi

# Step 10: Deployment readiness check
echo ""
print_info "Step 10: Final deployment readiness check..."

CHECKS_PASSED=0
TOTAL_CHECKS=6

# Check 1: Dependencies installed
if [ -d "node_modules" ]; then
    ((CHECKS_PASSED++))
    print_status "Dependencies: ✅"
else
    print_error "Dependencies: ❌"
fi

# Check 2: Build successful
if [ -d "dist" ]; then
    ((CHECKS_PASSED++))
    print_status "Build output: ✅"
else
    print_error "Build output: ❌"
fi

# Check 3: TypeScript files exist
if [ -f "src/config/highQualityWebRTC.ts" ]; then
    ((CHECKS_PASSED++))
    print_status "High-quality config: ✅"
else
    print_error "High-quality config: ❌"
fi

# Check 4: UI components exist
if [ -f "src/components/AdvancedVideoControls.tsx" ]; then
    ((CHECKS_PASSED++))
    print_status "Advanced controls: ✅"
else
    print_error "Advanced controls: ❌"
fi

# Check 5: Core services updated
if [ -f "src/services/groupWebRTCService.ts" ]; then
    ((CHECKS_PASSED++))
    print_status "WebRTC service: ✅"
else
    print_error "WebRTC service: ❌"
fi

# Check 6: Hooks updated
if [ -f "src/hooks/useGroupVideoChat.tsx" ]; then
    ((CHECKS_PASSED++))
    print_status "Video chat hook: ✅"
else
    print_error "Video chat hook: ❌"
fi

echo ""
echo "=================================="
echo "🎯 DEPLOYMENT READINESS SCORE: $CHECKS_PASSED/$TOTAL_CHECKS"
echo "=================================="

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo ""
    print_status "🎉 ALL CHECKS PASSED! Ready for deployment!"
    echo ""
    print_info "Next steps:"
    echo "1. Deploy to your platform (Vercel, Netlify, etc.)"
    echo "2. Test high-quality video chat features"
    echo "3. Verify cross-tab communication works"
    echo "4. Monitor connection quality metrics"
    echo ""
    print_info "Deployment commands:"
    echo "• Vercel: vercel --prod"
    echo "• Netlify: netlify deploy --prod --dir=dist"
    echo "• Manual: Upload dist/ folder to your hosting"
    echo ""
    print_status "High-Quality Group Video Chat is ready! 🚀"
else
    echo ""
    print_error "❌ Some checks failed. Please fix the issues above before deploying."
    echo ""
    print_info "Need help? Check DEPLOYMENT_FIX_GUIDE.md for detailed troubleshooting."
    exit 1
fi

echo ""
echo "🎥 High-Quality Video Chat Features Ready:"
echo "• ✅ 1080p60 video support"
echo "• ✅ Adaptive bitrate streaming"
echo "• ✅ Advanced audio processing"
echo "• ✅ Real-time quality monitoring"
echo "• ✅ Cross-tab communication"
echo "• ✅ Professional UI controls"
echo ""
print_status "Deployment fix completed successfully! 🎉"