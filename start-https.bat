@echo off
echo Starting HTTPS development server for mobile testing...
echo.
echo This will start the server with HTTPS enabled.
echo You can then access it on your phone using:
echo   https://[YOUR_IP]:3000/scanqr
echo.
echo Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do set ip=%%a
set ip=%ip: =%
echo Your IP: %ip%
echo.
echo Mobile URL: https://%ip%:3000/scanqr
echo.
echo Press any key to start the server...
pause > nul
npm run dev:https
