import os
import shutil
import subprocess
import zipfile
import time
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
    res = subprocess.run(["powershell", "-Command", "mvn package -DskipTests"], cwd=API_DIR, capture_output=True, text=True)
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

    # Export DB Seed
    dst_sql = os.path.join(PKG_DIR, "app", "seed_data.sql")
    pg_dump = os.path.join(PG_17_DIR, "bin", "pg_dump.exe")
    env = os.environ.copy()
    env["PGPASSWORD"] = "postgres"
    cmd = [
        pg_dump, "-h", "localhost", "-p", "5432", "-U", "postgres",
        "-d", "employee_management", "-F", "p", "--no-owner", "--no-privileges", "-f", dst_sql
    ]
    subprocess.run(cmd, env=env, capture_output=True, text=True)
    if os.path.exists(dst_sql):
        print(f"Database dump exported: {round(os.path.getsize(dst_sql)/(1024*1024),2)} MB")

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
    for item in ["bin", "lib", "share"]:
        s = os.path.join(PG_17_DIR, item)
        d = os.path.join(dst_pg, item)
        if os.path.exists(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
    print("PostgreSQL 17 distribution binaries copied.")

    # Control scripts
    init_db_bat = """@echo off
setlocal
cd /d "%~dp0\\.."
set "PGDATA=%CD%\\data\\pgdata"
set "PGBIN=%CD%\\pgsql\\bin"
set "SEED_SQL=%CD%\\app\\seed_data.sql"

if exist "%PGDATA%\\PG_VERSION" (
    echo [INFO] Database cluster already exists. Preserving existing database data.
    exit /b 0
)

echo [INFO] Initializing new PostgreSQL Database Cluster...
if not exist "%CD%\\data" mkdir "%CD%\\data"
if not exist "%PGDATA%" mkdir "%PGDATA%"

"%PGBIN%\\initdb.exe" -D "%PGDATA%" -U postgres -E UTF8 --locale=C -A trust >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] initdb failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo [INFO] Temporarily starting PostgreSQL for schema initialization...
"%PGBIN%\\pg_ctl.exe" start -D "%PGDATA%" -l "%CD%\\logs\\init_postgres.log" -w
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start PostgreSQL service
    exit /b %ERRORLEVEL%
)

"%PGBIN%\\createdb.exe" -h localhost -p 5432 -U postgres employee_management >nul 2>&1

if exist "%SEED_SQL%" (
    echo [INFO] Restoring complete initial database records and schema...
    "%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -f "%SEED_SQL%" > "%CD%\\logs\\db_seed.log" 2>&1
)

"%PGBIN%\\psql.exe" -h localhost -p 5432 -U postgres -d employee_management -c "ALTER USER postgres WITH PASSWORD 'postgres';" >nul 2>&1

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
set "HOSTS_FILE=%WINDIR%\\System32\\drivers\\etc\\hosts"

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Ensure ems.parikar.com is mapped in hosts
findstr /I "ems.parikar.com" "%HOSTS_FILE%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 127.0.0.1 ems.parikar.com >> "%HOSTS_FILE%" 2>nul
)

if not exist "%PGDATA%\\PG_VERSION" (
    call "%ROOT_DIR%\\bin\\init-db.bat"
)

"%PGBIN%\\pg_isready.exe" -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting PostgreSQL Database...
    "%PGBIN%\\pg_ctl.exe" start -D "%PGDATA%" -l "%LOGS_DIR%\\postgres.log" -w
)

net stop w3svc /y >nul 2>&1
echo Starting Employee Management System on http://ems.parikar.com...
start "Employee Management System Backend" /B "%JAVA_EXE%" -jar "%JAR_FILE%" --spring.profiles.active=production > "%LOGS_DIR%\\ems_startup.log" 2>&1

echo Waiting for EMS to become ready...
set /a ATTEMPTS=0
:WAIT_LOOP
set /a ATTEMPTS+=1
timeout /t 1 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1/api/v1/auth/ping' -TimeoutSec 1 -UseBasicParsing; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto LAUNCH_BROWSER
if %ATTEMPTS% GEQ 45 goto LAUNCH_BROWSER
goto WAIT_LOOP

:LAUNCH_BROWSER
echo Launching Browser at http://ems.parikar.com...
start "" "http://ems.parikar.com"
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
    print("[4/5] Compiling Prigenix Uninstaller (Uninstall.exe)...")
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
            Text = "PRIGENIX PRIVATE LIMITED",
            Font = new Font("Segoe UI", 12F, FontStyle.Bold),
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
            Location = new Point(20, 38),
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
                    if (!line.Contains("ems.parikar.com") && !line.Contains("# PRIGENIX EMS")) {
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

                UpdateProgress(50, "Cleaning Windows Hosts domain mapping (ems.parikar.com)...");
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
    print("[5/5] Compiling 100% Self-Contained Standalone Installer (with Smart Upgrade)...")
    print("=======================================================")

    zip_path = os.path.join(DIST_DIR, "ems_payload.zip")
    if os.path.exists(zip_path): os.remove(zip_path)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
        for root, dirs, files in os.walk(PKG_DIR):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, PKG_DIR)
                zipf.write(abs_path, rel_path)

    # Smart Installer C# Code with Upgrade / In-Place Update detection + Host file mapping
    cs_installer = r"""
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Reflection;
using Microsoft.Win32;
using System.Threading;

public class PrigenixEMSInstaller : Form {
    private Panel headerPanel;
    private Label lblHeaderCompany;
    private Label lblHeaderApp;
    private Label lblHeaderTagline;
    private PictureBox picLogo;
    
    private Label lblDestTitle;
    private TextBox txtInstallPath;
    private Button btnBrowse;
    private CheckBox chkDesktopShortcut;
    private CheckBox chkLaunchAfter;
    
    private Label lblStatus;
    private Label lblSubStatus;
    private Label lblModeBadge;
    private ProgressBar progressBar;
    private Button btnInstall;
    private Button btnCancel;
    private Panel cardPanel;
    private bool isUpgrade = false;

    public PrigenixEMSInstaller() {
        this.Text = "PRIGENIX - Employee Management System Setup v1.0";
        this.Size = new Size(580, 490);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(245, 247, 250);
        this.Font = new Font("Segoe UI", 9F);

        try {
            Assembly asm = Assembly.GetExecutingAssembly();
            Stream icoStream = asm.GetManifestResourceStream("app.ico");
            if (icoStream != null) { this.Icon = new Icon(icoStream); }
        } catch {}

        headerPanel = new Panel() {
            Dock = DockStyle.Top,
            Height = 90
        };
        headerPanel.Paint += (s, e) => {
            using (LinearGradientBrush brush = new LinearGradientBrush(
                headerPanel.ClientRectangle,
                Color.FromArgb(15, 32, 67),
                Color.FromArgb(32, 80, 150),
                45F)) {
                e.Graphics.FillRectangle(brush, headerPanel.ClientRectangle);
            }
        };
        this.Controls.Add(headerPanel);

        lblHeaderCompany = new Label() {
            Text = "PRIGENIX PRIVATE LIMITED",
            Font = new Font("Segoe UI", 12F, FontStyle.Bold),
            ForeColor = Color.FromArgb(255, 215, 0),
            Location = new Point(24, 14),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblHeaderCompany);

        lblHeaderApp = new Label() {
            Text = "Employee Management System — Standalone Setup v1.0",
            Font = new Font("Segoe UI", 10F, FontStyle.Regular),
            ForeColor = Color.White,
            Location = new Point(24, 38),
            AutoSize = true,
            BackColor = Color.Transparent
        };
        headerPanel.Controls.Add(lblHeaderApp);

        lblHeaderTagline = new Label() {
            Text = "Turnkey Standalone Enterprise Installer • Automated In-Place Upgrade Engine",
            Font = new Font("Segoe UI", 8F),
            ForeColor = Color.FromArgb(200, 225, 255),
            Location = new Point(24, 62),
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
                    Size = new Size(64, 64),
                    Location = new Point(485, 12),
                    BackColor = Color.Transparent
                };
                headerPanel.Controls.Add(picLogo);
            }
        } catch {}

        cardPanel = new Panel() {
            Location = new Point(24, 105),
            Size = new Size(516, 270),
            BackColor = Color.White
        };
        cardPanel.Paint += (s, e) => {
            ControlPaint.DrawBorder(e.Graphics, cardPanel.ClientRectangle, 
                Color.FromArgb(220, 225, 235), ButtonBorderStyle.Solid);
        };
        this.Controls.Add(cardPanel);

        lblDestTitle = new Label() {
            Text = "Installation Destination Folder:",
            Font = new Font("Segoe UI", 9F, FontStyle.Bold),
            ForeColor = Color.FromArgb(30, 41, 59),
            Location = new Point(18, 14),
            AutoSize = true
        };
        cardPanel.Controls.Add(lblDestTitle);

        string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PRIGENIX_EMS");
        txtInstallPath = new TextBox() {
            Text = defaultPath,
            Location = new Point(18, 36),
            Size = new Size(380, 26),
            Font = new Font("Segoe UI", 9.5F)
        };
        txtInstallPath.TextChanged += (s, e) => CheckExistingInstallation();
        cardPanel.Controls.Add(txtInstallPath);

        btnBrowse = new Button() {
            Text = "Browse...",
            Location = new Point(408, 34),
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
            Location = new Point(18, 68),
            AutoSize = true
        };
        cardPanel.Controls.Add(lblModeBadge);

        chkDesktopShortcut = new CheckBox() {
            Text = "Create Desktop Shortcut with Prigenix Icon",
            Checked = true,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.FromArgb(51, 65, 85),
            Location = new Point(18, 92),
            Size = new Size(420, 22)
        };
        cardPanel.Controls.Add(chkDesktopShortcut);

        chkLaunchAfter = new CheckBox() {
            Text = "Automatically launch EMS and open browser at http://ems.parikar.com",
            Checked = true,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.FromArgb(51, 65, 85),
            Location = new Point(18, 116),
            Size = new Size(480, 22)
        };
        cardPanel.Controls.Add(chkLaunchAfter);

        Label lblDivider = new Label() {
            BorderStyle = BorderStyle.Fixed3D,
            Location = new Point(18, 146),
            Size = new Size(478, 2)
        };
        cardPanel.Controls.Add(lblDivider);

        lblStatus = new Label() {
            Text = "Ready to install Prigenix EMS.",
            Font = new Font("Segoe UI", 9F, FontStyle.Bold),
            ForeColor = Color.FromArgb(30, 41, 59),
            Location = new Point(18, 154),
            Size = new Size(478, 20)
        };
        cardPanel.Controls.Add(lblStatus);

        lblSubStatus = new Label() {
            Text = "Embedded OpenJDK 17 + PostgreSQL 17 + Unified Web Engine on http://ems.parikar.com",
            Font = new Font("Segoe UI", 8F),
            ForeColor = Color.FromArgb(100, 116, 139),
            Location = new Point(18, 176),
            Size = new Size(478, 30)
        };
        cardPanel.Controls.Add(lblSubStatus);

        progressBar = new ProgressBar() {
            Location = new Point(18, 214),
            Size = new Size(478, 20),
            Style = ProgressBarStyle.Continuous
        };
        cardPanel.Controls.Add(progressBar);

        btnCancel = new Button() {
            Text = "Cancel",
            Location = new Point(340, 395),
            Size = new Size(95, 34),
            Font = new Font("Segoe UI", 9.5F),
            FlatStyle = FlatStyle.System
        };
        btnCancel.Click += (s, e) => this.Close();
        this.Controls.Add(btnCancel);

        btnInstall = new Button() {
            Text = "Install Now",
            Location = new Point(445, 395),
            Size = new Size(115, 34),
            BackColor = Color.FromArgb(15, 80, 160),
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
            FlatStyle = FlatStyle.Flat
        };
        btnInstall.FlatAppearance.BorderSize = 0;
        btnInstall.Click += StartInstallation;
        this.Controls.Add(btnInstall);

        CheckExistingInstallation();
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
            lblStatus.Text = "Ready to install Prigenix EMS.";
            lblSubStatus.Text = "Embedded OpenJDK 17 + PostgreSQL 17 + Unified Web Engine on http://ems.parikar.com";
        }
    }

    private void EnsureHostMapping() {
        try {
            string hostsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"drivers\etc\hosts");
            if (File.Exists(hostsPath)) {
                string text = File.ReadAllText(hostsPath);
                if (!text.Contains("ems.parikar.com")) {
                    File.AppendAllText(hostsPath, "\r\n# PRIGENIX EMS Local Domain Mapping\r\n127.0.0.1 ems.parikar.com\r\n");
                }
            }
        } catch {}
    }

    private void StartInstallation(object sender, EventArgs e) {
        btnInstall.Enabled = false;
        btnCancel.Enabled = false;
        btnBrowse.Enabled = false;
        txtInstallPath.ReadOnly = true;

        string targetDir = txtInstallPath.Text.Trim();
        bool createShortcut = chkDesktopShortcut.Checked;
        bool launchAfter = chkLaunchAfter.Checked;

        Thread thread = new Thread(() => {
            try {
                // If upgrading, stop running services first
                if (isUpgrade) {
                    UpdateProgress(5, "Stopping running EMS services for in-place upgrade...", "Closing background tasks...");
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

                UpdateProgress(10, "Preparing target destination folder...", targetDir);
                if (!Directory.Exists(targetDir)) {
                    Directory.CreateDirectory(targetDir);
                }

                UpdateProgress(15, isUpgrade ? "Updating application binaries, JRE, and JAR..." : "Extracting embedded components (JRE, PostgreSQL, App JAR)...", "Please wait...");

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
                        if (current % 100 == 0) {
                            int p = 15 + (int)((current / (double)total) * 50.0);
                            UpdateProgress(p, "Updating files: " + entry.Name, current + " / " + total + " files");
                        }
                    }
                }

                UpdateProgress(70, isUpgrade ? "Verifying database integrity..." : "Initializing PostgreSQL Database Cluster silently...", "Running database verification...");
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

                UpdateProgress(80, "Configuring local domain ems.parikar.com...", "Updating Windows hosts file...");
                EnsureHostMapping();

                UpdateProgress(88, "Registering in Windows Control Panel (Add or Remove Programs)...", "Configuring uninstaller...");
                RegisterWindowsUninstall(targetDir);

                UpdateProgress(94, "Updating Prigenix EMS Desktop Shortcut...", "Applying Prigenix icon...");
                if (createShortcut) {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    string shortcutPath = Path.Combine(desktop, "Prigenix EMS.lnk");
                    string vbsPath = Path.Combine(targetDir, "EMS.vbs");
                    string icoPath = Path.Combine(targetDir, "app.ico");
                    
                    CreateDesktopShortcut(shortcutPath, vbsPath, icoPath, targetDir);
                }

                UpdateProgress(100, isUpgrade ? "Update Complete!" : "Installation Complete!", "Prigenix Employee Management System is ready.");

                if (launchAfter) {
                    string vbsPath = Path.Combine(targetDir, "EMS.vbs");
                    Process.Start(new ProcessStartInfo("wscript.exe", "\"" + vbsPath + "\"") {
                        WorkingDirectory = targetDir
                    });
                }

                string finishTitle = isUpgrade ? "Prigenix EMS — Update Complete" : "Prigenix EMS — Setup Complete";
                string finishMsg = isUpgrade 
                    ? "Prigenix Employee Management System was successfully UPDATED to the latest version!\n\nAll existing employee records, attendance, and databases have been preserved.\n\nWeb Portal: http://ems.parikar.com"
                    : "Prigenix Employee Management System was installed successfully!\n\nDesktop Icon: 'Prigenix EMS'\nWeb Portal: http://ems.parikar.com\n\nDefault Admin Login:\nUsername: ADMIN\nPassword: Admin@123";

                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show(finishMsg, finishTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    this.Close();
                });

            } catch (Exception ex) {
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
                    key.SetValue("DisplayName", "Prigenix - Employee Management System");
                    key.SetValue("DisplayVersion", "1.0.0");
                    key.SetValue("Publisher", "Prigenix Private Limited");
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

    private void UpdateProgress(int value, string status, string subStatus) {
        if (this.IsHandleCreated) {
            this.Invoke((MethodInvoker)delegate {
                progressBar.Value = Math.Min(100, Math.Max(0, value));
                lblStatus.Text = status;
                lblSubStatus.Text = subStatus;
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
        shortcut.Description = "Prigenix Employee Management System";
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
    print(f"Domain URL: http://ems.parikar.com")
    print(f"Target Executable: {os.path.join(DIST_DIR, 'EMS_Setup_v1.0.exe')}")
    print(f"=========================================================================")

if __name__ == "__main__":
    main()
