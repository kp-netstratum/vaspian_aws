const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()

const invoiceService = require('./services/invoice-service')

const app = express()
app.use(express.json())
app.use(cors())

const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/generate-invoices', async (req, res) => {
    try {
        await invoiceService.generateInvoices();
        res.status(200).send('Invoices generation process completed.');
      } catch (error) {
        console.error('Error generating invoices:', error.message);
        res.status(500).send('Error generating invoices');
      }
})

app.listen(port, () => console.log(`app running on port : ${port}`))