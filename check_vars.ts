const requiredVars = [
  'ARCTRACKER_APP_KEY',
  'ARCTRACKER_USER_KEY',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'SESSION_SECRET',
  'DISCORD_BOT_TOKEN',
  'DISCORD_CHANNEL_ID',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'APP_URL'
];

console.log('--- Environment Variable Check ---');
requiredVars.forEach(v => {
  const val = process.env[v];
  if (val) {
    console.log(`${v}: PRESENT (Length: ${val.length})`);
  } else {
    console.log(`${v}: MISSING`);
  }
});
console.log('---------------------------------');
