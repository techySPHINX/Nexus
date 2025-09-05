import { basename, join } from 'path';
import { readdirSync } from 'fs';

if (require.main === module) {
  const allFiles = readdirSync(__dirname).filter(
    (f) => /^seed.*\.js$/.test(f) && f !== basename(__filename),
  );
  const userFile = allFiles.find((f) => f === 'seed-user.js');
  const otherFiles = allFiles.filter((f) => f !== 'seed-user.js');
  const files = userFile ? [userFile, ...otherFiles] : otherFiles;
  for (const file of files) {
    import(join(__dirname, file));
  }
}
