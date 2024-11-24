const fs = require('fs');

const data = fs.readFileSync('accounts.txt', 'utf8');

const entries = data.trim().split('\n-----------------------\n');

let userIds = [];
let tokens = [];

entries.forEach(entry => {
  const lines = entry.split('\n');
  const token = lines[3].split(':')[1].trim();

  tokens.push(token);
});


fs.writeFileSync('token.txt', tokens.join('\n'), 'utf8');

console.log("Tokens have been saved to 'token.txt'.");
