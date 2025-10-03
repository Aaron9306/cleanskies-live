@echo off
REM CleanSkies Live Setup Script for Windows
REM This script sets up the development environment

echo 🚀 Setting up CleanSkies Live...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed. You'll need it for local development.
    echo Install Node.js 18+ from https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js is installed: %NODE_VERSION%
)

REM Create environment file
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy env.example .env >nul
    echo [SUCCESS] .env file created
    echo [WARNING] Please update .env with your actual configuration values
) else (
    echo [SUCCESS] .env file already exists
)

REM Install dependencies
echo [INFO] Installing dependencies...

if exist package.json (
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install root dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Root dependencies installed
)

if exist server\package.json (
    cd server
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install server dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Server dependencies installed
)

if exist client\package.json (
    cd client
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install client dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Client dependencies installed
)

REM Build Docker images
echo [INFO] Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    exit /b 1
)
echo [SUCCESS] Docker images built

REM Start services
echo [INFO] Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)
echo [SUCCESS] Services started

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Some services failed to start. Check logs with: docker-compose logs
    pause
    exit /b 1
)
echo [SUCCESS] All services are running

REM Display access information
echo.
echo 🎉 Setup complete!
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   MongoDB: localhost:27017
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart services: docker-compose restart
echo   Rebuild and restart: docker-compose up --build -d
echo.
echo Next steps:
echo   1. Update .env with your Mapbox token
echo   2. Configure your API keys in .env
echo   3. Visit http://localhost:3000 to see the app
echo.
pause
