#!/bin/bash

# CleanSkies Live Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up CleanSkies Live..."

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed (for local development)
check_node() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. You'll need it for local development."
        print_warning "Install Node.js 18+ from https://nodejs.org/"
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    fi
}

# Create environment file
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp env.example .env
        print_success ".env file created"
        print_warning "Please update .env with your actual configuration values"
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f package.json ]; then
        npm install
        print_success "Root dependencies installed"
    fi
    
    # Install server dependencies
    if [ -f server/package.json ]; then
        cd server
        npm install
        cd ..
        print_success "Server dependencies installed"
    fi
    
    # Install client dependencies
    if [ -f client/package.json ]; then
        cd client
        npm install
        cd ..
        print_success "Client dependencies installed"
    fi
}

# Build Docker images
build_docker() {
    print_status "Building Docker images..."
    docker-compose build
    print_success "Docker images built"
}

# Start services
start_services() {
    print_status "Starting services..."
    docker-compose up -d
    print_success "Services started"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "All services are running"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Display access information
show_access_info() {
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Access the application:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  MongoDB: localhost:27017"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Rebuild and restart: docker-compose up --build -d"
    echo ""
    echo "Next steps:"
    echo "  1. Update .env with your Mapbox token"
    echo "  2. Configure your API keys in .env"
    echo "  3. Visit http://localhost:3000 to see the app"
    echo ""
}

# Main setup function
main() {
    echo "🌍 CleanSkies Live Setup"
    echo "========================"
    echo ""
    
    check_docker
    check_node
    setup_env
    install_dependencies
    build_docker
    start_services
    show_access_info
}

# Run main function
main "$@"
