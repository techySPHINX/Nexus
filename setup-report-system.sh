#!/bin/bash
# Production-Grade Report System - Setup Script

echo "🚀 Setting up Production-Grade Report & Moderation System"
echo "=========================================================="

# Navigate to backend
cd backend || exit 1

echo ""
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Step 2: Running Database Migration..."
npx prisma migrate dev --name add_moderation_system

echo ""
echo "✅ Step 3: Verifying Schema..."
npx prisma validate

echo ""
echo "=========================================================="
echo "✨ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Review the migration in prisma/migrations/"
echo "2. Test the endpoints with Postman/Thunder Client"
echo "3. Check the documentation in docs/MODERATION_SYSTEM.md"
echo ""
echo "Available Endpoints:"
echo "  POST   /reports - Create report"
echo "  GET    /reports - List reports (with filters)"
echo "  GET    /reports/:id - Get report details"
echo "  PATCH  /reports/:id/resolve - Resolve/dismiss"
echo "  POST   /reports/:id/user-action - Punish user"
echo "  DELETE /reports/:id/content - Delete content"
echo "  POST   /reports/batch/resolve - Bulk resolve"
echo "  POST   /reports/batch/dismiss - Bulk dismiss"
echo "  GET    /reports/analytics/dashboard - Analytics"
echo "  GET    /reports/user/:userId/violations - User history"
echo "  PATCH  /reports/user-action/:actionId/revoke - Revoke action"
echo ""
echo "🎉 Ready to moderate!"
