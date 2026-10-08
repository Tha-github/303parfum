@echo off
REM ==================================================================
REM  303 PARFUM - abre o site completo no navegador (duplo clique)
REM  Requer Node.js 20.19+ instalado: https://nodejs.org
REM ==================================================================
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [303 Parfum] Node.js nao encontrado. Instale em https://nodejs.org e rode de novo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo [303 Parfum] Instalando dependencias - so na primeira vez...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)
echo [303 Parfum] Abrindo o site em http://localhost:5173 - feche esta janela para parar.
call npm start
pause
