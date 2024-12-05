const express = require('express')
const cors = require('cors')
import {getProductsToAssociate, parseCsv, processAccounts } from "./services/lambda_function";

const app = express()
app.use(cors())
app.use(express.json())

const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/lambda-handler', async (req, res) => {
    try {
        const productsToAssociate = await getProductsToAssociate();
        const productsGrouped = await parseCsv(productsToAssociate);
        const accounts = Object.keys(productsGrouped);
        await processAccounts(accounts, productsGrouped);
        $logger.info("Process finished");
        res.status(200).send("Process completed successfully");
    } catch (error) {
        $logger.error("Error in lambda handler: ", error);
        res.status(500).send("Process failed");
    }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))