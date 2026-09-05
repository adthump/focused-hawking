@echo off
start "" "msedge.exe" --app="file:///%~dp0index.html" --window-size=1280,860 2>nul || start "" "%~dp0index.html"
