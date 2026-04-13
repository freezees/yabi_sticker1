@echo off
title GitHub Upload

echo ========================================
echo    GitHub One-Click Upload
echo ========================================
echo.

git status > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a Git repository!
    pause
    exit /b
)

echo [1/4] Checking changes...
git status --short
echo.

set /p msg="Commit message (Enter for default): "
if "%msg%"=="" set msg=Update files

echo.
echo [2/4] Adding files...
git add .
echo Done!

echo.
echo [3/4] Committing...
git commit -m "%msg%"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo    UPLOAD SUCCESSFUL!
echo ========================================
echo.
timeout /t 5