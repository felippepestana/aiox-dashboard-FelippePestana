@echo off
title AIOX Legal - Instalacao Windows
color 0E

echo.
echo  ============================================
echo   AIOX Legal Performance
echo   Instalacao Automatica - Windows 11
echo  ============================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Node.js nao encontrado.
    echo.
    echo  Abra o navegador e instale:
    echo  https://nodejs.org
    echo.
    echo  Apos instalar, execute este script novamente.
    start https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js:
node --version

:: Verificar Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Git nao encontrado.
    echo.
    echo  Abra o navegador e instale:
    echo  https://git-scm.com/download/win
    echo.
    echo  Apos instalar, execute este script novamente.
    start https://git-scm.com/download/win
    pause
    exit /b 1
)
echo  [OK] Git:
git --version

echo.
echo  [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo  [ERRO] Falha na instalacao de dependencias.
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas.

echo.
echo  [2/4] Criando configuracao...
if not exist ".env" (
    echo NODE_ENV=development > .env
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env
    echo AUTH_SECRET=apex-legal-performance-local-2026 >> .env
)
echo  [OK] Configuracao criada.

echo.
echo  [3/4] Criando pasta de uploads...
if not exist "uploads" mkdir uploads
echo  [OK] Pasta uploads criada.

echo.
echo  [4/4] Criando atalho na Area de Trabalho...
set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop

:: Criar arquivo .bat simples no Desktop
echo @echo off > "%DESKTOP%\AIOX Legal.bat"
echo title AIOX Legal Performance >> "%DESKTOP%\AIOX Legal.bat"
echo cd /d "%SCRIPT_DIR%" >> "%DESKTOP%\AIOX Legal.bat"
echo call start.bat >> "%DESKTOP%\AIOX Legal.bat"
echo  [OK] Atalho criado na Area de Trabalho.

echo.
echo  ============================================
echo   INSTALACAO CONCLUIDA!
echo  ============================================
echo.
echo   Para iniciar a plataforma:
echo.
echo   Opcao 1: Duplo clique em "AIOX Legal" na Area de Trabalho
echo   Opcao 2: Execute start.bat nesta pasta
echo   Opcao 3: Abra o cmd aqui e digite: npm run dev
echo.
echo   Acesso: http://localhost:3000
echo   Login:  admin@aiox.legal
echo   Senha:  admin123
echo.
echo  ============================================
echo.

set /p INICIAR="  Deseja iniciar a plataforma agora? (S/N): "
if /i "%INICIAR%"=="S" (
    call start.bat
)
