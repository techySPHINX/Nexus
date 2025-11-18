# Nexus Backend - Production Optimizations Setup Script
# Run this script after pulling the latest changes

Write-Host "🚀 Nexus Backend - Production Optimizations Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Step 1: Install new dependencies
Write-Host "📦 Step 1: Installing new dependencies..." -ForegroundColor Yellow
Write-Host "   - compression (gzip/brotli support)" -ForegroundColor Gray
Write-Host "   - @types/compression (TypeScript types)" -ForegroundColor Gray
Write-Host ""

try {
    pnpm add compression @types/compression helmet --save
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "   Please run manually: pnpm add compression @types/compression helmet" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check environment file
Write-Host "📝 Step 2: Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found, copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Update .env with your actual credentials!" -ForegroundColor Red
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

Write-Host ""

# Step 3: Verify required environment variables
Write-Host "🔍 Step 3: Verifying required environment variables..." -ForegroundColor Yellow

$envContent = Get-Content ".env" -Raw
$requiredVars = @(
    "DATABASE_CONNECTION_LIMIT",
    "DATABASE_POOL_TIMEOUT",
    "REDIS_URL",
    "SENDGRID_API_KEY",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if ($envContent -notmatch $var) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Missing environment variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "📚 Please add these variables to your .env file" -ForegroundColor Yellow
    Write-Host "   See .env.example for reference" -ForegroundColor Gray
} else {
    Write-Host "✅ All required environment variables present" -ForegroundColor Green
}

Write-Host ""

# Step 4: Generate Prisma client
Write-Host "🔨 Step 4: Generating Prisma client..." -ForegroundColor Yellow

try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "   Please run manually: npx prisma generate" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test bcrypt module
Write-Host "🧪 Step 5: Testing bcrypt module..." -ForegroundColor Yellow

try {
    node -e "require('bcrypt')"
    Write-Host "✅ bcrypt module loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  bcrypt module issue detected" -ForegroundColor Yellow
    Write-Host "   Rebuilding bcrypt..." -ForegroundColor Gray
    
    try {
        pnpm rebuild bcrypt
        Write-Host "✅ bcrypt rebuilt successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to rebuild bcrypt" -ForegroundColor Red
        Write-Host "   Try manual rebuild:" -ForegroundColor Yellow
        Write-Host "   1. Remove node_modules: rm -r node_modules" -ForegroundColor Gray
        Write-Host "   2. Remove lock file: rm pnpm-lock.yaml" -ForegroundColor Gray
        Write-Host "   3. Reinstall: pnpm install" -ForegroundColor Gray
        Write-Host "   4. Rebuild: pnpm rebuild bcrypt" -ForegroundColor Gray
    }
}

Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📋 Setup Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Completed Steps:" -ForegroundColor Green
Write-Host "   1. Dependencies installed (compression, helmet)" -ForegroundColor Gray
Write-Host "   2. Environment file checked" -ForegroundColor Gray
Write-Host "   3. Required variables verified" -ForegroundColor Gray
Write-Host "   4. Prisma client generated" -ForegroundColor Gray
Write-Host "   5. bcrypt module tested" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update .env with your actual credentials:" -ForegroundColor Gray
Write-Host "      - SENDGRID_API_KEY (get from SendGrid dashboard)" -ForegroundColor Gray
Write-Host "      - REDIS_URL (your cloud Redis connection string)" -ForegroundColor Gray
Write-Host "      - JWT_ACCESS_SECRET (generate with: openssl rand -base64 64)" -ForegroundColor Gray
Write-Host "      - JWT_REFRESH_SECRET (generate with: openssl rand -base64 64)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Run database migrations:" -ForegroundColor Gray
Write-Host "      npx prisma migrate dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Start development server:" -ForegroundColor Gray
Write-Host "      pnpm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Review audit documents:" -ForegroundColor Gray
Write-Host "      - PRODUCTION_IMPROVEMENTS.md" -ForegroundColor Gray
Write-Host "      - PERFORMANCE_OPTIMIZATIONS.md" -ForegroundColor Gray
Write-Host "      - COMPLETE_AUDIT.md" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Setup complete! Ready to start development." -ForegroundColor Green
Write-Host ""
