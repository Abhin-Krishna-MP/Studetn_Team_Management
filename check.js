const fs = require('fs');
const path = require('path');

const errors = [];

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'frontend') {
      checkDir(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        console.log('Checking ' + fullPath);
        require('./' + fullPath);
      } catch (err) {
        errors.push(`Error in ${fullPath}: ${err.message}`);
      }
    }
  }
}

try {
  checkDir('models');
  checkDir('controllers');
  checkDir('routes');
  checkDir('middleware');
  require('./server.js');
} catch(e) {
  errors.push('Top level error: ' + e.message);
}

fs.writeFileSync('check_results.txt', errors.join('\n') || 'SUCCESS');
console.log('Done');
