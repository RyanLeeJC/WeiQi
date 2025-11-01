# Setting Up GitHub Repository for WeiQi Project

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `WeiQi`
3. Choose Public or Private
4. **DO NOT** initialize with README, .gitignore, or license (we'll do this locally)
5. Click "Create repository"

## Step 2: Initialize Git Locally

Run these commands in your terminal (from the WeiQi folder):

```bash
# Navigate to your project directory
cd "/Users/ryanlee/Desktop/Cursor Tutorial/WeiQi"

# Initialize git repository
git init

# Add a README file
echo "# WeiQi (Go) Board Game Project" > README.md

# Create a basic .gitignore (add Python if needed)
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Project specific
*.log
EOF

# Stage all files
git add .

# Make your first commit
git commit -m "Initial commit: WeiQi project setup"

# Rename the default branch to main (if needed)
git branch -M main
```

## Step 3: Link to GitHub Repository

After creating the repository on GitHub, you'll see instructions. Use these commands:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/WeiQi.git

# Push your code to GitHub
git push -u origin main
```

**Important**: Replace `YOUR_USERNAME` with your actual GitHub username!

## Step 4: Verify Connection

```bash
# Check remote repository
git remote -v

# Check status
git status
```

## Working from Different Computers

Once set up, when working from a different computer:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/WeiQi.git

# After making changes, push updates
git add .
git commit -m "Your commit message"
git push
```

## Authentication Note

If you encounter authentication issues:
- GitHub no longer accepts password authentication for HTTPS
- Use a Personal Access Token (PAT) instead
- Or set up SSH keys for easier authentication
- See: https://docs.github.com/en/authentication

