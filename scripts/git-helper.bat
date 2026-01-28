@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================================
:: GIT HELPER - ProjectGO
:: Script para gerenciar branches de desenvolvimento e testes
:: IMPORTANTE: Usa cherry-pick para preservar os testes nas branches
:: ============================================================================

:: Commit base (onde os testes foram removidos da main)
set BASE_COMMIT=9c41f66

:MENU
cls
echo.
echo ============================================
echo        ProjectGO - Git Helper
echo ============================================
echo.
echo  Escolha uma opcao:
echo.
echo   1) Ver status atual (branch e alteracoes)
echo   2) Trocar para branch main (desenvolvimento)
echo   3) Trocar para branch cypress-tests
echo   4) Trocar para branch playwright-tests
echo   5) Trocar para branch selenium-tests
echo   6) Atualizar TODAS as branches de teste com main
echo   7) Atualizar UMA branch de teste com main
echo   8) Ver commits pendentes para sincronizar
echo   9) Ver explicacao do fluxo de trabalho
echo   0) Sair
echo.
set /p opcao="Opcao: "

if "%opcao%"=="1" goto STATUS
if "%opcao%"=="2" goto MAIN
if "%opcao%"=="3" goto CYPRESS
if "%opcao%"=="4" goto PLAYWRIGHT
if "%opcao%"=="5" goto SELENIUM
if "%opcao%"=="6" goto UPDATE_ALL
if "%opcao%"=="7" goto UPDATE_ONE
if "%opcao%"=="8" goto PENDING
if "%opcao%"=="9" goto WORKFLOW
if "%opcao%"=="0" goto FIM
goto MENU

:STATUS
cls
echo.
echo === Status Atual ===
echo.
echo Branch atual:
git branch --show-current
echo.
echo Todas as branches:
git branch -v
echo.
echo Alteracoes pendentes:
git status -s
echo.
pause
goto MENU

:MAIN
cls
echo Trocando para branch main...
git checkout main
git pull origin main
echo.
echo Voce esta na branch main (desenvolvimento da aplicacao)
echo.
pause
goto MENU

:CYPRESS
cls
echo Trocando para branch cypress-tests...
git checkout cypress-tests
git pull origin cypress-tests
echo.
echo Voce esta na branch cypress-tests
echo.
echo Para executar testes:
echo   cd frontend
echo   npx cypress open   (interface grafica)
echo   npx cypress run    (terminal)
echo.
pause
goto MENU

:PLAYWRIGHT
cls
echo Trocando para branch playwright-tests...
git checkout playwright-tests
git pull origin playwright-tests
echo.
echo Voce esta na branch playwright-tests
echo.
echo Para executar testes:
echo   cd frontend
echo   npx playwright test
echo   npx playwright test --headed
echo   npx playwright show-report
echo.
pause
goto MENU

:SELENIUM
cls
echo Trocando para branch selenium-tests...
git checkout selenium-tests
git pull origin selenium-tests
echo.
echo Voce esta na branch selenium-tests
echo.
echo Para executar testes:
echo   cd frontend/selenium
echo   npm install  (primeira vez)
echo   npm test
echo.
pause
goto MENU

:PENDING
cls
echo === Commits Pendentes para Sincronizar ===
echo.
echo Buscando commits na main...
git fetch origin main 2>nul
echo.
echo Commits na main apos a separacao das branches:
echo.
git log --oneline %BASE_COMMIT%..origin/main 2>nul | findstr /v "remove test files"
echo.
echo Estes commits serao aplicados nas branches de teste via cherry-pick.
echo.
pause
goto MENU

:UPDATE_ONE
cls
echo Qual branch deseja atualizar?
echo   1) cypress-tests
echo   2) playwright-tests
echo   3) selenium-tests
echo.
set /p branch_choice="Escolha: "
set "branch="

if "%branch_choice%"=="1" set "branch=cypress-tests"
if "%branch_choice%"=="2" set "branch=playwright-tests"
if "%branch_choice%"=="3" set "branch=selenium-tests"

if "%branch%"=="" (
    echo Opcao invalida
    pause
    goto MENU
)

:: Salva branch atual
for /f "tokens=*" %%i in ('git branch --show-current') do set "current_branch=%%i"

echo.
echo Atualizando %branch%...
echo.

:: Atualiza main
git checkout main 2>nul
git pull origin main 2>nul

:: Vai para branch de teste
git checkout %branch% 2>nul
git pull origin %branch% 2>nul

:: Aplica commits via cherry-pick
for /f "tokens=1,*" %%a in ('git log --oneline --reverse %BASE_COMMIT%..main 2^>nul') do (
    echo %%b | findstr /c:"remove test files" >nul 2>&1
    if errorlevel 1 (
        git log --oneline %branch% | findstr /c:"%%b" >nul 2>&1
        if errorlevel 1 (
            echo   Aplicando: %%a - %%b
            git cherry-pick %%a 2>nul
            if errorlevel 1 (
                git cherry-pick --abort 2>nul
                echo   [AVISO] Conflito em %%a - pulando
            )
        ) else (
            echo   Ja aplicado: %%b
        )
    )
)

git push origin %branch% 2>nul
echo.
echo %branch% atualizada!

:: Volta para branch original
git checkout %current_branch% 2>nul
echo.
pause
goto MENU

:UPDATE_ALL
cls
echo ============================================
echo  Atualizando TODAS as branches de teste
echo ============================================
echo.
echo IMPORTANTE: Este script usa cherry-pick para preservar os testes.
echo Commits da main serao aplicados individualmente.
echo.
echo NAO use 'git merge main' diretamente nas branches de teste!
echo.
set /p confirma="Deseja continuar? (S/N): "
if /i not "%confirma%"=="S" goto MENU

:: Salva branch atual
for /f "tokens=*" %%i in ('git branch --show-current') do set "current_branch=%%i"

echo.
echo [1/4] Atualizando main...
git checkout main
git pull origin main
echo.

:: Lista commits para aplicar
echo Commits a serem aplicados:
git log --oneline --reverse %BASE_COMMIT%..main 2>nul | findstr /v "remove test files"
echo.

:: Atualiza cada branch
for %%b in (cypress-tests playwright-tests selenium-tests) do (
    echo ============================================
    echo Processando %%b...
    echo ============================================

    git checkout %%b 2>nul
    git pull origin %%b 2>nul

    for /f "tokens=1,*" %%c in ('git log --oneline --reverse %BASE_COMMIT%..main 2^>nul') do (
        echo %%d | findstr /c:"remove test files" >nul 2>&1
        if errorlevel 1 (
            git log --oneline %%b | findstr /c:"%%d" >nul 2>&1
            if errorlevel 1 (
                echo   Aplicando: %%c - %%d
                git cherry-pick %%c 2>nul
                if errorlevel 1 (
                    git cherry-pick --abort 2>nul
                    echo   [AVISO] Conflito - pulando
                )
            ) else (
                echo   Ja aplicado: %%d
            )
        )
    )

    git push origin %%b 2>nul
    echo %%b atualizada!
    echo.
)

echo Voltando para %current_branch%...
git checkout %current_branch% 2>nul
echo.
echo ============================================
echo  TODAS AS BRANCHES ATUALIZADAS COM SUCESSO!
echo ============================================
echo.
pause
goto MENU

:WORKFLOW
cls
echo.
echo ============================================
echo     FLUXO DE TRABALHO - ProjectGO
echo ============================================
echo.
echo ESTRUTURA DAS BRANCHES:
echo.
echo   main                -^> Codigo da aplicacao (backend + frontend)
echo   cypress-tests       -^> Testes automatizados com Cypress
echo   playwright-tests    -^> Testes automatizados com Playwright
echo   selenium-tests      -^> Testes automatizados com Selenium
echo.
echo ============================================
echo REGRAS IMPORTANTES:
echo ============================================
echo.
echo   1. NUNCA altere codigo da aplicacao nas branches de teste
echo   2. Desenvolvimento da aplicacao SEMPRE na branch main
echo   3. Apos finalizar algo na main, use este script para atualizar
echo   4. NAO use 'git merge main' diretamente - use este script!
echo.
echo ============================================
echo FLUXO PARA DESENVOLVER A APLICACAO:
echo ============================================
echo.
echo   git checkout main
echo   # ... trabalha no codigo ...
echo   git add .
echo   git commit -m "sua mensagem"
echo   git push origin main
echo.
echo ============================================
echo FLUXO PARA ATUALIZAR BRANCHES DE TESTE:
echo ============================================
echo.
echo   # Use este script! (opcao 6)
echo   # O script usa cherry-pick para preservar os testes
echo   # NAO use 'git merge main' diretamente!
echo.
echo ============================================
echo FLUXO PARA CRIAR TESTES:
echo ============================================
echo.
echo   git checkout cypress-tests
echo   # ... cria os testes ...
echo   git add .
echo   git commit -m "test: sua mensagem"
echo   git push origin cypress-tests
echo.
echo ============================================
echo DIAGRAMA:
echo ============================================
echo.
echo                     +------------------+
echo                     ^|       main       ^|
echo                     ^|   (aplicacao)    ^|
echo                     +--------+---------+
echo                              ^|
echo                        cherry-pick
echo                      (NAO use merge!)
echo                              ^|
echo          +------------------+------------------+
echo          ^|                  ^|                  ^|
echo          v                  v                  v
echo  +----------------+ +----------------+ +----------------+
echo  ^| cypress-tests  ^| ^|playwright-tests^| ^| selenium-tests ^|
echo  +----------------+ +----------------+ +----------------+
echo.
pause
goto MENU

:FIM
echo.
echo Ate mais!
exit /b 0
