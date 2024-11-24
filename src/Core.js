import fs from 'fs';
import readline from 'readline';
import colors from 'colors';

const Core = {

  loadProxies: function (filePath = 'proxy.txt') {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return data.split('\n').map(proxy => proxy.trim()).filter(proxy => proxy.length > 0);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  },

  getRandomProxy: function (proxies) {
    if (proxies.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
  },

  promptUser: function (question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => rl.question(question, ans => {
      rl.close();
      resolve(ans.trim());
    }));
  },

  sleep: function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  displayHeader: function () {
    process.stdout.write('\x1Bc');
    console.log(colors.bgWhite.black('========================================'));
    console.log(colors.bgWhite.black('=  Kaisar Auto Ref Bot                 ='));
    console.log(colors.bgWhite.black('=  Created by: Bravesid                ='));
    console.log(colors.bgWhite.black('=  https://t.me/Bravesid               ='));
    console.log(colors.bgWhite.black('========================================'));
    console.log();
  },

  logWithDetails: function (message, type = 'info') {
    const dateTime = new Date().toISOString().replace('T', ' ').replace('Z', '');
    let symbol, colorFn;

    switch (type) {
      case 'success':
        symbol = '✅';
        colorFn = colors.green;
        break;
      case 'error':
        symbol = '❌ ';
        colorFn = colors.red;
        break;
      case 'warn':
        symbol = '⚠️ ';
        colorFn = colors.yellow;
        break;
      default:
        symbol = 'ℹ️ ';
        colorFn = colors.blue;
        break;
    }

    console.log(`[${dateTime}] ` + colorFn(` ${symbol} ${message}`));
  },
  
  saveCredentials: function (email, password, token, userid, filePath = 'accounts.txt') {
    const data = `Email: ${email}\nPassword: ${password}\nUserID: ${userid}\nToken: ${token}\n-----------------------\n`;
    try {
      fs.appendFileSync(filePath, data, 'utf-8');
      this.logWithDetails(`Credentials saved to ${filePath}`, 'success');
    } catch (error) {
      this.logWithDetails(`Error saving credentials to ${filePath}: ${error.message}`, 'error');
    }
  },

};

export default Core;
