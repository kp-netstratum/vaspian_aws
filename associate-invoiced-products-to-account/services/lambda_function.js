const $crmApi = require('../functions/zoho-crm-api');
const $analyticsApi = require('../functions/zoho-analytics-api');
const fs = require('fs');
const csv = require('csv-parser');
const $logger = console
const $invDate = new Date().toISOString().split('T')[0];

async function getProductsToAssociate() {
    try {
        const analyticsCsv = await $analyticsApi.createExport('1229105000014484012', 'csv');
        const jobId = analyticsCsv.data.jobId;
        $logger.info("Analytics CSV: ", analyticsCsv);

        let jobComplete = 'in progress';
        while (jobComplete === 'in progress') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const jobDetails = await $analyticsApi.getExportDetails(jobId);
            jobComplete = jobDetails.status;
        }

        return await $analyticsApi.downloadExportedData(jobId);
    } catch (error) {
        $logger.error('Error in getProductsToAssociate: ', error);
        throw error;
    }
}

function parseCsv(csvData) {
    const csvArray = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvData)
            .pipe(csv())
            .on('data', (row) => csvArray.push(row))
            .on('end', () => {
                const dataGrouped = csvArray
                    .reduce((acc, row) => {
                        const key = row[0];
                        if (!acc[key]) {
                            acc[key] = [];
                        }
                        acc[key].push(row.slice(1)); // Grouping by first column
                        return acc;
                    }, {});
                resolve(dataGrouped);
            })
            .on('error', (error) => reject(error));
    });
}

async function processAccounts(accounts, analyticsProductsGrouped) {
    try {
        $logger.info("Analytics Products Grouped: ", analyticsProductsGrouped);
        let numAccountProcessed = 0;
        let analyticsToAdd = false;

        for (let accountId of accounts) {
            const products = { 'add': [], 'remove': [] };
            const crmProductsResp = await getCrmRelatedRecords('Accounts', accountId, 'Products');

            if (crmProductsResp) {
                const crmProducts = crmProductsResp.data;
                if (crmProducts.length !== 0) {
                    $logger.info("CRM Products: ", crmProducts);
                    if (analyticsProductsGrouped[accountId]) {
                        const compareResponse = compareProducts(crmProducts, analyticsProductsGrouped[accountId]);
                        products.add = compareResponse.add;
                        products.remove = compareResponse.remove;
                    } else {
                        $logger.info("Removing all products from CRM Account.");
                        crmProducts.forEach(product => products.remove.push(product.id));
                    }
                } else {
                    analyticsToAdd = true;
                }
            } else {
                analyticsToAdd = true;
            }

            if (analyticsToAdd && analyticsProductsGrouped[accountId] && analyticsProductsGrouped[accountId].length > 0) {
                products.add = analyticsProductsGrouped[accountId];
            }

            $logger.info("Products being changed: ", products);
            await determineAction(products, accountId);
            numAccountProcessed++;
        }

        $logger.info("Number of accounts processed: ", numAccountProcessed);
    } catch (error) {
        $logger.error("Error in processAccounts: ", error);
    }
}

function compareProducts(crmProducts, analyticsProductsGrouped) {
    const productsToAdd = [];
    const productsToRemove = [];

    crmProducts.forEach(cProduct => {
        const cProductId = cProduct.id;
        const hasProduct = analyticsProductsGrouped.some(aItem => aItem === cProductId);

        if (!hasProduct) {
            productsToRemove.push(cProductId);
        }
    });

    $logger.info("Removing the following products: ", productsToRemove);

    analyticsProductsGrouped.forEach(aProduct => {
        productsToAdd.push(aProduct);
    });

    return { 'add': productsToAdd, 'remove': productsToRemove };
}

async function getCrmRelatedRecords(parent, parentId, child) {
    try {
        return await $crmApi.apiCall(`${parent}/${parentId}/${child}?fields=Owner,Parent_Id`, 'get');
    } catch (error) {
        $logger.error("Error in getCrmRelatedRecords: ", error);
        return null;
    }
}

async function determineAction(products, accountId) {
    try {
        if (products.add && products.add.length > 0) {
            const productsToAdd = products.add.map(product => ({ id: product }));
            await addRelatedProducts('Accounts', accountId, 'Products', productsToAdd);
        } else {
            $logger.info('No products to add');
        }

        if (products.remove && products.remove.length > 0) {
            const removeIds = products.remove.join(',');
            $logger.info("Remove IDs: ", removeIds);
            await removeRelatedProducts('Accounts', accountId, 'Products', removeIds);
        } else {
            $logger.info('No products to remove');
        }
    } catch (error) {
        $logger.error('Error in determineAction: ', error);
    }
}

async function addRelatedProducts(parent, parentId, child, records) {
    try {
        await $crmApi.zohoCrmPost(`${parent}/${parentId}/${child}`, 'put', records);
    } catch (error) {
        $logger.error("Error in addRelatedProducts: ", error);
    }
}

async function removeRelatedProducts(parent, parentId, child, records) {
    try {
        await $crmApi.apiCall(`${parent}/${parentId}/${child}?ids=${records}`, 'delete');
    } catch (error) {
        $logger.error("Error in removeRelatedProducts: ", error);
    }
}

// Export functions to be used in the main file
module.exports = {
    getProductsToAssociate,
    parseCsv,
    processAccounts,
    compareProducts,
    getCrmRelatedRecords,
    determineAction,
    addRelatedProducts,
    removeRelatedProducts
};
