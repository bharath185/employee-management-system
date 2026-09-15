@echo off
setlocal
cd /d %~dp0
echo =========================================================================
echo PRIGENIX EMPLOYEE MANAGEMENT SYSTEM - 100%% STANDALONE INSTALLER BUILD
echo =========================================================================
echo.

echo [1/4] Building Angular Frontend (Standalone Mode)...
cd employee-management-ui
call npm run build -- --configuration standalone
if %ERRORLEVEL% NEQ 0 (
    echo Angular build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Packaging Unified Spring Boot JAR...
cd employee-management-api
call mvn clean package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo Maven package failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Assembling JRE, PostgreSQL Binaries, and Seed Data...
python scratch\create_installer_package.py
if %ERRORLEVEL% NEQ 0 (
    echo Assembly failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Compiling 100%% Standalone Single-File Setup Executable (EMS_Setup_v1.0.exe)...
python scratch\build_single_file_exe.py
if %ERRORLEVEL% NEQ 0 (
    echo Installer compilation failed!
    pause
    exit /b 1
)

echo.
echo =========================================================================
echo BUILD SUCCESSFUL!
echo Single-File Installer: %~dp0dist_installer\EMS_Setup_v1.0.exe
echo (You ONLY need to copy/distribute this one EMS_Setup_v1.0.exe file!)
echo =========================================================================
pause
