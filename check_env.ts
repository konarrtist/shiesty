const vars = [
  'ARCTRACKER_APP_KEY',
  'ARCTRACKER_USER_KEY',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'DISCORD_CHANNEL_ID',
  'GEMINI_API_KEY',
  'SESSION_SECRET',
  'APP_URL'
];

vars.forEach(v => {
  console.log(`${v}: ${process.env[v] ? 'SET' : 'MISSING'}`);
});
