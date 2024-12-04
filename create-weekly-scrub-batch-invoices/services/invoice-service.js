const ZohoCrmApi = require('../functions/zoho-crm-api');
const ZohoBooksApi = require('../functions/zoho-books-api');
const { createLogger, transports } = require('winston');

const logger = createLogger({
    transports: [new transports.Console()]
});

const crmApi = new ZohoCrmApi();
const booksApi = new ZohoBooksApi();

const invoiceService = {
    async generateInvoices() {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];
        const invDate = new Date().toISOString().split('T')[0];

        const batchSearch = `(((Scrub_Date:equals:${yesterday})and(Invoiced:equals:false))and(Account:not_equal:null))`;
        const zScrubs = await crmApi.search('Scrub_File_Batches', batchSearch);

        if (Array.isArray(zScrubs) && zScrubs.length > 0) {
            const scrubsGrouped = zScrubs.reduce((acc, scrub) => {
                const accountId = scrub.Account.id;
                if (!acc[accountId]) acc[accountId] = [];
                acc[accountId].push(scrub);
                return acc;
            }, {});

            logger.info(`Number of Invoices to create: ${Object.keys(scrubsGrouped).length}`);
            const invTemp = setInvTemp(invDate);

            for (const [key, scrubs] of Object.entries(scrubsGrouped)) {
                const createInvoiceResponse = await createInvoice(key, scrubs, { ...invTemp });
                if (createInvoiceResponse && createInvoiceResponse.message === 'The invoice has been created.') {
                    await updateScrubRecords(scrubs, createInvoiceResponse.invoice);
                } else {
                    logger.error(`Invoice did not generate for ${key}`);
                }
            }
        } else {
            logger.info('No scrub batches to invoice');
            logger.info(zScrubs);
        }
    }
};

const setInvTemp = (invDate) => {
    return {
        allow_partial_payments: true,
        custom_fields: [
            { api_name: 'cf_service_type', value: 'Number Scrubbing' },
            { api_name: 'cf_billing_cycle', value: 'One Time' }
        ],
        date: invDate,
        payment_options: {
            payment_gateways: [{ gateway_name: 'authorize_net', configured: true }]
        },
        payment_terms_label: 'Due on Receipt',
        template_id: 1743789000009974029
    };
};

const createInvoice = async (key, scrubs, invoiceHash) => {
    const booksContact = await booksApi.booksContactFromCrmId(key);
    const booksContactId = booksContact.contact_id;

    invoiceHash.customer_id = parseInt(booksContactId, 10);
    invoiceHash.contact_persons = await getContactPersons(key, booksContactId);
    invoiceHash.line_items = setLineItems(scrubs);

    const createInvoiceResponse = await booksApi.apiCall('invoices', 'post', invoiceHash);
    return createInvoiceResponse;
};

const getContactPersons = async (crmId, booksContactId) => {
    const contactsQuery = `((Email_Invoices:equals:true)and(Account_Name:equals:${crmId}))`;
    const zContacts = await crmApi.search('Contacts', contactsQuery);

    const bContactPersons = await booksApi.apiCall(`contacts/${booksContactId}/contactpersons`, 'get');
    const contactPersons = bContactPersons.contact_persons;

    const crmContactEmails = zContacts.map(value => value.Email).filter(Boolean);
    const matchingContacts = contactPersons.filter(contact =>
        crmContactEmails.includes(contact.email)
    );

    return matchingContacts.map(contact => contact.contact_person_id);
};

const setLineItems = scrubs => {
    return scrubs.map(scrub => ({
        item_id: 1743789000010144005,
        rate: 0.004,
        description: `Date: ${yesterday} Transactions: ${scrub.Transactions} Removed: ${scrub.Removed}`,
        quantity: scrub.Transactions
    }));
};

const updateScrubRecords = async (scrubs, invoiceResponse) => {
    const updateScrubHashTemp = {
        Invoiced: true,
        Invoice_Id: invoiceResponse.invoice_id,
        Invoice_Number: invoiceResponse.invoice_number
    };

    const updateScrubs = scrubs.map(scrub => ({
        ...updateScrubHashTemp,
        id: scrub.id
    }));

    const updateResponse = await crmApi.zohoCrmPost('Scrub_File_Batches/upsert', 'post', updateScrubs);

    const scrubUpdate = !updateResponse || updateResponse.length !== scrubs.length || updateResponse[0][0].message !== 'record updated'
        ? ' not '
        : ' ';

    logger.info(`Scrub batch records${scrubUpdate}updated as invoiced`);
    return updateResponse;
};

module.exports = invoiceService;