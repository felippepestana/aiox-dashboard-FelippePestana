@echo off
title AIOX Legal - Diagnostico e Reparo
color 0E

echo.
echo  ============================================
echo   AIOX Legal - Diagnostico e Reparo
echo  ============================================
echo.

:: Check Node version
echo  [1/6] Verificando Node.js...
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
if "%NODE_VER%"=="" (
    echo  [ERRO] Node.js nao encontrado! Instale em https://nodejs.org
    pause
    exit /b 1
)
echo  Node.js: %NODE_VER%

:: Check npm
echo  [2/6] Verificando npm...
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VER=%%i
echo  npm: %NPM_VER%

:: Clean cache
echo  [3/6] Limpando cache...
if exist ".next" (
    rmdir /s /q .next
    echo  Cache .next removido
)
if exist "node_modules\.cache" (
    rmdir /s /q node_modules\.cache
    echo  Cache node_modules removido
)

:: Reinstall dependencies
echo  [4/6] Reinstalando dependencias (pode levar 2-3 min)...
call npm install --force
if %errorlevel% neq 0 (
    echo  [ERRO] Falha na instalacao. Tentando limpar tudo...
    if exist "node_modules" rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
    call npm install
)

:: Create .env if missing
echo  [5/6] Verificando .env...
if not exist ".env" (
    echo NODE_ENV=development > .env
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env
    echo AUTH_SECRET=apex-legal-performance-local-2026 >> .env
    echo  .env criado
) else (
    echo  .env existe
)

:: Test build
echo  [6/6] Testando compilacao...
call npx tsc --noEmit 2>nul
if %errorlevel% equ 0 (
    echo  [OK] TypeScript compila sem erros
) else (
    echo  [AVISO] Erros de tipo detectados (pode ser normal em dev)
)

echo.
echo  ============================================
echo   Diagnostico completo!
echo  ============================================
echo.
echo   Para iniciar: npm run dev
echo   Acesse: http://localhost:3000
echo   Login: admin@aiox.legal / admin123
echo.
echo   Se ainda tiver erro, execute:
echo     npm run dev 2^> erro.log
echo   E me envie o arquivo erro.log
echo.

set /p INICIAR="  Iniciar servidor agora? (S/N): "
if /i "%INICIAR%"=="S" (
    call npm run dev
)
