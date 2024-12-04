const axios = require('axios');
const { CrmApi } = require('../functions/z_crm');
const { HelloHunterApi } = require('../functions/hh');
const winston = require('winston');
const moment = require('moment');

// Initialize Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Main function
async function main() {
    const nowTime = moment();
    const reloadDate = nowTime.format('YYYY-MM-DD');

    const hhApi = new HelloHunterApi();
    const hhCusts = await hhApi.getCust();

    const crmApi = new CrmApi();
    const hhQuery = {
        select_query: "select Account_Name, Hello_Hunter_Id, Threshold, Reload_Amount from Accounts where 'Auto_Reload' = 'true' and 'Hello_Hunter_Id' is not null ORDER BY Account_Name limit 200"
    };

    const zCusts = await crmApi.post('coql', hhQuery);

    if (zCusts !== 'fail') {
        for (const zCust of zCusts) {
            const zHhId = zCust.Hello_Hunter_Id.toString();
            const reloadCust = hhCusts.find(hhCust => hhCust.id.toString().includes(zHhId));

            const custCallRate = reloadCust.call_rate / 10000;
            const custMin = reloadCust.available_minutes;
            const balance = Math.round((custMin * custCallRate) / 60);
            const custName = reloadCust.user_group_name;
            const custThresh = zCust.Threshold;
            const reloadAmnt = zCust.Reload_Amount;

            logger.info(`Customer: ${custName} Balance: $${balance} Threshold: $${custThresh} Reload Amount: $${reloadAmnt}`);

            if (balance <= custThresh) {
                logger.info('Below threshold. Need to reload.');

                const hhReloadResp = await hhApi.giveCredit(zHhId, reloadAmnt);
                if (hhReloadResp === 200) {
                    const updateCust = {
                        Account: zCust.id,
                        HH_Name: custName,
                        New_Balance: balance + reloadAmnt,
                        Old_Balance: balance,
                        Platform_Id: zCust.Hello_Hunter_Id,
                        Reload_Amount: reloadAmnt,
                        Reload_Date: reloadDate
                    };

                    const payload = [updateCust];
                    const reloadResp = await crmApi.postPut('Voice_Dial_Reloads', payload, '/upsert');

                    logger.info(reloadResp);
                    if (reloadResp !== 'fail') {
                        logger.info(reloadResp[0][0].message);
                    }
                }
            } else {
                logger.info('Above threshold. No reload needed.');
            }
        }
    }
}

// Lambda handler function
exports.lambdaHandler = async (event, context) => {
    await main();
};

// Run main function if script is executed directly
if (require.main === module) {
    main();
}
