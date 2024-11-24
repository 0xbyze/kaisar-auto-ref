const { TempMail } = require('tempmail.lol');
const cheerio = require('cheerio');

class EmailProviderFactory {
    static createProvider(providerName, apiKey = '') {
        switch (providerName.toLowerCase()) {
            case 'tempmail':
                return new TempMailProvider(apiKey);
            case 'developermail':
                return new DeveloperMailProvider();
            default:
                throw new Error('Unsupported email provider. Choose between "tempmail" or "developermail".');
        }
    }
}

class TempMailProvider {
    constructor(apiKey) {
        this.tempMail = new TempMail(apiKey);
    }

    async createInbox() {
        try {
            const inbox = await this.tempMail.createInbox();
            // console.log('Temporary inbox created:', inbox);
            return inbox;
        } catch (error) {
            console.error('Error creating inbox:', error.message);
            throw error;
        }
    }

    async checkInbox(token, maxRetries = 10, delayMs = 5000) {
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                const emails = await this.tempMail.checkInbox(token);
                if (emails.length > 0) {
                    return emails;
                }
                console.log(`No emails yet. Retrying (${attempts + 1}/${maxRetries})...`);
            } catch (error) {
                console.error(`Error checking inbox (Attempt ${attempts + 1}):`, error.message);
            }
            attempts++;
            await this.delay(delayMs);
        }
        console.log("Max retries reached. No emails received.");
        return [];
    }

    async extractConfirmationLink(emailHtml) {
        try {
            const $ = cheerio.load(emailHtml);
            const link = $('a:contains("Confirm Email")').attr('href');
            if (link) {
                //console.log('Confirmation link found:', link);
                return link;
            } else {
                throw new Error('Confirmation link not found in email content.');
            }
        } catch (error) {
            console.error('Error extracting confirmation link:', error.message);
            throw error;
        }
    }

    async clickConfirmationLinkWithRetry(link, proxyUrl = null, maxRetries = 5, delayMs = 3000){
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                const fetchOptions = {
                    method: 'GET',
                };
    
                if (proxyUrl) {
                    const { ProxyAgent } = require('undici');
                    fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
                }
    
                const response = await fetch(link, fetchOptions);
                //console.log(`Confirmation link clicked. Response status: ${response.status}`);
                if (response.status === 200) {
                    return true;
                } else {
                    console.error(`Unexpected response status: ${response.status}`);
                }
            } catch (error) {
                console.error(`Error clicking confirmation link (Attempt ${attempts + 1}): ${error.message}`);
            }
    
            attempts++;
            console.log(`Retrying confirmation link... (${attempts}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    
        console.error(`Max retries reached. Failed to confirm email with link: ${link}`);
        return false;
    }
    

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

class DeveloperMailProvider {
    constructor(apiKey = null) {
        this.apiEndpoint = 'https://www.developermail.com/api/v1';
        this.apiKey = apiKey;
        this.mailboxName = null;
        this.token = null;
    }

    async createInbox() {
        const response = await fetch(`${this.apiEndpoint}/mailbox`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });

        const data = await response.json();

        if (data.success && data.result) {
            this.mailboxName = data.result.name;
            this.token = data.result.token;
            return {
                address: `${this.mailboxName}@developermail.com`,
                token: this.token,
            };
        } else {
            throw new Error(data.errors || 'Failed to create mailbox');
        }
    }

    async getMessageIds() {
        const response = await fetch(`${this.apiEndpoint}/mailbox/${this.mailboxName}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${this.token}` },
        });

        if (response.status === 200) {
            return await response.json();
        } else {
            throw new Error(`Error fetching message IDs: ${response.statusText}`);
        }
    }

    async fetchMessages(messageIds) {
        const response = await fetch(`${this.apiEndpoint}/mailbox/${this.mailboxName}/messages`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-MailboxToken': this.token,
            },
            body: JSON.stringify(messageIds),
        });

        const data = await response.json();

        if (data.success && data.result) {
            return data.result;
        } else {
            throw new Error(data.errors || 'Failed to fetch messages');
        }
    }

    async checkInbox(maxRetries = 10, delayMs = 5000) {
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                const messageIds = await this.getMessageIds();
                if (messageIds.length > 0) {
                    const messages = await this.fetchMessages(messageIds);
                    return messages;
                }
                console.log(`No emails yet. Retrying (${attempts + 1}/${maxRetries})...`);
            } catch (error) {
                console.error(`Error checking inbox (Attempt ${attempts + 1}):`, error);
            }
            attempts++;
            await this.delay(delayMs);
        }
        console.log("Max retries reached. No emails received.");
        return [];
    }

    async readMessage(messageId) {
        const response = await fetch(`${this.apiEndpoint}/mailbox/${this.mailboxName}/messages/${messageId}`, {
            method: 'GET',
            headers: { 'X-MailboxToken': this.token },
        });

        const data = await response.json();

        if (response.status === 200 && data.success) {
            return data.result;
        } else {
            throw new Error(`Failed to fetch message: ${response.statusText}`);
        }
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

module.exports = EmailProviderFactory;
