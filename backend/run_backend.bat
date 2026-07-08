@echo off
echo ========================================================
echo Menjalankan Jejak Tani Backend dengan Node.js v22 (Portable)
echo ========================================================

echo.
echo Menjalankan Seeding Database...
.\node-v22.14.0-win-x64\node.exe src\seed.js

echo.
echo Memulai Server Backend...
.\node-v22.14.0-win-x64\node.exe --watch src\index.js
