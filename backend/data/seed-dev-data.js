const { basename, join } = require('path');
const { readdirSync, existsSync } = require('fs');
const { execFileSync, execSync } = require('child_process');

function ensureTsxAvailable() {
  try {
    execSync('npx --yes tsx --version', { stdio: 'ignore' });
    return true;
  } catch (_) {
    console.error('❌ tsx is not available via npx. Please ensure you have network access or install tsx locally: npm i -D tsx');
    return false;
  }
}

function runSeed(file) {
  const filePath = join(__dirname, file);
  if (!existsSync(filePath)) {
    console.warn(`⚠️  Seed file not found, skipping: ${file}`);
    return;
  }
  console.log(`\n▶️  Running seed: ${file}`);
  try {
    // Use tsx to execute ESM-style seed scripts seamlessly
    execFileSync('npx', ['--yes', 'tsx', filePath], { stdio: 'inherit' });
    console.log(`✅ Finished: ${file}`);
  } catch (err) {
    console.error(`❌ Seed failed: ${file}`);
    if (err?.status) {
      console.error(`Exit code: ${err.status}`);
    }
    // Continue to next seeds even if one fails
  }
}

if (require.main === module) {
  const allFiles = readdirSync(__dirname).filter(
    (f) => /^seed.*\.js$/.test(f) && f !== basename(__filename),
  );

  // Define a safe execution order (ensures prerequisites exist)
  const preferredOrder = [
    'seed-users.js',
    'seed-additional-users.js',
    'seed-skills.js',
    'seed-badge.js',
    'seed-sub-community.js',
    'seed-connections.js',
    'seed-mentorship.js',
    'seed-referrals.js',
    'seed-showcase.js',
    'seed-news.js',
    'seed-messages.js',
    'seed-notification.js',
  ];

  const ordered = preferredOrder.filter((f) => allFiles.includes(f));
  const remaining = allFiles.filter((f) => !ordered.includes(f));
  const files = [...ordered, ...remaining];

  if (ensureTsxAvailable()) {
    for (const file of files) {
      runSeed(file);
    }
  }

  console.log('\n🎉 All seed scripts attempted.');
}
