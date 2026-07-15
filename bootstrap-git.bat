@echo off
rem =========================================================================
rem QuizSync Git Environment Bootstrapper (Windows Batch)
 rem Initializes Git repository, configures gitignores, stages code, and commits.
rem =========================================================================
title QuizSync Git Bootstrapper

echo ================================================================
echo             QuizSync Local Git Bootstrap Service
echo ================================================================

rem 1. Verify Git Installation
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] git command not found! Please install Git for Windows.
    echo Get it here: https://git-scm.com/download/win
    pause
    exit /b 1
)

rem 2. Check if already initialized
if exist .git\ (
    echo [INFO] Git repository already initialized in this directory.
) else (
    echo [ACTION] Initializing local Git repository...
    git init
)

rem 3. Verify/Write .gitignore
echo [ACTION] Checking .gitignore configuration...
if not exist .gitignore (
    (
    echo # Node dependencies
    echo node_modules/
    echo.
    echo # Local configuration files
    echo .env
    echo .env.local
    echo .env.production.local
    echo.
    echo # Logs
    echo logs/
    echo *.log
    echo npm-debug.log*
    echo.
    echo # System
    echo Thumbs.db
    echo Desktop.ini
    ) > .gitignore
    echo [SUCCESS] .gitignore file created successfully.
) else (
    echo [INFO] .gitignore already exists.
)

rem 4. Copy environment defaults
if not exist .env (
    if exist .env.example (
        echo [ACTION] Creating local .env from example template...
        copy .env.example .env > nul
        echo [SUCCESS] Local .env configured.
    )
)

rem 5. Stage and Commit
echo [ACTION] Staging boilerplate files...
git add .

echo [ACTION] Creating initial commit...
rem Check if user name or email is configured globally. If not, apply transient ones for safe commit.
git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    git config --global user.email "developer@quizsync.local"
)
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    git config --global user.name "QuizSync Developer"
)

git commit -m "chore: bootstrap project with secure modular layout"
echo [SUCCESS] Initial commit created successfully!

echo ================================================================
echo            COLLABORATIVE ENVIRONMENT BOOTSTRAPPING COMPLETE
echo ================================================================
echo.
echo Next Steps for Your Team Members:
echo   1. Link this repository to your team's remote GitHub repository:
echo      git remote add origin ^<your-private-github-repository-url^>
echo   2. Determine your isolated developer workspace branch based on your role:
echo      - Developer 1 (Frontend Layout): feature/frontend-ui
echo      - Developer 2 (Client Logic):     feature/client-app
echo      - Developer 3 (Backend API):       feature/backend-api
echo      - Developer 4 (DevOps ^& Infra):    feature/devops-infra
echo   3. Create and check out your dedicated branch:
echo      git checkout -b ^<your-role-branch-name^>
echo   4. Push your branch to GitHub:
echo      git push -u origin ^<your-role-branch-name^>
echo.
echo Important Rules to Prevent Conflicts:
echo   - Strictly avoid editing files outside your assigned domain paths!
echo   - Keep pull requests focused solely on your isolated directory trees.
echo ================================================================
pause
