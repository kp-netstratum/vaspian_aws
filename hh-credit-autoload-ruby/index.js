const express = require('express')
const cors = require('cors')
const HelloHunterService = require('./services/lambda_function');

const app = express()
app.use(cors())
app.use(express.json())

const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/lambda-handler', async (req, res) => {
    try {
        const helloHunterService = new HelloHunterService();
        const hhCustomers = await helloHunterService.initHhClient();
        const zCustomers = await helloHunterService.initZClient();
        await helloHunterService.processCustomers(zCustomers, hhCustomers);
        logger.info('Customer processing completed.');
    } catch (error) {
        logger.error('Error occurred:', error);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))