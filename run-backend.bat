@echo off
SET PATH=%TEMP%\maven\apache-maven-3.9.9\bin;%PATH%
cd /d H:\PARIKAR\employee-management-api
start /B javaw -Dspring.profiles.active=h2 -Dserver.port=8082 -jar target\employee-management-api-1.0.0.jar > %TEMP%\backend_out.log 2>&1
