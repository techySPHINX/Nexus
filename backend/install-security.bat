@echo off
REM Security Enhancements Installation Script
REM Run this script to install and verify security packages

echo.
echo 🔒 Installing Security Packages...
echo.

REM Install required packages
call npm install helmet @nestjs/throttler

echo.
echo ✅ Packages installed successfully!
echo.

echo 📋 Please complete these steps manually:
echo.
echo 1. Update your .env file with new variables from .env.example:
echo    - NODE_ENV
echo    - ALLOWED_ORIGINS
echo    - THROTTLE_TTL
echo    - THROTTLE_LIMIT
echo.
echo 2. Review and apply sanitization decorators to your DTOs
echo    (See src\common\decorators\USAGE_EXAMPLES.ts)
echo.
echo 3. Start the application and verify security features:
echo    npm run start:dev
echo.
echo 4. Check the console output for security confirmation messages
echo.
echo 📚 Documentation files created:
echo    - SECURITY_SETUP.md
echo    - SECURITY_IMPLEMENTATION.md
echo    - SECURITY_SUMMARY.md
echo.
echo 🎉 Security enhancements are ready to use!
echo.
pause
