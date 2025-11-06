#!/bin/bash

# DeltaScan Installation Script
# Automates the setup process for the DeltaScan prediction market arbitrage platform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji support (check if terminal supports it)
if [[ "$TERM" =~ "xterm" ]] || [[ "$TERM" =~ "screen" ]]; then
    CHECK_MARK="✓"
    CROSS_MARK="✗"
    ROCKET="🚀"
    PACKAGE="📦"
    WRENCH="🔧"
    MAGNIFY="🔍"
else
    CHECK_MARK="[OK]"
    CROSS_MARK="[FAIL]"
    ROCKET=">>>"
    PACKAGE="***"
    WRENCH=">>>"
    MAGNIFY="..."
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║         ${GREEN}DeltaScan Installation Script${BLUE}              ║${NC}"
echo -e "${BLUE}║    Prediction Market Arbitrage Platform Setup         ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "\n${BLUE}${WRENCH} $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}${CHECK_MARK} $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}${CROSS_MARK} $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check Prerequisites
print_step "Step 1/7: Checking Prerequisites ${MAGNIFY}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="18.0.0"

    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Node.js $NODE_VERSION installed"
    else
        print_error "Node.js version $NODE_VERSION is too old. Required: >= $REQUIRED_VERSION"
        echo ""
        echo "Please upgrade Node.js:"
        echo "  macOS: brew upgrade node"
        echo "  Ubuntu/Debian: https://github.com/nodesource/distributions"
        echo "  Windows: Download from https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    echo ""
    echo "Please install Node.js >= 18.0.0:"
    echo "  macOS: brew install node@18"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  Windows: Download from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check git (optional but recommended)
if command_exists git; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "git $GIT_VERSION installed"
else
    print_warning "git is not installed (optional but recommended)"
fi

# Step 2: Install Dependencies
print_step "Step 2/7: Installing Dependencies ${PACKAGE}"

print_info "This may take 1-2 minutes..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    echo ""
    echo "Try running manually:"
    echo "  npm install"
    exit 1
fi

# Step 3: Build Shared Package
print_step "Step 3/7: Building Shared Package ${WRENCH}"

print_info "Building TypeScript types..."
cd packages/shared
if npm run build; then
    print_success "Shared package built successfully"
else
    print_error "Failed to build shared package"
    echo ""
    echo "Try running manually:"
    echo "  cd packages/shared"
    echo "  npm run build"
    exit 1
fi
cd ../..

# Step 4: Set Up Environment Files
print_step "Step 4/7: Setting Up Environment Files ${WRENCH}"

# Server .env
if [ ! -f "packages/server/.env" ]; then
    if [ -f "packages/server/.env.example" ]; then
        cp packages/server/.env.example packages/server/.env
        print_success "Created packages/server/.env"
    else
        print_warning "packages/server/.env.example not found, skipping"
    fi
else
    print_info "packages/server/.env already exists, skipping"
fi

# Client .env
if [ ! -f "packages/client/.env" ]; then
    if [ -f "packages/client/.env.example" ]; then
        cp packages/client/.env.example packages/client/.env
        print_success "Created packages/client/.env"
    else
        print_warning "packages/client/.env.example not found, skipping"
    fi
else
    print_info "packages/client/.env already exists, skipping"
fi

# Step 5: Verify Installation
print_step "Step 5/7: Verifying Installation ${MAGNIFY}"

print_info "Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript type check reported issues (this may be okay)"
    echo ""
    echo "Run this command to see details:"
    echo "  npm run type-check"
fi

# Step 6: Check Polymarket API
print_step "Step 6/7: Checking Polymarket API Connection ${MAGNIFY}"

print_info "Testing connection to Polymarket Gamma API..."
if command_exists curl; then
    if curl -s --connect-timeout 5 https://gamma-api.polymarket.com/health > /dev/null 2>&1; then
        print_success "Polymarket API is accessible"
    else
        print_warning "Could not connect to Polymarket API (check your internet connection)"
    fi
else
    print_info "curl not found, skipping API check"
fi

# Step 7: Summary
print_step "Step 7/7: Installation Complete! ${ROCKET}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║              ${CHECK_MARK} Installation Successful! ${CHECK_MARK}              ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BLUE}${ROCKET} Next Steps:${NC}"
echo ""
echo "1. Start the development server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Access the application:"
echo "   • Server:  http://localhost:3001"
echo "   • Client:  http://localhost:3000"
echo ""
echo "3. Test API endpoints:"
echo -e "   ${GREEN}curl http://localhost:3001/api/health${NC}"
echo -e "   ${GREEN}curl http://localhost:3001/api/markets/trending?limit=5${NC}"
echo ""
echo "4. Read the documentation:"
echo "   • docs/TESTING_GUIDE.md - Testing instructions"
echo "   • docs/SYSTEM_OVERVIEW.md - Architecture overview"
echo "   • docs/INSTALLATION.md - Detailed installation guide"
echo ""

echo -e "${BLUE}${PACKAGE} Available Commands:${NC}"
echo ""
echo "  npm run dev              # Start both client and server"
echo "  npm run dev:server       # Start server only (port 3001)"
echo "  npm run dev:client       # Start client only (port 3000)"
echo "  npm run build            # Build all packages"
echo "  npm run type-check       # Check TypeScript"
echo "  npm run clean            # Clean build artifacts"
echo ""

echo -e "${BLUE}${MAGNIFY} Quick Test:${NC}"
echo ""
echo "Run this in a new terminal after starting the server:"
echo -e "  ${GREEN}curl http://localhost:3001/api/health${NC}"
echo ""

echo -e "${GREEN}Happy arbitrage hunting! ${ROCKET}${NC}"
echo ""

# Check if we should auto-start (optional)
read -p "Would you like to start the development server now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Starting development server..."
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    npm run dev
fi

exit 0
