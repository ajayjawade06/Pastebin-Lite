@echo off
REM Pastebin Lite - Development & Deployment Script (Windows)
REM Usage: start.bat [dev|build|test|deploy]

setlocal enabledelayedexpansion

echo.
echo Pastebin Lite
echo ==============
echo.

if "%1"=="" goto dev
if "%1"=="dev" goto dev
if "%1"=="build" goto build
if "%1"=="start" goto start
if "%1"=="test" goto test
if "%1"=="test-deterministic" goto test_deterministic
if "%1"=="lint" goto lint
if "%1"=="help" goto help
if "%1"=="-h" goto help
if "%1"=="--help" goto help

echo Unknown command: %1
echo Run "start.bat help" for usage
exit /b 1

:dev
echo Starting development server...
npm run dev
exit /b %ERRORLEVEL%

:build
echo Building for production...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build complete! Ready to deploy.
)
exit /b %ERRORLEVEL%

:start
echo Starting production server...
npm run start
exit /b %ERRORLEVEL%

:test
echo Running test suite...
npm test
exit /b %ERRORLEVEL%

:test_deterministic
echo Running deterministic time tests...
setlocal
set TEST_MODE=1
npm test
exit /b %ERRORLEVEL%

:lint
echo Running linter...
npm run lint
exit /b %ERRORLEVEL%

:help
echo.
echo Commands:
echo   start.bat dev              Start development server (default)
echo   start.bat build            Build for production
echo   start.bat start            Start production server
echo   start.bat test             Run test suite
echo   start.bat test-deterministic   Run tests with TEST_MODE=1
echo   start.bat lint             Run ESLint
echo   start.bat help             Show this help message
echo.
echo Documentation:
echo   - README.md               Project overview and tech stack
echo   - QUICK_START.md          5-minute setup guide
echo   - API.md                  Complete API reference
echo   - DEPLOY.md               Deployment guide ^(Vercel, Docker, VPS^)
echo   - PROJECT_SUMMARY.md      Project structure and key features
echo.
exit /b 0
