#!/usr/bin/env bash
# =========================================================================
# QuizSync Git Environment Bootstrapper (Linux/macOS)
# Initializes Git repository, configures gitignores, stages code, and commits.
# =========================================================================

set -e

# ANSI escape codes for beautiful formatting
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
CYAN="\033[36m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${CYAN}            QuizSync Local Git Bootstrap Service                ${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}"

# 1. Verify Git Installation
if ! command -v git &> /dev/null; then
    echo -e "${BOLD}${YELLOW}[ERROR] git binary not found in system path! Please install git.${RESET}"
    exit 1
fi

# 2. Check if already initialized
if [ -d ".git" ]; then
    echo -e "${BOLD}${BLUE}[INFO] Git repository already initialized in this directory.${RESET}"
else
    echo -e "${BOLD}${BLUE}[ACTION] Initializing local Git repository...${RESET}"
    git init
fi

# 3. Verify/Write .gitignore
echo -e "${BOLD}${BLUE}[ACTION] Checking .gitignore configuration...${RESET}"
if [ ! -f ".gitignore" ]; then
    cat << 'EOF' > .gitignore
# Node dependencies
node_modules/

# Local configuration files
.env
.env.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*

# System
.DS_Store
EOF
    echo -e "${BOLD}${GREEN}[SUCCESS] .gitignore file created successfully.${RESET}"
else
    echo -e "${BOLD}${GREEN}[INFO] .gitignore already exists.${RESET}"
fi

# 4. Copy environment defaults
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${BOLD}${BLUE}[ACTION] Creating local .env from example template...${RESET}"
    cp .env.example .env
    echo -e "${BOLD}${GREEN}[SUCCESS] Local .env configured.${RESET}"
fi

# 5. Stage and Commit
echo -e "${BOLD}${BLUE}[ACTION] Staging boilerplate files...${RESET}"
git add .

echo -e "${BOLD}${BLUE}[ACTION] Creating initial commit...${RESET}"
# Check if user has configured git name/email to avoid breaking commit
git config user.email >/dev/null 2>&1 || git config --global user.email "developer@quizsync.local"
git config user.name >/dev/null 2>&1 || git config --global user.name "QuizSync Developer"

git commit -m "chore: bootstrap project with secure modular layout"
echo -e "${BOLD}${GREEN}[SUCCESS] Initial commit created successfully!${RESET}"

echo -e "\n${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${GREEN}           COLLABORATIVE ENVIRONMENT BOOTSTRAPPING COMPLETE     ${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}\n"

echo -e "${BOLD}Next Steps for Your Team Members:${RESET}"
echo -e "  1. Link this repository to your team's remote GitHub repository:"
echo -e "     ${CYAN}git remote add origin <your-private-github-repository-url>${RESET}"
echo -e "  2. Determine your isolated developer workspace branch based on your role:"
echo -e "     - ${BOLD}Developer 1 (Frontend Layout):${RESET} ${BLUE}feature/frontend-ui${RESET}"
echo -e "     - ${BOLD}Developer 2 (Client Logic):${RESET}     ${BLUE}feature/client-app${RESET}"
echo -e "     - ${BOLD}Developer 3 (Backend API):${RESET}       ${BLUE}feature/backend-api${RESET}"
echo -e "     - ${BOLD}Developer 4 (DevOps & Infra):${RESET}    ${BLUE}feature/devops-infra${RESET}"
echo -e "  3. Create and check out your dedicated branch:"
echo -e "     ${CYAN}git checkout -b <your-role-branch-name>${RESET}"
echo -e "  4. Push your branch to GitHub:"
echo -e "     ${CYAN}git push -u origin <your-role-branch-name>${RESET}\n"
echo -e "${BOLD}${YELLOW}Important Rules to Prevent Conflicts:${RESET}"
echo -e "  - Strictly avoid editing files outside your assigned domain paths!"
echo -e "  - Keep pull requests focused solely on your isolated directory trees."
echo -e "================================================================"
