# Production-Grade Report System - Setup Script (Windows)

Write-Host "🚀 Setting up Production-Grade Report & Moderation System" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Navigate to backend
Set-Location backend

Write-Host ""
Write-Host "📦 Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host ""
Write-Host "🗄️  Step 2: Running Database Migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_moderation_system

Write-Host ""
Write-Host "✅ Step 3: Verifying Schema..." -ForegroundColor Yellow
npx prisma validate

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the migration in prisma/migrations/"
Write-Host "2. Test the endpoints with Postman/Thunder Client"
Write-Host "3. Check the documentation in docs/MODERATION_SYSTEM.md"
Write-Host ""
Write-Host "Available Endpoints:" -ForegroundColor Cyan
Write-Host "  POST   /reports - Create report"
Write-Host "  GET    /reports - List reports (with filters)"
Write-Host "  GET    /reports/:id - Get report details"
Write-Host "  PATCH  /reports/:id/resolve - Resolve/dismiss"
Write-Host "  POST   /reports/:id/user-action - Punish user"
Write-Host "  DELETE /reports/:id/content - Delete content"
Write-Host "  POST   /reports/batch/resolve - Bulk resolve"
Write-Host "  POST   /reports/batch/dismiss - Bulk dismiss"
Write-Host "  GET    /reports/analytics/dashboard - Analytics"
Write-Host "  GET    /reports/user/:userId/violations - User history"
Write-Host "  PATCH  /reports/user-action/:actionId/revoke - Revoke action"
Write-Host ""
Write-Host "🎉 Ready to moderate!" -ForegroundColor Green
