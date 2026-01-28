@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

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
echo   7) Ver explicacao do fluxo de trabalho
echo   8) Sair
echo.
set /p opcao="Opcao: "

if "%opcao%"=="1" goto STATUS
if "%opcao%"=="2" goto MAIN
if "%opcao%"=="3" goto CYPRESS
if "%opcao%"=="4" goto PLAYWRIGHT
if "%opcao%"=="5" goto SELENIUM
if "%opcao%"=="6" goto UPDATE_ALL
if "%opcao%"=="7" goto WORKFLOW
if "%opcao%"=="8" goto FIM
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

:UPDATE_ALL
cls
echo ============================================
echo  Atualizando TODAS as branches de teste
echo ============================================
echo.
echo ATENCAO: Certifique-se de que nao ha alteracoes pendentes!
echo.
set /p confirma="Deseja continuar? (S/N): "
if /i not "%confirma%"=="S" goto MENU

echo.
echo [1/4] Atualizando main...
git checkout main
git pull origin main
echo.

echo [2/4] Atualizando cypress-tests...
git checkout cypress-tests
git merge main -m "merge: atualiza cypress-tests com alteracoes da main"
git push origin cypress-tests
echo.

echo [3/4] Atualizando playwright-tests...
git checkout playwright-tests
git merge main -m "merge: atualiza playwright-tests com alteracoes da main"
git push origin playwright-tests
echo.

echo [4/4] Atualizando selenium-tests...
git checkout selenium-tests
git merge main -m "merge: atualiza selenium-tests com alteracoes da main"
git push origin selenium-tests
echo.

echo Voltando para main...
git checkout main
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
echo   3. Apos finalizar algo na main, atualize as branches de teste
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
echo FLUXO PARA CRIAR TESTES:
echo ============================================
echo.
echo   # Primeiro, atualize a branch de teste com a main
echo   git checkout cypress-tests
echo   git merge main
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
echo           +------------------+------------------+
echo           ^|                  ^|                  ^|
echo           v                  v                  v
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
