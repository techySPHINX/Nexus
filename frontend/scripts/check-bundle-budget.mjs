/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distAssets = path.resolve('dist/assets');

if (!fs.existsSync(distAssets)) {
  console.error(
    'Bundle budget check failed: dist/assets not found. Run `npm run build` first.'
  );
  process.exit(1);
}

const budgets = [
  { pattern: /^main-.*\.js$/, gzipMaxKb: 140, label: 'main entry chunk' },
  { pattern: /^vendor-mui-.*\.js$/, gzipMaxKb: 120, label: 'MUI vendor chunk' },
  {
    pattern: /^vendor-editor-.*\.js$/,
    gzipMaxKb: 120,
    label: 'editor vendor chunk',
  },
  {
    pattern: /^vendor-misc-.*\.js$/,
    gzipMaxKb: 170,
    label: 'misc vendor chunk',
  },
  {
    pattern: /^vendor-motion-.*\.js$/,
    gzipMaxKb: 50,
    label: 'motion vendor chunk',
  },
  {
    pattern: /^vendor-recharts-.*\.js$/,
    gzipMaxKb: 60,
    label: 'recharts vendor chunk',
  },
  {
    pattern: /^vendor-firebase-.*\.js$/,
    gzipMaxKb: 20,
    label: 'firebase vendor chunk',
  },
];

const files = fs.readdirSync(distAssets).filter((name) => name.endsWith('.js'));
const results = [];

for (const fileName of files) {
  const abs = path.join(distAssets, fileName);
  const content = fs.readFileSync(abs);
  const gzipBytes = zlib.gzipSync(content).length;
  const gzipKb = gzipBytes / 1024;
  results.push({ fileName, gzipKb });
}

const failures = [];

for (const budget of budgets) {
  const hit = results.find((r) => budget.pattern.test(r.fileName));
  if (!hit) continue;

  if (hit.gzipKb > budget.gzipMaxKb) {
    failures.push(
      `${budget.label} (${hit.fileName}) is ${hit.gzipKb.toFixed(2)}KB gzip, budget ${budget.gzipMaxKb}KB`
    );
  }
}

const totalInitial = results
  .filter((r) =>
    /^(main-|vendor-mui-|vendor-misc-|vendor-motion-|vendor-emotion-|vendor-radix-|vendor-axios-)/.test(
      r.fileName
    )
  )
  .reduce((sum, r) => sum + r.gzipKb, 0);

const TOTAL_INITIAL_GZIP_BUDGET_KB = 550;
if (totalInitial > TOTAL_INITIAL_GZIP_BUDGET_KB) {
  failures.push(
    `initial core JS aggregate is ${totalInitial.toFixed(2)}KB gzip, budget ${TOTAL_INITIAL_GZIP_BUDGET_KB}KB`
  );
}

console.log('Bundle budget summary:');
for (const budget of budgets) {
  const hit = results.find((r) => budget.pattern.test(r.fileName));
  if (!hit) continue;
  console.log(
    `- ${budget.label}: ${hit.gzipKb.toFixed(2)}KB gzip (budget ${budget.gzipMaxKb}KB)`
  );
}
console.log(
  `- initial core JS aggregate: ${totalInitial.toFixed(2)}KB gzip (budget ${TOTAL_INITIAL_GZIP_BUDGET_KB}KB)`
);

if (failures.length > 0) {
  console.error('\nBundle budget check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nBundle budget check passed.');
