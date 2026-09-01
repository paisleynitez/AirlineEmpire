@echo off
rem Serve Airline Empire at http://localhost:8123 so Claude in Chrome can see and drive the game.
rem Double-click this file, leave the window open while playing, close it when done.
cd /d "%~dp0game"
echo Starting Airline Empire at http://localhost:8123 ...
start "" http://localhost:8123/index.html

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8123
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8123
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p 8123 -c-1 .
  goto :eof
)

echo.
echo Could not find Python or Node on this PC. Install either one, then run this again.
pause
