@echo off
set PROJECT=C:\Users\paisl\OneDrive\Documents\GitHub\AirlineEmpire

cd /d "%PROJECT%"

echo Starting Airline Empire Development Server...
echo.

call npm.cmd run dev

pause