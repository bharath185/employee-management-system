@echo off
setlocal
cd /d %~dp0
echo =========================================================================
echo PRIGENIX EMPLOYEE MANAGEMENT SYSTEM - PRODUCTION INSTALLER BUILD PIPELINE
echo =========================================================================
echo.

python build_installer.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installer build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =========================================================================
echo BUILD SUCCESSFUL!
echo Single-File Installer: %~dp0dist_installer\EMS_Setup_v1.0.exe
echo Web Portal: http://ems.parikar.com:8085
echo =========================================================================
pause
