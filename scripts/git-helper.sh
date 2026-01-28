#!/bin/bash

# ============================================================================
# GIT HELPER - ProjectGO
# Script para gerenciar branches de desenvolvimento e testes
# ============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Branches de teste
TEST_BRANCHES=("cypress-tests" "playwright-tests" "selenium-tests")

# ============================================================================
# FUNCOES
# ============================================================================

show_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}       ProjectGO - Git Helper               ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

show_menu() {
    echo -e "${YELLOW}Escolha uma opcao:${NC}"
    echo ""
    echo "  1) Ver status atual (branch e alteracoes)"
    echo "  2) Trocar para branch main (desenvolvimento)"
    echo "  3) Trocar para branch cypress-tests"
    echo "  4) Trocar para branch playwright-tests"
    echo "  5) Trocar para branch selenium-tests"
    echo "  6) Atualizar TODAS as branches de teste com main"
    echo "  7) Atualizar UMA branch de teste com main"
    echo "  8) Ver explicacao do fluxo de trabalho"
    echo "  9) Sair"
    echo ""
}

show_status() {
    echo -e "${BLUE}=== Status Atual ===${NC}"
    echo ""
    echo -e "${YELLOW}Branch atual:${NC}"
    git branch --show-current
    echo ""
    echo -e "${YELLOW}Todas as branches:${NC}"
    git branch -v
    echo ""
    echo -e "${YELLOW}Alteracoes pendentes:${NC}"
    git status -s
    if [ -z "$(git status -s)" ]; then
        echo -e "${GREEN}Nenhuma alteracao pendente${NC}"
    fi
    echo ""
}

switch_branch() {
    local branch=$1
    echo -e "${BLUE}Trocando para branch: ${branch}${NC}"

    # Verifica se há alterações não commitadas
    if [ -n "$(git status -s)" ]; then
        echo -e "${RED}ATENCAO: Voce tem alteracoes nao commitadas!${NC}"
        echo "Opcoes:"
        echo "  1) Fazer commit antes de trocar"
        echo "  2) Descartar alteracoes (CUIDADO!)"
        echo "  3) Cancelar"
        read -p "Escolha: " choice
        case $choice in
            1)
                read -p "Mensagem do commit: " msg
                git add .
                git commit -m "$msg"
                ;;
            2)
                git checkout .
                git clean -fd
                ;;
            3)
                echo "Operacao cancelada."
                return
                ;;
        esac
    fi

    git checkout $branch
    git pull origin $branch 2>/dev/null || true
    echo -e "${GREEN}Agora voce esta na branch: $branch${NC}"
}

update_all_test_branches() {
    echo -e "${BLUE}=== Atualizando TODAS as branches de teste ===${NC}"
    echo ""

    # Salva branch atual
    current_branch=$(git branch --show-current)

    # Verifica alterações pendentes
    if [ -n "$(git status -s)" ]; then
        echo -e "${RED}ERRO: Voce tem alteracoes nao commitadas.${NC}"
        echo "Faca commit ou descarte as alteracoes antes de continuar."
        return
    fi

    # Atualiza main primeiro
    echo -e "${YELLOW}1. Atualizando main...${NC}"
    git checkout main
    git pull origin main
    echo ""

    # Atualiza cada branch de teste
    for branch in "${TEST_BRANCHES[@]}"; do
        echo -e "${YELLOW}2. Atualizando $branch...${NC}"
        git checkout $branch
        git merge main -m "merge: atualiza $branch com alteracoes da main"
        git push origin $branch
        echo -e "${GREEN}   $branch atualizada!${NC}"
        echo ""
    done

    # Volta para branch original
    git checkout $current_branch
    echo -e "${GREEN}=== Todas as branches atualizadas! ===${NC}"
    echo -e "Voce esta de volta na branch: $current_branch"
}

update_single_test_branch() {
    echo -e "${BLUE}Qual branch deseja atualizar?${NC}"
    echo "  1) cypress-tests"
    echo "  2) playwright-tests"
    echo "  3) selenium-tests"
    read -p "Escolha: " choice

    case $choice in
        1) branch="cypress-tests" ;;
        2) branch="playwright-tests" ;;
        3) branch="selenium-tests" ;;
        *) echo "Opcao invalida"; return ;;
    esac

    # Salva branch atual
    current_branch=$(git branch --show-current)

    # Verifica alterações pendentes
    if [ -n "$(git status -s)" ]; then
        echo -e "${RED}ERRO: Voce tem alteracoes nao commitadas.${NC}"
        return
    fi

    echo -e "${YELLOW}Atualizando $branch com main...${NC}"

    # Atualiza main
    git checkout main
    git pull origin main

    # Atualiza branch de teste
    git checkout $branch
    git merge main -m "merge: atualiza $branch com alteracoes da main"
    git push origin $branch

    # Volta para branch original
    git checkout $current_branch

    echo -e "${GREEN}Branch $branch atualizada!${NC}"
}

show_workflow() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}       FLUXO DE TRABALHO - ProjectGO        ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    echo -e "${YELLOW}ESTRUTURA DAS BRANCHES:${NC}"
    echo ""
    echo "  main                -> Codigo da aplicacao (backend + frontend)"
    echo "  cypress-tests       -> Testes automatizados com Cypress"
    echo "  playwright-tests    -> Testes automatizados com Playwright"
    echo "  selenium-tests      -> Testes automatizados com Selenium"
    echo ""
    echo -e "${YELLOW}REGRAS IMPORTANTES:${NC}"
    echo ""
    echo "  1. NUNCA altere codigo da aplicacao nas branches de teste"
    echo "  2. Desenvolvimento da aplicacao SEMPRE na branch main"
    echo "  3. Apos finalizar algo na main, atualize as branches de teste"
    echo ""
    echo -e "${YELLOW}FLUXO PARA DESENVOLVER A APLICACAO:${NC}"
    echo ""
    echo "  git checkout main"
    echo "  # ... trabalha no codigo ..."
    echo "  git add ."
    echo "  git commit -m 'sua mensagem'"
    echo "  git push origin main"
    echo ""
    echo -e "${YELLOW}FLUXO PARA CRIAR TESTES:${NC}"
    echo ""
    echo "  # Primeiro, atualize a branch de teste com a main"
    echo "  git checkout cypress-tests  # ou playwright-tests ou selenium-tests"
    echo "  git merge main"
    echo "  # ... cria os testes ..."
    echo "  git add ."
    echo "  git commit -m 'test: sua mensagem'"
    echo "  git push origin cypress-tests"
    echo ""
    echo -e "${YELLOW}COMANDOS PARA EXECUTAR TESTES:${NC}"
    echo ""
    echo "  CYPRESS:"
    echo "    cd frontend"
    echo "    npx cypress open       # Interface grafica"
    echo "    npx cypress run        # Terminal"
    echo ""
    echo "  PLAYWRIGHT:"
    echo "    cd frontend"
    echo "    npx playwright test            # Executa testes"
    echo "    npx playwright test --headed   # Com browser visivel"
    echo "    npx playwright show-report     # Ver relatorio"
    echo ""
    echo "  SELENIUM:"
    echo "    cd frontend/selenium"
    echo "    npm install            # Primeira vez"
    echo "    npm test               # Executa testes"
    echo ""
    echo -e "${YELLOW}DIAGRAMA:${NC}"
    echo ""
    echo "                      +------------------+"
    echo "                      |       main       |"
    echo "                      |   (aplicacao)    |"
    echo "                      +--------+---------+"
    echo "                               |"
    echo "            +------------------+------------------+"
    echo "            |                  |                  |"
    echo "            v                  v                  v"
    echo "   +----------------+ +----------------+ +----------------+"
    echo "   | cypress-tests  | |playwright-tests| | selenium-tests |"
    echo "   +----------------+ +----------------+ +----------------+"
    echo ""
}

# ============================================================================
# MAIN
# ============================================================================

show_header

while true; do
    show_menu
    read -p "Opcao: " option
    echo ""

    case $option in
        1) show_status ;;
        2) switch_branch "main" ;;
        3) switch_branch "cypress-tests" ;;
        4) switch_branch "playwright-tests" ;;
        5) switch_branch "selenium-tests" ;;
        6) update_all_test_branches ;;
        7) update_single_test_branch ;;
        8) show_workflow ;;
        9) echo -e "${GREEN}Ate mais!${NC}"; exit 0 ;;
        *) echo -e "${RED}Opcao invalida${NC}" ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    echo ""
done
