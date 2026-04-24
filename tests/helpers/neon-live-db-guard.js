const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function resolveNeonDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : '';
}

/** Runs the suite only when DATABASE_URL or TEST_DATABASE_URL is set (e.g. local dev or CI with secrets). */
function describeLiveNeon(name, suite) {
  if (!resolveNeonDatabaseUrl()) {
    return describe.skip(
      `${name} (skipped: set DATABASE_URL or TEST_DATABASE_URL for live DB checks)`,
      suite
    );
  }
  return describe(name, suite);
}

module.exports = { resolveNeonDatabaseUrl, describeLiveNeon };
