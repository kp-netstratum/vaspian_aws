const HelloHunterApi = require('../functions/hello-hunter-api');
const ZohoCrmApi = require('../functions/zoho-crm-api');
const logger = require('winston');

class HelloHunterService {
    constructor() {
        this.hhApi = new HelloHunterApi();
        this.crmApi = new ZohoCrmApi();
    }

    async initHhClient() {
        const hhCustomers = await this.hhApi.getCustomers();
        logger.info('Initialized Hello Hunter Client');
        return hhCustomers;
    }

    async initZClient() {
        const query = "select Account_Name, Hello_Hunter_Id, Threshold, Reload_Amount from Accounts where 'Auto_Reload' = 'true' and 'Hello_Hunter_Id' is not null ORDER BY Account_Name limit 200";
        const zCustomers = await this.crmApi.coql(query);
        logger.info('Initialized Zoho CRM Client');
        return zCustomers.data || [];
    }

    async processCustomers(zCustomers, hhCustomers) {
        const reloadDate = new Date().toISOString().split('T')[0];

        for (const zCust of zCustomers) {
            const zHhId = zCust.Hello_Hunter_Id.toString();
            const hhCust = hhCustomers.find(hhCust => hhCust.id.toString() === zHhId);

            if (!hhCust) {
                logger.error(`Hello Hunter customer not found for ID: ${zHhId}`);
                continue;
            }

            const balance = Math.round((hhCust.available_minutes * (hhCust.call_rate / 10000)) / 60);
            const custName = hhCust.user_group_name;
            const custThresh = zCust.Threshold;
            const reloadAmnt = zCust.Reload_Amount;

            logger.info(`Processing Customer: ${custName}, Balance: $${balance}, Threshold: $${custThresh}, Reload Amount: $${reloadAmnt}`);

            if (balance <= custThresh) {
                logger.info(`Balance below threshold. Reloading ${reloadAmnt} for ${custName}...`);
                const reloadResponse = await this.hhApi.giveCredit(zHhId, reloadAmnt);

                if (reloadResponse === 200) {
                    logger.info(`Successfully reloaded ${reloadAmnt} for ${custName}`);
                    await this.createReloadRecordCrm(zCust, reloadAmnt, balance, reloadDate, custName);
                } else {
                    logger.error(`Failed to reload ${reloadAmnt} for ${custName}`);
                }
            } else {
                logger.info(`${custName} is above the threshold. No reload required.`);
            }
        }
    }

    async createReloadRecordCrm(zCust, reloadAmnt, balance, reloadDate, custName) {
        const payload = [
            {
                Account: zCust.id,
                HH_Name: custName,
                New_Balance: balance + reloadAmnt,
                Old_Balance: balance,
                Platform_Id: zCust.Hello_Hunter_Id,
                Reload_Amount: reloadAmnt,
                Reload_Date: reloadDate,
            },
        ];

        logger.info('Creating reload record in Zoho CRM', payload);
        const reloadResponse = await this.crmApi.zohoCrmPost('Voice_Dial_Reloads', payload, 'upsert');

        if (reloadResponse !== 'fail') {
            logger.info(`CRM Response: ${reloadResponse[0]?.message || 'Success'}`);
        }
    }
}

module.exports = HelloHunterService;