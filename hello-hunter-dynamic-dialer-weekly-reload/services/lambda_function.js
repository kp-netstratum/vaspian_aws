const moment = require('moment'); // For date formatting
const ZohoCrmApi = require('../functions/zoho-crm-api');
const HelloHunterApi = require('../functions/hh-api');

const logger = console; // Replace with a more robust logger like `winston` in production

const crmApi = new ZohoCrmApi();
const hhApi = new HelloHunterApi();
const reloadDate = moment().format('YYYY-MM-DD');

async function lambdaHandler(event, context) {
    const accountsQuery = '(((Dialer_Package:equals:Dynamic Dialer)and(Hello_Hunter_Id:not_equal:null))and(Weekly_Reload_Amount:not_equal:null))';

    try {
        const zCusts = await crmApi.search('Accounts', accountsQuery);

        if (Array.isArray(zCusts) && zCusts.length > 0) {
            const hhCusts = await hhApi.getCust();
            await processCustomers(zCusts, hhCusts);
        }
    } catch (error) {
        logger.error('Error in lambdaHandler:', error.message);
        if (error.response) {
            logger.debug(error.response.data);
            logger.debug(error.response.status);
        }
    }
}

async function processCustomers(zCusts, hhCusts) {
    for (const zCust of zCusts) {
        try {
            const zHhId = zCust['Hello_Hunter_Id'].toString();
            const reloadCust = hhCusts.find(hhCust => hhCust.id.toString().includes(zHhId));

            if (reloadCust) {
                const custCallRate = reloadCust.call_rate / 10000;
                const custMin = reloadCust.available_minutes;
                const balance = Math.round((custMin * custCallRate) / 60);
                const custName = reloadCust.user_group_name;
                const reloadAmnt = zCust['Weekly_Reload_Amount'];

                logger.info(`Customer: ${custName} Balance: $${balance} Reload Amount: $${reloadAmnt}`);

                const hhReloadResp = await hhApi.giveCredit(zHhId, reloadAmnt);

                if (hhReloadResp === 200) {
                    await updateCustomer(zCust, custName, balance, reloadAmnt);
                }
            }
        } catch (error) {
            logger.error('Error in processCustomers:', error.message);
            if (error.response) {
                logger.debug(error.response.data);
                logger.debug(error.response.status);
            }
        }
    }
}

async function updateCustomer(zCust, custName, balance, reloadAmnt) {
    const updateCust = {
        Account: zCust.id,
        HH_Name: custName,
        Load_Type: 'Dynamic Weekly Load',
        New_Balance: balance + reloadAmnt,
        Old_Balance: balance,
        Platform_Id: zCust['Hello_Hunter_Id'],
        Reload_Amount: reloadAmnt,
        Reload_Date: reloadDate,
    };

    const payload = [updateCust];

    try {
        const reloadResp = await crmApi.zohoCrmPost('Voice_Dial_Reloads/upsert', 'post', payload);

        logger.info(reloadResp);

        if (reloadResp !== 'fail') {
            logger.info(reloadResp[0][0]?.message);
        }
    } catch (error) {
        logger.error('Error in updateCustomer:', error.message);
        if (error.response) {
            logger.debug(error.response.data);
            logger.debug(error.response.status);
        }
    }
}

// To execute locally or export for external use
module.exports = { lambdaHandler };

// Uncomment to run locally
// lambdaHandler(null, null).then(() => console.log('Execution Complete'));
