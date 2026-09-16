import os
import shutil
import subprocess
import zipfile
import time
import secrets
import hashlib
from datetime import datetime
from PIL import Image

BASE_DIR = r"h:\PARIKAR"
DOCS_DIR = os.path.join(BASE_DIR, "docs")
BUILD_DIR = os.path.join(BASE_DIR, "installer_build")
PKG_DIR = os.path.join(BUILD_DIR, "EMS_Production")
DIST_DIR = os.path.join(BASE_DIR, "dist_installer")

UI_DIR = os.path.join(BASE_DIR, "employee-management-ui")
API_DIR = os.path.join(BASE_DIR, "employee-management-api")
UI_DIST_DIR = os.path.join(UI_DIR, "dist", "employee-management-ui", "browser")
API_STATIC_DIR = os.path.join(API_DIR, "src", "main", "resources", "static")

PG_17_DIR = r"C:\Program Files\PostgreSQL\17"
JDK_17_DIR = r"C:\Program Files\Java\jdk-17"
if not os.path.exists(JDK_17_DIR):
    JDK_17_DIR = r"C:\Program Files\Java\jdk-23"

DESKTOP_ICON_PNG = os.path.join(DOCS_DIR, "desktop icon.png")
LOGO_PNG = os.path.join(DOCS_DIR, "logo.png")
ICO_SIZES = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]

APP_MANIFEST = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
"""

def generate_fresh_license_key():
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    parts = ["".join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
    key = "PRX-EMS-" + "-".join(parts)
    norm = key.replace("-", "").replace(" ", "").upper()
    key_hash = hashlib.sha256(norm.encode('utf-8')).hexdigest().upper()
    return key, key_hash

def step1_build_frontend():
    print("\n=======================================================")
    print("[1/5] Building Angular Frontend (Standalone Mode)...")
    print("=======================================================")
    res = subprocess.run("npm run build -- --configuration standalone", cwd=UI_DIR, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Angular build error: {res.stderr}\n{res.stdout}")
        raise RuntimeError("Angular build failed")
    print("Angular build completed successfully.")

    print(f"Copying static files to Spring Boot static resources...")
    if os.path.exists(API_STATIC_DIR):
        shutil.rmtree(API_STATIC_DIR)
    os.makedirs(API_STATIC_DIR, exist_ok=True)
    
    for item in os.listdir(UI_DIST_DIR):
        s = os.path.join(UI_DIST_DIR, item)
        d = os.path.join(API_STATIC_DIR, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)
    print("Static resources integrated into Spring Boot.")

def step2_build_backend():
    print("\n=======================================================")
    print("[2/5] Packaging Unified Spring Boot Executable JAR...")
    print("=======================================================")
    env = os.environ.copy()
    env["JAVA_HOME"] = JDK_17_DIR
    mvnw_cmd = os.path.join(API_DIR, "mvnw.cmd") if os.name == 'nt' else os.path.join(API_DIR, "mvnw")
    if os.path.exists(mvnw_cmd):
        res = subprocess.run([mvnw_cmd, "package", "-DskipTests"], cwd=API_DIR, env=env, capture_output=True, text=True)
    else:
        res = subprocess.run(["mvn", "package", "-DskipTests"], cwd=API_DIR, shell=True, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Maven error: {res.stderr}\n{res.stdout}")
        raise RuntimeError("Maven build failed")
    print("Unified Spring Boot JAR packaged successfully.")

def step3_assemble_package():
    print("\n=======================================================")
    print("[3/5] Assembling JRE, PostgreSQL Binaries, and Seed Data...")
    print("=======================================================")
    if os.path.exists(PKG_DIR):
        shutil.rmtree(PKG_DIR, ignore_errors=True)
        
    os.makedirs(os.path.join(PKG_DIR, "bin"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "app"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "data", "uploads", "photos"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "data", "uploads", "documents"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "data", "uploads", "company"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "data", "uploads", "bills"), exist_ok=True)
    os.makedirs(os.path.join(PKG_DIR, "logs"), exist_ok=True)
    os.makedirs(DIST_DIR, exist_ok=True)

    # Copy JAR
    src_jar = os.path.join(API_DIR, "target", "employee-management-api-1.0.0.jar")
    shutil.copy2(src_jar, os.path.join(PKG_DIR, "app", "employee-management-app.jar"))

    # Bundle DB Seed Data directly from docs/production_data_dump.sql
    dst_sql = os.path.join(PKG_DIR, "app", "seed_data.sql")
    src_dump = os.path.join(DOCS_DIR, "production_data_dump.sql")
    if os.path.exists(src_dump):
        shutil.copy2(src_dump, dst_sql)
        print(f"Production database seed bundled: {round(os.path.getsize(dst_sql)/(1024*1024),2)} MB")
    else:
        print("WARNING: production_data_dump.sql not found in docs!")

    # Copy JRE
    dst_jre = os.path.join(PKG_DIR, "jre")
    for item in ["bin", "lib", "conf", "release"]:
        s = os.path.join(JDK_17_DIR, item)
        d = os.path.join(dst_jre, item)
        if os.path.exists(s):
            if os.path.isdir(s): shutil.copytree(s, d, dirs_exist_ok=True)
            else: shutil.copy2(s, d)
    print("Embedded JRE copied.")

    # Copy PostgreSQL Binaries
    dst_pg = os.path.join(PKG_DIR, "pgsql")
    pg_src_candidate = PG_17_DIR
    if not os.path.exists(os.path.join(pg_src_candidate, "bin", "initdb.exe")):
        pg_src_candidate = r"C:\Users\Bharath\AppData\Local\EMS\pgsql"
    for item in ["bin", "lib", "share"]:
        s = os.path.join(pg_src_candidate, item)
        d = os.path.join(dst_pg, item)
        if os.path.exists(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
    print("PostgreSQL 17 distribution binaries copied.")

    # Control scripts
    init_db_bat = """@echo off
setlocal
cd /d "%~dp0\\.."
set "ROOT_DIR=%CD%"
set "PGDATA=%ROOT_DIR%\\data\\pgdata"
set "PGBIN=%ROOT_DIR%\\pgsql\\bin"
set "SEED_SQL=%ROOT_DIR%\\app\\seed_data.sql"
set "LOGS_DIR=%ROOT_DIR%\\logs"

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

if not exist "%PGDATA%\\PG_VERSION" (
    echo [INFO] Initializing new PostgreSQL Database Cluster...
    if not exist "%ROOT_DIR%\\data" mkdir "%ROOT_DIR%\\data"
    if not exist "%PGDATA%" mkdir "%PGDATA%"
    "%PGBIN%\\initdb.exe" -D "%PGDATA%" -U postgres -E UTF8 --locale=C -A trust >nul 2>&1
)

echo [INFO] Starting PostgreSQL to verify database and load seed data...
"%PGBIN%\\pg_ctl.exe" start -D "%PGDATA%" -l "%LOGS_DIR%\\init_postgres.log" -w -t 30

set /a ATTEMPTS=0
:WAIT_INIT_DB
set /a ATTEMPTS+=1
"%PGBIN%\\pg_isready.exe" -h localhost -p 5432 -U postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 goto INIT_DB_READY
if %ATTEMPTS% GEQ 20 goto INIT_DB_READY
timeout /t 1 /nobreak >nul
goto WAIT_INIT_DB

:INIT_DB_READY
:: Check if employee_management database exists; if not, create it
"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -lqt | findstr /C:"employee_management" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Creating employee_management database...
    "%PGBIN%\\createdb.exe" -h localhost -p 5432 -U postgres employee_management >nul 2>&1
)

:: Set postgres password
"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" >nul 2>&1

:: Verify if employees table exists and contains records; if count is 0, restore seed_data.sql!
"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -t -c "SELECT count(*) FROM employees;" 2>nul | findstr /R "[1-9]" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%SEED_SQL%" (
        echo [INFO] Restoring complete initial database records and schema...
        "%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -f "%SEED_SQL%" > "%LOGS_DIR%\\db_seed.log" 2>&1
    )
    "%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -c "ALTER USER postgres WITH PASSWORD 'postgres';" >nul 2>&1
)

"%PGBIN%\\pg_ctl.exe" stop -D "%PGDATA%" -m fast >nul 2>&1
echo [SUCCESS] Database initialization completed successfully!
"""
    with open(os.path.join(PKG_DIR, "bin", "init-db.bat"), "w", encoding="utf-8") as f:
        f.write(init_db_bat)

    start_ems_bat = """@echo off
setlocal
cd /d "%~dp0\\.."

set "ROOT_DIR=%CD%"
set "PGDATA=%ROOT_DIR%\\data\\pgdata"
set "PGBIN=%ROOT_DIR%\\pgsql\\bin"
set "JAVA_EXE=%ROOT_DIR%\\jre\\bin\\java.exe"
set "JAR_FILE=%ROOT_DIR%\\app\\employee-management-app.jar"
set "LOGS_DIR=%ROOT_DIR%\\logs"
set "SEED_SQL=%ROOT_DIR%\\app\\seed_data.sql"
set "HOSTS_FILE=%WINDIR%\\System32\\drivers\\etc\\hosts"

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Ensure local domain aliases are registered in hosts
findstr /I "ems.parrikar.com" "%HOSTS_FILE%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 127.0.0.1 ems.parrikar.com >> "%HOSTS_FILE%" 2>nul
    echo 127.0.0.1 ems.parikar.com >> "%HOSTS_FILE%" 2>nul
)

if not exist "%PGDATA%\\PG_VERSION" (
    call "%ROOT_DIR%\\bin\\init-db.bat"
)

:: Ensure PostgreSQL is started for this specific PGDATA
"%PGBIN%\\pg_isready.exe" -h localhost -p 5432 -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting PostgreSQL Database...
    "%PGBIN%\\pg_ctl.exe" start -D "%PGDATA%" -l "%LOGS_DIR%\\postgres.log" -w -t 30
)

:: Wait until PostgreSQL is confirmed accepting connections
set /a DB_ATTEMPTS=0
:WAIT_DB
set /a DB_ATTEMPTS+=1
"%PGBIN%\\pg_isready.exe" -h localhost -p 5432 -U postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 goto DB_READY
if %DB_ATTEMPTS% GEQ 20 goto DB_READY
timeout /t 1 /nobreak >nul
goto WAIT_DB

:DB_READY
:: Check if employee_management database exists
"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -lqt | findstr /C:"employee_management" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Creating employee_management database...
    "%PGBIN%\\createdb.exe" -h localhost -p 5432 -U postgres employee_management >nul 2>&1
)

:: Verify if employees table exists and contains records; if count is 0, restore seed data!
"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -t -c "SELECT count(*) FROM employees;" 2>nul | findstr /R "[1-9]" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%SEED_SQL%" (
        echo [INFO] Restoring initial seed data (1,041 employees)...
        "%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -f "%SEED_SQL%" > "%LOGS_DIR%\\db_restore.log" 2>&1
    )
    "%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -c "ALTER USER postgres WITH PASSWORD 'postgres';" >nul 2>&1
)

echo Starting Employee Management System on http://localhost:8085 (or http://ems.parrikar.com:8085)...
start "Employee Management System Backend" /B "%JAVA_EXE%" -jar "%JAR_FILE%" --spring.profiles.active=production > "%LOGS_DIR%\\ems_startup.log" 2>&1

echo Waiting for EMS to become ready...
set /a ATTEMPTS=0
:WAIT_LOOP
set /a ATTEMPTS+=1
timeout /t 1 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8085/api/v1/auth/ping' -TimeoutSec 1 -UseBasicParsing; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto LAUNCH_BROWSER
if %ATTEMPTS% GEQ 45 goto LAUNCH_BROWSER
goto WAIT_LOOP

:LAUNCH_BROWSER
echo Launching Browser at http://localhost:8085...
start "" "http://localhost:8085"
"""
    with open(os.path.join(PKG_DIR, "bin", "start-ems.bat"), "w", encoding="utf-8") as f:
        f.write(start_ems_bat)

    stop_ems_bat = """@echo off
setlocal
cd /d "%~dp0\\.."
set "PGDATA=%CD%\\data\\pgdata"
set "PGBIN=%CD%\\pgsql\\bin"

echo Stopping Employee Management System...
powershell -Command "Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*employee-management-app.jar*' } | Stop-Process -Force" >nul 2>&1

echo Stopping PostgreSQL Database...
"%PGBIN%\\pg_ctl.exe" stop -D "%PGDATA%" -m fast >nul 2>&1
echo EMS Stopped.
timeout /t 2 >nul
"""
    with open(os.path.join(PKG_DIR, "bin", "stop-ems.bat"), "w", encoding="utf-8") as f:
        f.write(stop_ems_bat)

    ems_vbs = """Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
WshShell.Run Chr(34) & strPath & "\\bin\\start-ems.bat" & Chr(34), 0, False
"""
    with open(os.path.join(PKG_DIR, "EMS.vbs"), "w", encoding="utf-8") as f:
        f.write(ems_vbs)

    with open(os.path.join(PKG_DIR, "EMS.bat"), "w", encoding="utf-8") as f:
        f.write("@echo off\ncd /d \"%~dp0\"\ncall \"bin\\start-ems.bat\"\n")
    with open(os.path.join(PKG_DIR, "Stop_EMS.bat"), "w", encoding="utf-8") as f:
        f.write("@echo off\ncd /d \"%~dp0\"\ncall \"bin\\stop-ems.bat\"\n")

    # Generate icons
    if os.path.exists(DESKTOP_ICON_PNG):
        img = Image.open(DESKTOP_ICON_PNG).convert("RGBA")
        img.save(os.path.join(PKG_DIR, "app.ico"), format='ICO', sizes=ICO_SIZES)
        img.save(os.path.join(DIST_DIR, "app.ico"), format='ICO', sizes=ICO_SIZES)
    if os.path.exists(LOGO_PNG):
        shutil.copy2(LOGO_PNG, os.path.join(PKG_DIR, "logo.png"))
        shutil.copy2(LOGO_PNG, os.path.join(DIST_DIR, "logo.png"))

def step4_compile_uninstaller():
    print("\n=======================================================")
    print("[4/5] Compiling PRIGENIX Uninstaller (Uninstall.exe)...")
    print("=======================================================")
    cs_uninstaller = r"""
using System;
using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Drawing2D;
using Microsoft.Win32;
using System.Threading;

public class PrigenixUninstaller : Form {
    private Panel headerPanel;
    private Label lblTitle;
    private Label lblSubtitle;
    private Label lblQuestion;
    private CheckBox chkKeepData;
    private ProgressBar progressBar;
    private Label lblStatus;
    private Button btnUninstall;
    private Button btnCancel;
    private Panel cardPanel;

    public PrigenixUninstaller() {
        this.Text = "PRIGENIX - Employee Management System Uninstaller";
        this.Size = new Size(520, 390);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(245, 247, 250);

        try {
            string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico");
            if (File.Exists(icoPath)) {
                this.Icon = new Icon(icoPath);
            }
        } catch {}

        headerPanel = new Panel() {
            Dock = DockStyle.Top,
            Height = 75
        };
        headerPanel.Paint += (s, e) => {
            using (LinearGradientBrush brush = new LinearGradientBrush(
                headerPanel.ClientRectangle,
                Color.FromArgb(180, 40, 50),
                Color.FromArgb(120, 20, 30),
                45F)) {
                e.Graphics.FillRectangle(brush, headerPanel.ClientRectangle);
            }
        };
        this.Controls.Add(headerPanel);

        lblTitle = new Label() {
            Text = "PRIGENIX",
            Font = new Font("Segoe UI", 14F, FontStyle.Bold),
            ForeColor = Color.FromArgb(255, 220, 220),
            Location = new Point(20, 12),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblTitle);

        lblSubtitle = new Label() {
            Text = "Employee Management System Uninstaller",
            Font = new Font("Segoe UI", 9.5F, FontStyle.Regular),
            ForeColor = Color.White,
            Location = new Point(20, 40),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblSubtitle);

        cardPanel = new Panel() {
            Location = new Point(20, 90),
            Size = new Size(465, 185),
            BackColor = Color.White
        };
        cardPanel.Paint += (s, e) => {
            ControlPaint.DrawBorder(e.Graphics, cardPanel.ClientRectangle, 
                Color.FromArgb(220, 225, 235), ButtonBorderStyle.Solid);
        };
        this.Controls.Add(cardPanel);

        lblQuestion = new Label() {
            Text = "Are you sure you want to remove Prigenix Employee Management System from your computer?",
            Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
            ForeColor = Color.FromArgb(40, 45, 55),
            Location = new Point(16, 16),
            Size = new Size(430, 40)
        };
        cardPanel.Controls.Add(lblQuestion);

        chkKeepData = new CheckBox() {
            Text = "Keep database records and uploaded files (Recommended for reinstallation)",
            Checked = true,
            Font = new Font("Segoe UI", 9F, FontStyle.Regular),
            ForeColor = Color.FromArgb(30, 80, 160),
            Location = new Point(16, 62),
            Size = new Size(430, 36)
        };
        cardPanel.Controls.Add(chkKeepData);

        lblStatus = new Label() {
            Text = "Click 'Uninstall' to proceed.",
            Font = new Font("Segoe UI", 8.5F),
            ForeColor = Color.FromArgb(100, 110, 125),
            Location = new Point(16, 105),
            Size = new Size(430, 20)
        };
        cardPanel.Controls.Add(lblStatus);

        progressBar = new ProgressBar() {
            Location = new Point(16, 130),
            Size = new Size(430, 18),
            Style = ProgressBarStyle.Continuous
        };
        cardPanel.Controls.Add(progressBar);

        btnCancel = new Button() {
            Text = "Cancel",
            Location = new Point(285, 290),
            Size = new Size(95, 34),
            Font = new Font("Segoe UI", 9.5F),
            FlatStyle = FlatStyle.System
        };
        btnCancel.Click += (s, e) => this.Close();
        this.Controls.Add(btnCancel);

        btnUninstall = new Button() {
            Text = "Uninstall",
            Location = new Point(390, 290),
            Size = new Size(95, 34),
            BackColor = Color.FromArgb(180, 40, 50),
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
            FlatStyle = FlatStyle.Flat
        };
        btnUninstall.FlatAppearance.BorderSize = 0;
        btnUninstall.Click += StartUninstall;
        this.Controls.Add(btnUninstall);
    }

    private void RemoveHostMapping() {
        try {
            string hostsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"drivers\etc\hosts");
            if (File.Exists(hostsPath)) {
                string[] lines = File.ReadAllLines(hostsPath);
                List<string> filtered = new List<string>();
                foreach (string line in lines) {
                    if (!line.Contains("ems.parrikar.com") && !line.Contains("ems.parikar.com") && !line.Contains("# PRIGENIX EMS")) {
                        filtered.Add(line);
                    }
                }
                File.WriteAllLines(hostsPath, filtered.ToArray());
            }
        } catch {}
    }

    private void StartUninstall(object sender, EventArgs e) {
        btnUninstall.Enabled = false;
        btnCancel.Enabled = false;
        bool keepData = chkKeepData.Checked;
        string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');

        Thread thread = new Thread(() => {
            try {
                UpdateProgress(10, "Stopping all active EMS and Database services...");
                
                string stopBat = Path.Combine(appDir, "bin", "stop-ems.bat");
                if (File.Exists(stopBat)) {
                    ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c \"" + stopBat + "\"") {
                        WorkingDirectory = appDir,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    Process p = Process.Start(psi);
                    p.WaitForExit(8000);
                }

                KillProcesses("postgres");

                UpdateProgress(35, "Removing Desktop and Start Menu Shortcuts...");
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string lnk1 = Path.Combine(desktop, "Prigenix EMS.lnk");
                string lnk2 = Path.Combine(desktop, "Employee Management System.lnk");
                if (File.Exists(lnk1)) File.Delete(lnk1);
                if (File.Exists(lnk2)) File.Delete(lnk2);

                UpdateProgress(50, "Cleaning Windows Hosts domain mappings...");
                RemoveHostMapping();

                UpdateProgress(65, "Removing Windows Control Panel Registry entries...");
                try {
                    using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true)) {
                        if (key != null) {
                            key.DeleteSubKeyTree("PrigenixEMS", false);
                        }
                    }
                } catch {}

                UpdateProgress(80, "Removing application files and runtime binaries...");
                DeleteDirectoryIfExists(Path.Combine(appDir, "app"));
                DeleteDirectoryIfExists(Path.Combine(appDir, "jre"));
                DeleteDirectoryIfExists(Path.Combine(appDir, "pgsql"));
                DeleteDirectoryIfExists(Path.Combine(appDir, "bin"));
                DeleteDirectoryIfExists(Path.Combine(appDir, "logs"));

                if (!keepData) {
                    UpdateProgress(90, "Removing database storage and uploaded files...");
                    DeleteDirectoryIfExists(Path.Combine(appDir, "data"));
                }

                UpdateProgress(100, "Uninstallation Complete!");

                string selfExe = Process.GetCurrentProcess().MainModule.FileName;
                string delCmd = "/c timeout /t 2 /nobreak >nul & del \"" + selfExe + "\"";
                if (!keepData) {
                    delCmd += " & rmdir /s /q \"" + appDir + "\"";
                }
                Process.Start(new ProcessStartInfo("cmd.exe", delCmd) {
                    CreateNoWindow = true,
                    UseShellExecute = false
                });

                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show(
                        "Prigenix Employee Management System was successfully uninstalled from your computer.",
                        "Uninstall Complete",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information);
                    this.Close();
                });

            } catch (Exception ex) {
                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show("Error during uninstallation: " + ex.Message, "Uninstall Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    btnUninstall.Enabled = true;
                    btnCancel.Enabled = true;
                });
            }
        });
        thread.IsBackground = true;
        thread.Start();
    }

    private void KillProcesses(string processName) {
        try {
            Process[] procs = Process.GetProcessesByName(processName);
            foreach (var p in procs) {
                try { p.Kill(); } catch {}
            }
        } catch {}
    }

    private void DeleteDirectoryIfExists(string dir) {
        if (Directory.Exists(dir)) {
            try { Directory.Delete(dir, true); } catch {}
        }
    }

    private void UpdateProgress(int value, string status) {
        if (this.IsHandleCreated) {
            this.Invoke((MethodInvoker)delegate {
                progressBar.Value = Math.Min(100, Math.Max(0, value));
                lblStatus.Text = status;
            });
        }
    }

    [STAThread]
    public static void Main() {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new PrigenixUninstaller());
    }
}
"""
    manifest_file = os.path.join(DIST_DIR, "app.manifest")
    with open(manifest_file, "w", encoding="utf-8") as f:
        f.write(APP_MANIFEST)

    cs_uninstaller_file = os.path.join(DIST_DIR, "PrigenixUninstaller.cs")
    with open(cs_uninstaller_file, "w", encoding="utf-8") as f:
        f.write(cs_uninstaller)

    csc_path = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    exe_uninstaller_out = os.path.join(PKG_DIR, "Uninstall.exe")
    dist_ico = os.path.join(DIST_DIR, "app.ico")

    cmd = [
        csc_path, "/target:winexe", f"/out:{exe_uninstaller_out}", f"/win32icon:{dist_ico}",
        f"/win32manifest:{manifest_file}",
        "/reference:System.dll", "/reference:System.Windows.Forms.dll", "/reference:System.Drawing.dll",
        cs_uninstaller_file
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(cs_uninstaller_file): os.remove(cs_uninstaller_file)
    print("Uninstall.exe compiled with Admin Manifest.")

def step5_compile_smart_installer():
    print("\n=======================================================")
    print("[5/5] Generating License Key and Compiling Standalone Installer...")
    print("=======================================================")

    # Generate Unique Key for this build
    license_key, key_hash = generate_fresh_license_key()
    
    # Save Key file to companion txt in dist_installer
    key_file_path = os.path.join(DIST_DIR, "INSTALLATION_KEY.txt")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    key_doc = f"""================================================================================
PRIGENIX EMPLOYEE MANAGEMENT SYSTEM (EMS) - OFFICIAL INSTALLATION KEY
================================================================================
Company:           PRIGENIX
Product:           Employee Management System (Enterprise Standalone Edition)
Build Timestamp:   {now_str}
Setup Executable:  EMS_Setup_v1.0.exe
Web Access URLs:   http://localhost:8085  OR  http://ems.parrikar.com:8085

--------------------------------------------------------------------------------
YOUR UNIQUE INSTALLATION LICENSE KEY:
--------------------------------------------------------------------------------

{license_key}

--------------------------------------------------------------------------------
IMPORTANT INSTRUCTIONS:
--------------------------------------------------------------------------------
1. This Installation Key is cryptographically verified by the setup engine.
2. When prompted during installation or update, enter this key exactly as shown.
3. If an incorrect key is entered 3 times, the installation will strictly terminate.
4. No bypass options are permitted.
================================================================================
"""
    with open(key_file_path, "w", encoding="utf-8") as f:
        f.write(key_doc)
    print(f"Fresh Installation Key Generated: {license_key}")
    print(f"Key File Saved: {key_file_path}")

    zip_path = os.path.join(DIST_DIR, "ems_payload.zip")
    if os.path.exists(zip_path): os.remove(zip_path)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        for root, dirs, files in os.walk(PKG_DIR):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, PKG_DIR)
                zipf.write(abs_path, rel_path)

    # Smart Installer C# Code with Upgrade, File Transfer Animation, Strict License Key Validation & Host Aliases
    cs_installer = r"""
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;
using System.Threading;

public class PrigenixEMSInstaller : Form {
    private const string EXPECTED_KEY_HASH = """ + f'"{key_hash}"' + r""";

    private Panel headerPanel;
    private Label lblHeaderCompany;
    private Label lblHeaderApp;
    private Label lblHeaderTagline;
    private PictureBox picLogo;
    
    private Label lblDestTitle;
    private TextBox txtInstallPath;
    private Button btnBrowse;

    private Label lblKeyTitle;
    private TextBox txtLicenseKey;
    private Label lblKeyValidation;

    private CheckBox chkDesktopShortcut;
    private CheckBox chkLaunchAfter;
    
    private Label lblStatus;
    private Label lblSubStatus;
    private Label lblModeBadge;
    private Panel transferPanel;
    private Label lblTransferFile;
    private Label lblTransferRate;
    private Label lblPercentBadge;
    private ProgressBar progressBar;
    private Button btnInstall;
    private Button btnCancel;
    private Panel cardPanel;
    private System.Windows.Forms.Timer animTimer;
    private int animStep = 0;
    private bool isInstalling = false;
    private bool isUpgrade = false;
    private int failedAttempts = 0;

    public PrigenixEMSInstaller() {
        this.Text = "PRIGENIX - Employee Management System Setup v1.0";
        this.Size = new Size(610, 600);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(243, 246, 250);
        this.Font = new Font("Segoe UI", 9F);

        try {
            Assembly asm = Assembly.GetExecutingAssembly();
            Stream icoStream = asm.GetManifestResourceStream("app.ico");
            if (icoStream != null) { this.Icon = new Icon(icoStream); }
        } catch {}

        // Premium Header
        headerPanel = new Panel() {
            Dock = DockStyle.Top,
            Height = 92
        };
        headerPanel.Paint += (s, e) => {
            using (LinearGradientBrush brush = new LinearGradientBrush(
                headerPanel.ClientRectangle,
                Color.FromArgb(11, 23, 44),
                Color.FromArgb(24, 60, 118),
                45F)) {
                e.Graphics.FillRectangle(brush, headerPanel.ClientRectangle);
            }
            using (Pen pen = new Pen(Color.FromArgb(56, 189, 248), 2F)) {
                e.Graphics.DrawLine(pen, 0, headerPanel.Height - 2, headerPanel.Width, headerPanel.Height - 2);
            }
        };
        this.Controls.Add(headerPanel);

        lblHeaderCompany = new Label() {
            Text = "PRIGENIX",
            Font = new Font("Segoe UI", 15F, FontStyle.Bold),
            ForeColor = Color.FromArgb(255, 215, 0),
            Location = new Point(24, 12),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblHeaderCompany);

        lblHeaderApp = new Label() {
            Text = "Employee Management System — Enterprise Standalone Setup v1.0",
            Font = new Font("Segoe UI", 9.5F, FontStyle.Regular),
            ForeColor = Color.White,
            Location = new Point(25, 40),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblHeaderApp);

        lblHeaderTagline = new Label() {
            Text = "Turnkey Standalone Enterprise Installer • Automated In-Place Upgrade Engine",
            Font = new Font("Segoe UI", 8F),
            ForeColor = Color.FromArgb(186, 215, 255),
            Location = new Point(25, 64),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblHeaderTagline);

        try {
            Assembly asm = Assembly.GetExecutingAssembly();
            Stream logoStream = asm.GetManifestResourceStream("logo.png");
            if (logoStream != null) {
                picLogo = new PictureBox() {
                    Image = Image.FromStream(logoStream),
                    SizeMode = PictureBoxSizeMode.Zoom,
                    Size = new Size(66, 66),
                    Location = new Point(510, 12),
                    BackColor = Color.Transparent
                };
                headerPanel.Controls.Add(picLogo);
            }
        } catch {}

        // Main Container Card
        cardPanel = new Panel() {
            Location = new Point(24, 104),
            Size = new Size(546, 422),
            BackColor = Color.White
        };
        cardPanel.Paint += (s, e) => {
            ControlPaint.DrawBorder(e.Graphics, cardPanel.ClientRectangle, 
                Color.FromArgb(218, 224, 233), ButtonBorderStyle.Solid);
        };
        this.Controls.Add(cardPanel);

        // Destination Folder
        lblDestTitle = new Label() {
            Text = "Installation Destination Folder:",
            Font = new Font("Segoe UI", 9F, FontStyle.Bold),
            ForeColor = Color.FromArgb(30, 41, 59),
            Location = new Point(18, 12),
            AutoSize = true
        };
        cardPanel.Controls.Add(lblDestTitle);

        string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PRIGENIX_EMS");
        txtInstallPath = new TextBox() {
            Text = defaultPath,
            Location = new Point(18, 32),
            Size = new Size(410, 26),
            Font = new Font("Segoe UI", 9.5F)
        };
        txtInstallPath.TextChanged += (s, e) => CheckExistingInstallation();
        cardPanel.Controls.Add(txtInstallPath);

        btnBrowse = new Button() {
            Text = "Browse...",
            Location = new Point(438, 30),
            Size = new Size(88, 28),
            Font = new Font("Segoe UI", 9F),
            FlatStyle = FlatStyle.System
        };
        btnBrowse.Click += (s, e) => {
            using (FolderBrowserDialog fbd = new FolderBrowserDialog()) {
                fbd.SelectedPath = txtInstallPath.Text;
                if (fbd.ShowDialog() == DialogResult.OK) {
                    txtInstallPath.Text = fbd.SelectedPath;
                }
            }
        };
        cardPanel.Controls.Add(btnBrowse);

        lblModeBadge = new Label() {
            Text = "Mode: Fresh Installation",
            Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
            ForeColor = Color.FromArgb(20, 120, 60),
            Location = new Point(18, 62),
            AutoSize = true
        };
        cardPanel.Controls.Add(lblModeBadge);

        // Mandatory Installation Key
        lblKeyTitle = new Label() {
            Text = "Product Installation Key (Mandatory — from INSTALLATION_KEY.txt):",
            Font = new Font("Segoe UI", 9F, FontStyle.Bold),
            ForeColor = Color.FromArgb(190, 30, 45),
            Location = new Point(18, 86),
            AutoSize = true
        };
        cardPanel.Controls.Add(lblKeyTitle);

        txtLicenseKey = new TextBox() {
            Location = new Point(18, 106),
            Size = new Size(508, 26),
            Font = new Font("Consolas", 10.5F, FontStyle.Bold),
            ForeColor = Color.FromArgb(20, 40, 80),
            CharacterCasing = CharacterCasing.Upper
        };
        txtLicenseKey.TextChanged += OnKeyTextChanged;
        cardPanel.Controls.Add(txtLicenseKey);

        lblKeyValidation = new Label() {
            Text = "* Key format: PRX-EMS-XXXX-XXXX-XXXX-XXXX (Verification is strictly enforced)",
            Font = new Font("Segoe UI", 8F),
            ForeColor = Color.FromArgb(120, 130, 145),
            Location = new Point(18, 135),
            Size = new Size(508, 18)
        };
        cardPanel.Controls.Add(lblKeyValidation);

        // Shortcuts & Options
        chkDesktopShortcut = new CheckBox() {
            Text = "Create Desktop Shortcut with PRIGENIX Icon",
            Checked = true,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.FromArgb(51, 65, 85),
            Location = new Point(18, 156),
            Size = new Size(440, 22)
        };
        cardPanel.Controls.Add(chkDesktopShortcut);

        chkLaunchAfter = new CheckBox() {
            Text = "Automatically launch EMS and open browser at http://localhost:8085",
            Checked = true,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.FromArgb(51, 65, 85),
            Location = new Point(18, 178),
            Size = new Size(508, 22)
        };
        cardPanel.Controls.Add(chkLaunchAfter);

        Label lblDivider = new Label() {
            BorderStyle = BorderStyle.Fixed3D,
            Location = new Point(18, 204),
            Size = new Size(508, 2)
        };
        cardPanel.Controls.Add(lblDivider);

        // Status & Animated Transfer Area
        lblStatus = new Label() {
            Text = "Ready to install PRIGENIX EMS.",
            Font = new Font("Segoe UI", 9F, FontStyle.Bold),
            ForeColor = Color.FromArgb(30, 41, 59),
            Location = new Point(18, 212),
            Size = new Size(508, 20)
        };
        cardPanel.Controls.Add(lblStatus);

        lblSubStatus = new Label() {
            Text = "Embedded OpenJDK 17 + PostgreSQL 17 + Unified Web Engine on http://localhost:8085",
            Font = new Font("Segoe UI", 8F),
            ForeColor = Color.FromArgb(100, 116, 139),
            Location = new Point(18, 232),
            Size = new Size(508, 26)
        };
        cardPanel.Controls.Add(lblSubStatus);

        // Visual File Transfer Animation Card
        transferPanel = new Panel() {
            Location = new Point(18, 262),
            Size = new Size(508, 70),
            BackColor = Color.FromArgb(248, 250, 252)
        };
        transferPanel.Paint += DrawTransferAnimation;
        cardPanel.Controls.Add(transferPanel);

        lblTransferFile = new Label() {
            Text = "Waiting for setup confirmation...",
            Font = new Font("Segoe UI", 8F, FontStyle.Italic),
            ForeColor = Color.FromArgb(71, 85, 105),
            Location = new Point(10, 8),
            Size = new Size(410, 18),
            BackColor = Color.Transparent
        };
        transferPanel.Controls.Add(lblTransferFile);

        lblPercentBadge = new Label() {
            Text = "0%",
            Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
            ForeColor = Color.FromArgb(15, 80, 160),
            Location = new Point(445, 6),
            Size = new Size(55, 18),
            TextAlign = ContentAlignment.TopRight,
            BackColor = Color.Transparent
        };
        transferPanel.Controls.Add(lblPercentBadge);

        progressBar = new ProgressBar() {
            Location = new Point(10, 32),
            Size = new Size(488, 16),
            Style = ProgressBarStyle.Continuous
        };
        transferPanel.Controls.Add(progressBar);

        lblTransferRate = new Label() {
            Text = "● Ready",
            Font = new Font("Segoe UI", 7.5F),
            ForeColor = Color.FromArgb(100, 116, 139),
            Location = new Point(10, 50),
            Size = new Size(488, 16),
            BackColor = Color.Transparent
        };
        transferPanel.Controls.Add(lblTransferRate);

        // Buttons
        btnCancel = new Button() {
            Text = "Cancel",
            Location = new Point(365, 534),
            Size = new Size(95, 34),
            Font = new Font("Segoe UI", 9.5F),
            FlatStyle = FlatStyle.System
        };
        btnCancel.Click += (s, e) => this.Close();
        this.Controls.Add(btnCancel);

        btnInstall = new Button() {
            Text = "Install Now",
            Location = new Point(470, 534),
            Size = new Size(115, 34),
            BackColor = Color.FromArgb(15, 80, 160),
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
            FlatStyle = FlatStyle.Flat
        };
        btnInstall.FlatAppearance.BorderSize = 0;
        btnInstall.Click += StartInstallation;
        this.Controls.Add(btnInstall);

        // 30 FPS Animation Timer for smooth transfer pulses
        animTimer = new System.Windows.Forms.Timer() { Interval = 40 };
        animTimer.Tick += (s, e) => {
            if (isInstalling) {
                animStep = (animStep + 1) % 60;
                transferPanel.Invalidate();
            }
        };
        animTimer.Start();

        CheckExistingInstallation();
    }

    private void DrawTransferAnimation(object sender, PaintEventArgs e) {
        Graphics g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        using (Pen p = new Pen(Color.FromArgb(226, 232, 240), 1)) {
            g.DrawRectangle(p, 0, 0, transferPanel.Width - 1, transferPanel.Height - 1);
        }

        if (isInstalling) {
            int pulseX = (animStep * (transferPanel.Width / 30)) % transferPanel.Width;
            using (LinearGradientBrush pulseBrush = new LinearGradientBrush(
                new Rectangle(pulseX - 40, 0, 80, transferPanel.Height),
                Color.FromArgb(0, 56, 189, 248),
                Color.FromArgb(35, 56, 189, 248),
                0F)) {
                g.FillRectangle(pulseBrush, pulseX - 40, 0, 80, transferPanel.Height);
            }
        }
    }

    private void OnKeyTextChanged(object sender, EventArgs e) {
        if (ValidateKey(txtLicenseKey.Text)) {
            lblKeyValidation.Text = "✓ Key Verified: Authentic PRIGENIX Enterprise License";
            lblKeyValidation.ForeColor = Color.FromArgb(20, 130, 60);
        } else {
            lblKeyValidation.Text = "* Key format: PRX-EMS-XXXX-XXXX-XXXX-XXXX (Verification is strictly enforced)";
            lblKeyValidation.ForeColor = Color.FromArgb(120, 130, 145);
        }
    }

    private bool ValidateKey(string inputKey) {
        if (string.IsNullOrWhiteSpace(inputKey)) return false;
        string norm = inputKey.Trim().ToUpper().Replace("-", "").Replace(" ", "");
        using (SHA256 sha = SHA256.Create()) {
            byte[] bytes = Encoding.UTF8.GetBytes(norm);
            byte[] hash = sha.ComputeHash(bytes);
            StringBuilder sb = new StringBuilder();
            foreach (byte b in hash) {
                sb.Append(b.ToString("X2"));
            }
            return sb.ToString().ToUpper() == EXPECTED_KEY_HASH;
        }
    }

    private void CheckExistingInstallation() {
        string targetDir = txtInstallPath.Text.Trim();
        string dbDir = Path.Combine(targetDir, "data", "pgdata", "PG_VERSION");
        string jarFile = Path.Combine(targetDir, "app", "employee-management-app.jar");

        if (File.Exists(dbDir) || File.Exists(jarFile)) {
            isUpgrade = true;
            lblModeBadge.Text = "Mode: Existing Installation Detected (In-Place Upgrade / Update)";
            lblModeBadge.ForeColor = Color.FromArgb(200, 100, 0);
            btnInstall.Text = "Update Now";
            lblStatus.Text = "Existing installation detected. Will update application files while safely preserving all database records.";
            lblSubStatus.Text = "Data Preservation: Existing employee records & database storage will NOT be overwritten.";
        } else {
            isUpgrade = false;
            lblModeBadge.Text = "Mode: Fresh Installation";
            lblModeBadge.ForeColor = Color.FromArgb(20, 120, 60);
            btnInstall.Text = "Install Now";
            lblStatus.Text = "Ready to install PRIGENIX EMS.";
            lblSubStatus.Text = "Embedded OpenJDK 17 + PostgreSQL 17 + Unified Web Engine on http://localhost:8085";
        }
    }

    private void EnsureHostMapping() {
        try {
            string hostsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"drivers\etc\hosts");
            if (File.Exists(hostsPath)) {
                string text = File.ReadAllText(hostsPath);
                StringBuilder sb = new StringBuilder();
                if (!text.Contains("ems.parrikar.com")) {
                    sb.AppendLine("127.0.0.1 ems.parrikar.com");
                }
                if (!text.Contains("ems.parikar.com")) {
                    sb.AppendLine("127.0.0.1 ems.parikar.com");
                }
                if (sb.Length > 0) {
                    File.AppendAllText(hostsPath, "\r\n# PRIGENIX EMS Local Domain Mapping\r\n" + sb.ToString());
                }
            }
        } catch {}
    }

    private void StartInstallation(object sender, EventArgs e) {
        // STRICT KEY VALIDATION — ZERO BYPASS
        string enteredKey = txtLicenseKey.Text;
        if (!ValidateKey(enteredKey)) {
            failedAttempts++;
            if (failedAttempts >= 3) {
                MessageBox.Show(
                    "Installation Terminated: Too many invalid key attempts.\n\nSetup will now exit. Please refer to INSTALLATION_KEY.txt for your genuine product key.",
                    "Security Violation - Setup Terminated",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Stop);
                Application.Exit();
                return;
            }
            MessageBox.Show(
                "Invalid Installation Key!\n\nPlease enter the authentic Product Installation Key generated for this build (found in INSTALLATION_KEY.txt).\n\nAttempts remaining: " + (3 - failedAttempts),
                "Authentication Failed - Invalid Key",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            txtLicenseKey.Focus();
            txtLicenseKey.SelectAll();
            return;
        }

        btnInstall.Enabled = false;
        btnCancel.Enabled = false;
        btnBrowse.Enabled = false;
        txtInstallPath.ReadOnly = true;
        txtLicenseKey.ReadOnly = true;
        isInstalling = true;

        string targetDir = txtInstallPath.Text.Trim();
        bool createShortcut = chkDesktopShortcut.Checked;
        bool launchAfter = chkLaunchAfter.Checked;

        Thread thread = new Thread(() => {
            try {
                // If upgrading, stop running services first
                if (isUpgrade) {
                    UpdateProgress(5, "Stopping running EMS services for in-place upgrade...", "Closing background tasks...", "stop-ems.bat", "Terminating active worker processes");
                    string stopBat = Path.Combine(targetDir, "bin", "stop-ems.bat");
                    if (File.Exists(stopBat)) {
                        ProcessStartInfo psiStop = new ProcessStartInfo("cmd.exe", "/c \"" + stopBat + "\"") {
                            WorkingDirectory = targetDir,
                            CreateNoWindow = true,
                            UseShellExecute = false
                        };
                        Process pStop = Process.Start(psiStop);
                        pStop.WaitForExit(6000);
                    }
                }

                UpdateProgress(10, "Preparing target destination folder...", targetDir, "Verifying filesystem permissions...", "Local Directory Setup");
                if (!Directory.Exists(targetDir)) {
                    Directory.CreateDirectory(targetDir);
                }

                UpdateProgress(15, isUpgrade ? "Updating application binaries, JRE, and JAR..." : "Extracting embedded components (JRE, PostgreSQL, App JAR)...", "Please wait...", "ems_payload.zip", "Decompressing payload");

                Assembly asm = Assembly.GetExecutingAssembly();
                Stream payloadStream = asm.GetManifestResourceStream("ems_payload.zip");

                if (payloadStream == null) {
                    string exePath = Process.GetCurrentProcess().MainModule.FileName;
                    string localZip = Path.Combine(Path.GetDirectoryName(exePath), "ems_payload.zip");
                    if (File.Exists(localZip)) {
                        payloadStream = File.OpenRead(localZip);
                    } else {
                        throw new FileNotFoundException("Embedded payload not found in executable.");
                    }
                }

                using (payloadStream)
                using (ZipArchive archive = new ZipArchive(payloadStream, ZipArchiveMode.Read)) {
                    int total = archive.Entries.Count;
                    int current = 0;
                    foreach (ZipArchiveEntry entry in archive.Entries) {
                        current++;
                        
                        // IF UPGRADING: NEVER OVERWRITE EXISTING USER DATA IN data/pgdata/ OR data/uploads/
                        if (isUpgrade && (entry.FullName.StartsWith("data/pgdata/") || entry.FullName.StartsWith("data\\pgdata\\"))) {
                            continue;
                        }

                        string fullPath = Path.Combine(targetDir, entry.FullName);
                        if (String.IsNullOrEmpty(entry.Name)) {
                            if (!Directory.Exists(fullPath)) Directory.CreateDirectory(fullPath);
                        } else {
                            string dir = Path.GetDirectoryName(fullPath);
                            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                            entry.ExtractToFile(fullPath, true);
                        }
                        if (current % 40 == 0 || current == total) {
                            int p = 15 + (int)((current / (double)total) * 55.0);
                            string shortName = entry.FullName.Length > 48 ? "..." + entry.FullName.Substring(entry.FullName.Length - 45) : entry.FullName;
                            UpdateProgress(p, 
                                isUpgrade ? "Updating files: " + entry.Name : "Transferring: " + entry.Name,
                                current + " / " + total + " files deployed",
                                "Transferring: " + shortName,
                                "Extracting archive stream • " + current + " of " + total);
                        }
                    }
                }

                UpdateProgress(75, isUpgrade ? "Verifying database integrity..." : "Initializing PostgreSQL Database Cluster silently...", "Configuring schemas and seed data...", "pgsql/bin/initdb.exe", "Executing database setup");
                string initBat = Path.Combine(targetDir, "bin", "init-db.bat");
                if (File.Exists(initBat)) {
                    ProcessStartInfo psiInit = new ProcessStartInfo("cmd.exe", "/c \"" + initBat + "\"") {
                        WorkingDirectory = targetDir,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };
                    Process pInit = Process.Start(psiInit);
                    pInit.WaitForExit();
                }

                UpdateProgress(85, "Registering local domain aliases in Windows hosts...", "Configuring ems.parrikar.com...", "drivers/etc/hosts", "Adding 127.0.0.1 ems.parrikar.com");
                EnsureHostMapping();

                UpdateProgress(90, "Registering in Windows Control Panel (Add or Remove Programs)...", "Configuring uninstaller...", "Uninstall.exe", "Writing HKCU Uninstall entries");
                RegisterWindowsUninstall(targetDir);

                UpdateProgress(96, "Updating PRIGENIX EMS Desktop Shortcut...", "Applying PRIGENIX official icon...", "Prigenix EMS.lnk", "Configuring desktop icon");
                if (createShortcut) {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    string shortcutPath = Path.Combine(desktop, "Prigenix EMS.lnk");
                    string vbsPath = Path.Combine(targetDir, "EMS.vbs");
                    string icoPath = Path.Combine(targetDir, "app.ico");
                    
                    CreateDesktopShortcut(shortcutPath, vbsPath, icoPath, targetDir);
                }

                isInstalling = false;
                UpdateProgress(100, isUpgrade ? "Update Complete!" : "Installation Complete!", "PRIGENIX Employee Management System is ready.", "Setup Complete", "All components deployed successfully");

                if (launchAfter) {
                    string vbsPath = Path.Combine(targetDir, "EMS.vbs");
                    Process.Start(new ProcessStartInfo("wscript.exe", "\"" + vbsPath + "\"") {
                        WorkingDirectory = targetDir
                    });
                }

                string finishTitle = isUpgrade ? "PRIGENIX EMS — Update Complete" : "PRIGENIX EMS — Setup Complete";
                string finishMsg = isUpgrade 
                    ? "PRIGENIX Employee Management System was successfully UPDATED to the latest version!\n\nAll existing employee records, attendance, and databases have been preserved.\n\nWeb Access:\n• http://localhost:8085\n• http://ems.parrikar.com:8085"
                    : "PRIGENIX Employee Management System was installed successfully!\n\nDesktop Icon: 'Prigenix EMS'\nWeb Access:\n• http://localhost:8085\n• http://ems.parrikar.com:8085\n\nDefault Admin Login:\nUsername: ADMIN\nPassword: Admin@123";

                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show(finishMsg, finishTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    this.Close();
                });

            } catch (Exception ex) {
                isInstalling = false;
                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show("Installation Error:\n" + ex.Message, "Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    btnInstall.Enabled = true;
                    btnCancel.Enabled = true;
                });
            }
        });
        thread.IsBackground = true;
        thread.Start();
    }

    private void RegisterWindowsUninstall(string targetDir) {
        try {
            string uninstallPath = Path.Combine(targetDir, "Uninstall.exe");
            string icoPath = Path.Combine(targetDir, "app.ico");
            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\PrigenixEMS")) {
                if (key != null) {
                    key.SetValue("DisplayName", "PRIGENIX - Employee Management System");
                    key.SetValue("DisplayVersion", "1.0.0");
                    key.SetValue("Publisher", "PRIGENIX");
                    key.SetValue("UninstallString", "\"" + uninstallPath + "\"");
                    key.SetValue("InstallLocation", targetDir);
                    if (File.Exists(icoPath)) {
                        key.SetValue("DisplayIcon", icoPath);
                    }
                    key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                    key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                }
            }
        } catch {}
    }

    private void UpdateProgress(int value, string status, string subStatus, string transferFile, string transferRate) {
        if (this.IsHandleCreated) {
            this.Invoke((MethodInvoker)delegate {
                int clp = Math.Min(100, Math.Max(0, value));
                progressBar.Value = clp;
                lblPercentBadge.Text = clp + "%";
                lblStatus.Text = status;
                lblSubStatus.Text = subStatus;
                lblTransferFile.Text = transferFile;
                lblTransferRate.Text = "● " + transferRate;
            });
        }
    }

    private void CreateDesktopShortcut(string shortcutPath, string targetPath, string iconPath, string workingDir) {
        Type t = Type.GetTypeFromProgID("WScript.Shell");
        dynamic shell = Activator.CreateInstance(t);
        dynamic shortcut = shell.CreateShortcut(shortcutPath);
        shortcut.TargetPath = "wscript.exe";
        shortcut.Arguments = "\"" + targetPath + "\"";
        shortcut.WorkingDirectory = workingDir;
        shortcut.Description = "PRIGENIX Employee Management System";
        if (File.Exists(iconPath)) {
            shortcut.IconLocation = iconPath + ", 0";
        }
        shortcut.Save();
    }

    [STAThread]
    public static void Main() {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new PrigenixEMSInstaller());
    }
}
"""
    manifest_file = os.path.join(DIST_DIR, "app.manifest")
    cs_installer_file = os.path.join(DIST_DIR, "PrigenixEMSInstaller.cs")
    with open(cs_installer_file, "w", encoding="utf-8") as f:
        f.write(cs_installer)

    csc_path = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    exe_output = os.path.join(DIST_DIR, "EMS_Setup_v1.0.exe")
    dist_ico = os.path.join(DIST_DIR, "app.ico")
    dist_logo = os.path.join(DIST_DIR, "logo.png")
    zip_path = os.path.join(DIST_DIR, "ems_payload.zip")

    cmd = [
        csc_path,
        "/target:winexe",
        f"/out:{exe_output}",
        f"/win32icon:{dist_ico}",
        f"/win32manifest:{manifest_file}",
        f"/resource:{zip_path},ems_payload.zip",
        f"/resource:{dist_ico},app.ico",
        f"/resource:{dist_logo},logo.png",
        "/reference:System.dll",
        "/reference:System.IO.Compression.dll",
        "/reference:System.IO.Compression.FileSystem.dll",
        "/reference:System.Windows.Forms.dll",
        "/reference:System.Drawing.dll",
        "/reference:Microsoft.CSharp.dll",
        cs_installer_file
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Compilation error: {res.stderr}\n{res.stdout}")
        raise RuntimeError("Compilation failed")
    else:
        size_mb = round(os.path.getsize(exe_output) / (1024 * 1024), 2)
        print(f"SUCCESS! Fresh Single-File Installer created: {exe_output} ({size_mb} MB)")

def main():
    start = time.time()
    step1_build_frontend()
    step2_build_backend()
    step3_assemble_package()
    step4_compile_uninstaller()
    step5_compile_smart_installer()
    elapsed = round(time.time() - start, 2)
    print(f"\n=========================================================================")
    print(f"FRESH BUILD & SMART UPGRADE INSTALLER COMPLETED IN {elapsed}s!")
    print(f"Branding: PRIGENIX")
    print(f"Primary URL: http://localhost:8085")
    print(f"Local Domain Alias: http://ems.parrikar.com:8085")
    print(f"Target Executable: {os.path.join(DIST_DIR, 'EMS_Setup_v1.0.exe')}")
    print(f"Installation Key File: {os.path.join(DIST_DIR, 'INSTALLATION_KEY.txt')}")
    print(f"=========================================================================")

if __name__ == "__main__":
    main()
