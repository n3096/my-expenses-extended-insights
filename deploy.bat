@echo off
echo.
echo ===================================================
echo  Starting WSL to run the deployment script...
echo ===================================================
echo.

rem Fuehrt das deploy.sh Skript innerhalb der WSL-Umgebung aus.
wsl ./deploy.sh

echo.
echo ===================================================
echo  Script finished. Press any key to exit.
echo ===================================================
pause >nul