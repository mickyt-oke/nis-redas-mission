# Node.js Update Guide for Windows

## Current Status
- **Current Version**: v22.18.0
- **Target Version**: v22.19.0 or later (latest LTS)
- **Issue**: Some packages require Node.js >= 22.19.0

## Update Methods

### Method 1: Using Node.js Installer (Recommended for Windows)

1. **Download the Latest Node.js**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version or **Current** version
   - Choose the Windows Installer (.msi) for your system (64-bit recommended)

2. **Run the Installer**
   - Double-click the downloaded .msi file
   - Follow the installation wizard
   - Accept the license agreement
   - Choose the default installation path
   - Ensure "Automatically install necessary tools" is checked
   - Click Install

3. **Verify Installation**
   ```powershell
   node --version
   ```
   Should show v22.19.0 or higher

4. **Verify npm**
   ```powershell
   npm --version
   ```

### Method 2: Using Chocolatey (If Installed)

If you have Chocolatey package manager:

```powershell
# Run PowerShell as Administrator
choco upgrade nodejs -y
```

### Method 3: Using Winget (Windows Package Manager)

If you have winget (Windows 10/11):

```powershell
# Run PowerShell as Administrator
winget upgrade --id OpenJS.NodeJS
```

### Method 4: Install NVM for Windows (Best for Managing Multiple Versions)

1. **Download NVM for Windows**
   - Visit: https://github.com/coreybutler/nvm-windows/releases
   - Download `nvm-setup.exe` from the latest release

2. **Install NVM**
   - Run the installer
   - Follow the installation wizard
   - Restart your terminal/PowerShell

3. **Install Latest Node.js**
   ```powershell
   # List available versions
   nvm list available
   
   # Install latest LTS
   nvm install lts
   
   # Or install specific version
   nvm install 22.19.0
   
   # Use the installed version
   nvm use 22.19.0
   ```

4. **Verify**
   ```powershell
   node --version
   nvm current
   ```

## After Updating Node.js

1. **Clear npm cache**
   ```powershell
   npm cache clean --force
   ```

2. **Update npm to latest**
   ```powershell
   npm install -g npm@latest
   ```

3. **Reinstall project dependencies**
   ```powershell
   cd C:\redas-mission\nis-redas-mission
   pnpm install
   ```

4. **Restart development server**
   ```powershell
   pnpm run dev
   ```

## Troubleshooting

### If you get permission errors:
- Run PowerShell as Administrator
- Or use: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### If old version persists:
1. Close all terminal windows
2. Restart VSCode
3. Open new terminal and check: `node --version`

### If npm doesn't work after update:
```powershell
npm install -g npm@latest
```

## Recommended Approach for Your System

Since you're on Windows and don't have NVM installed, I recommend:

**Option A (Quickest)**: Download and run the official Node.js installer from nodejs.org
- Pros: Simple, official, includes npm
- Cons: Manual updates needed

**Option B (Best Long-term)**: Install NVM for Windows first, then manage Node versions
- Pros: Easy version switching, better for development
- Cons: Extra installation step

## Quick Command Reference

After updating, verify everything:
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check pnpm version
pnpm --version

# Reinstall dependencies
pnpm install

# Start dev server
pnpm run dev
```

## Notes
- The warning you saw about Node >= 22.19.0 is from some packages that prefer the latest version
- Node 22.18.0 should still work fine, but updating eliminates the warning
- Always backup your project before major updates (though Node updates are generally safe)
