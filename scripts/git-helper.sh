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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Branches de teste
TEST_BRANCHES=("cypress-tests" "playwright-tests" "selenium-tests")

# Commit base (onde os testes foram removidos da main)
# Este e o ponto de divergencia entre main e branches de teste
BASE_COMMIT="9c41f66"

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
    echo "  8) Ver commits pendentes para sincronizar"
    echo "  9) Ver explicacao do fluxo de trabalho"
    echo "  0) Sair"
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

# Encontra commits na main que ainda nao estao na branch de teste
get_pending_commits() {
    local test_branch=$1
    # Pega commits da main apos o BASE_COMMIT que nao estao na branch de teste
    # Exclui o proprio commit base (que remove os testes)
    git log --oneline ${BASE_COMMIT}..main --ancestry-path 2>/dev/null | grep -v "remove test files"
}

show_pending_commits() {
    echo -e "${BLUE}=== Commits Pendentes para Sincronizar ===${NC}"
    echo ""

    # Atualiza main
    git fetch origin main 2>/dev/null

    echo -e "${YELLOW}Commits na main apos a separacao das branches:${NC}"
    echo ""

    pending=$(git log --oneline ${BASE_COMMIT}..origin/main 2>/dev/null | grep -v "remove test files")

    if [ -z "$pending" ]; then
        echo -e "${GREEN}Nenhum commit novo na main para sincronizar.${NC}"
    else
        echo "$pending"
        echo ""
        echo -e "${CYAN}Estes commits serao aplicados nas branches de teste.${NC}"
    fi
    echo ""
}

# Funcao principal de atualizacao usando cherry-pick
update_test_branch() {
    local branch=$1

    echo -e "${YELLOW}Atualizando $branch...${NC}"

    # Salva branch atual
    local current=$(git branch --show-current)

    # Vai para main e atualiza
    git checkout main 2>/dev/null
    git pull origin main 2>/dev/null

    # Pega lista de commits para aplicar (do mais antigo para o mais novo)
    local commits=$(git log --oneline --reverse ${BASE_COMMIT}..main 2>/dev/null | grep -v "remove test files" | awk '{print $1}')

    if [ -z "$commits" ]; then
        echo -e "${GREEN}   Nenhum commit novo para aplicar em $branch${NC}"
        git checkout $current 2>/dev/null
        return 0
    fi

    # Vai para branch de teste
    git checkout $branch 2>/dev/null
    git pull origin $branch 2>/dev/null

    # Aplica cada commit via cherry-pick
    local success=true
    for commit in $commits; do
        # Verifica se o commit ja foi aplicado (pelo titulo)
        local commit_msg=$(git log --format=%s -n 1 $commit)
        local already_applied=$(git log --oneline $branch | grep -F "$commit_msg" | head -1)

        if [ -n "$already_applied" ]; then
            echo -e "${CYAN}   Commit ja aplicado: $commit_msg${NC}"
            continue
        fi

        echo -e "   Aplicando: ${commit} - ${commit_msg}"

        if ! git cherry-pick $commit --no-commit 2>/dev/null; then
            # Se houver conflito, tenta resolver automaticamente
            # mantendo os arquivos de teste
            git checkout --ours . 2>/dev/null
            git add . 2>/dev/null
        fi

        # Commita o cherry-pick
        git commit -m "$commit_msg" --allow-empty 2>/dev/null || true
    done

    # Push das alteracoes
    git push origin $branch 2>/dev/null

    echo -e "${GREEN}   $branch atualizada!${NC}"

    # Volta para branch original
    git checkout $current 2>/dev/null
}

update_all_test_branches() {
    echo -e "${BLUE}=== Atualizando TODAS as branches de teste ===${NC}"
    echo ""
    echo -e "${CYAN}IMPORTANTE: Este script usa cherry-pick para preservar os testes.${NC}"
    echo -e "${CYAN}Commits da main serao aplicados individualmente.${NC}"
    echo ""

    # Verifica alterações pendentes
    if [ -n "$(git status -s)" ]; then
        echo -e "${RED}ERRO: Voce tem alteracoes nao commitadas.${NC}"
        echo "Faca commit ou descarte as alteracoes antes de continuar."
        return
    fi

    # Salva branch atual
    current_branch=$(git branch --show-current)

    # Mostra commits que serao aplicados
    show_pending_commits

    read -p "Deseja continuar? (s/n): " confirm
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        echo "Operacao cancelada."
        return
    fi
    echo ""

    # Atualiza cada branch de teste
    local count=1
    for branch in "${TEST_BRANCHES[@]}"; do
        echo -e "${YELLOW}[$count/3] Processando $branch...${NC}"
        update_test_branch $branch
        echo ""
        ((count++))
    done

    # Volta para branch original
    git checkout $current_branch 2>/dev/null
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

    # Verifica alterações pendentes
    if [ -n "$(git status -s)" ]; then
        echo -e "${RED}ERRO: Voce tem alteracoes nao commitadas.${NC}"
        return
    fi

    # Salva branch atual
    current_branch=$(git branch --show-current)

    echo ""
    update_test_branch $branch

    # Volta para branch original
    git checkout $current_branch 2>/dev/null
    echo -e "${GREEN}Concluido!${NC}"
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
    echo "  3. Apos finalizar algo na main, use este script para atualizar"
    echo ""
    echo -e "${YELLOW}FLUXO PARA DESENVOLVER A APLICACAO:${NC}"
    echo ""
    echo "  git checkout main"
    echo "  # ... trabalha no codigo ..."
    echo "  git add ."
    echo "  git commit -m 'sua mensagem'"
    echo "  git push origin main"
    echo ""
    echo -e "${YELLOW}FLUXO PARA ATUALIZAR BRANCHES DE TESTE:${NC}"
    echo ""
    echo "  # Use este script! (opcao 6)"
    echo "  # O script usa cherry-pick para preservar os testes"
    echo "  # NAO use 'git merge main' diretamente!"
    echo ""
    echo -e "${YELLOW}FLUXO PARA CRIAR TESTES:${NC}"
    echo ""
    echo "  git checkout cypress-tests  # ou outra branch de teste"
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
    echo "                         cherry-pick"
    echo "                       (NAO use merge!)"
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
        8) show_pending_commits ;;
        9) show_workflow ;;
        0) echo -e "${GREEN}Ate mais!${NC}"; exit 0 ;;
        *) echo -e "${RED}Opcao invalida${NC}" ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    echo ""
done
