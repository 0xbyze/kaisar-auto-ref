import Core from './src/Core.js';
import BaseApiClient from './src/Base.js';
import EmailProviderFactory from './src/EmailProviderFactory.js';
import { faker } from '@faker-js/faker';

(async () => {
    Core.displayHeader();

    const providerChoice = await Core.promptUser('🌐 Choose an email provider: 1 for TempMail, 2 for DeveloperMail: ');
    const apiKey = await Core.promptUser('⚡️ Enter API key (leave empty if not required): ');
    const emailProviderName = providerChoice === '1' ? 'tempmail' : 'developermail';
    const emailProvider = EmailProviderFactory.createProvider(emailProviderName, apiKey);

    const refCode = await Core.promptUser('👥 Input the referral code: ');
    const userCountInput = await Core.promptUser('🔄 Input how much ref to register: ');
    const userCount = parseInt(userCountInput, 10);

    const proxies = Core.loadProxies();
    const useProxy = await Core.promptUser('🛜 Do you want to use a proxy? (y/n): ');
    const useProxyFlag = useProxy.toLowerCase() === 'y';

    for (let i = 1; i <= userCount; i++) {
        Core.logWithDetails(`Progress [${i} of ${userCount}]`, 'info');

        const proxyUrl = useProxyFlag ? Core.getRandomProxy(proxies) : null;

        if (proxyUrl) {
            const censoredProxy = `${proxyUrl.slice(0, 4)}***${proxyUrl.slice(-3)}`;
            Core.logWithDetails(`Using proxy: ${censoredProxy}`, 'info');
        } else if (useProxyFlag) {
            Core.logWithDetails("No proxies available. Skipping proxy for this iteration.", 'warn');
        }

        const apiClient = new BaseApiClient(proxyUrl);

        try {
            const inbox = await emailProvider.createInbox();
            const email = inbox.address;
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const password = faker.helpers.fromRegExp(/[^.][!@#$%^&*()_+][^...]{8}/);

            Core.logWithDetails(`Registering user: ${email}`, 'info');
            const registrationResponse = await apiClient.register(email, password, refCode);
            Core.logWithDetails(`Registration successful: ${JSON.stringify(registrationResponse)}`, 'success');

            Core.logWithDetails('Checking inbox for verification emails...', 'info');
            const messages = await emailProvider.checkInbox(inbox.token);
            
            if (messages.length > 0) {
                Core.logWithDetails('Email received. Extracting confirmation link...', 'info');
                const emailContent = messages[0].html || messages[0].body;
                const confirmationLink = await emailProvider.extractConfirmationLink(emailContent);

                Core.logWithDetails(`Clicking confirmation link: ${confirmationLink}`, 'info');
                const confirmed = await emailProvider.clickConfirmationLinkWithRetry(confirmationLink, proxyUrl);

                if (confirmed) {
                    Core.logWithDetails('Email confirmed successfully.', 'success');
                    Core.logWithDetails('Request to Login.', 'info');
                    const loginResponse = await apiClient.login(email,password);
                    if (loginResponse) {
                        Core.logWithDetails('Request to Login: Success!', 'success');
                        Core.saveCredentials(email,password, loginResponse.data.accessToken, loginResponse.data.id);
                    }else{
                        Core.logWithDetails('Request to Login: Failed!', 'warn');
                    }
                } else {
                    Core.logWithDetails('Failed to confirm email.', 'error');
                }
            } else {
                Core.logWithDetails('No emails received.', 'warn');
            }
        } catch (error) {
            Core.logWithDetails(`Error during registration or email confirmation for user ${i}: ${error.message}`, 'error');
        }
        const randomMs = Math.floor(Math.random() * (5000 - 2500 + 1)) + 2500;
        Core.logWithDetails(`Sleep ${randomMs/1000} seconds.`)
        await Core.sleep(randomMs);
    }

    Core.logWithDetails('All users have been processed.', 'success');
})();
