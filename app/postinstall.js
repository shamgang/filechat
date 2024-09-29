/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');

// Check if we're in CD pipeline
if (process.env.CD_PIPELINE !== 'true') {
  console.log('Not running in CD pipeline. Skipping replacement of filechat-shared.');
  process.exit(0);  // Exit the script if not in production
}

// Define paths
const src = path.join(__dirname, '..', 'shared');
const dest = path.join(__dirname, 'node_modules', 'filechat-shared');

// Step 1: Remove the existing 'filechat-shared' directory if it exists
rimraf.sync(dest);
console.log(`Deleted: ${dest}`);

// Step 2: Copy the 'shared' directory to 'filechat-shared'
fs.copySync(src, dest);
console.log(`Copied contents from ${src} to ${dest}`);
