@echo off
title AIOX Legal Performance - Plataforma Juridica
color 0E

echo.
echo  ============================================
echo   AIOX Legal Performance
echo   Plataforma Juridica Full-Service com IA
echo  ============================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js:
node --version

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo.
    echo  [INFO] Instalando dependencias pela primeira vez...
    echo  Isso pode levar 2-3 minutos.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo  [OK] Dependencias instaladas.
)

:: Criar .env se nao existir
if not exist ".env" (
    echo NODE_ENV=development > .env
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env
    echo AUTH_SECRET=apex-legal-performance-local-2026 >> .env
    echo  [OK] Arquivo .env criado.
)

echo.
echo  ============================================
echo   Iniciando servidor...
echo   Acesse: http://localhost:3000
echo   Login:  admin@aiox.legal / admin123
echo  ============================================
echo.
echo   Pressione Ctrl+C para parar o servidor.
echo.

:: Abrir navegador automaticamente apos 5 segundos
start "" /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

:: Iniciar o servidor
call npm run dev
