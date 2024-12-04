const express = require('express')
const lambdaHandler = require('./services/lambda_function')

const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/lambda-handler', async (req, res) => {
    try {
        // You can pass any event or context if needed. Here, we're passing null as placeholders.
        await lambdaHandler(null, null);
        console.log('Execution completed successfully');
    } catch (error) {
        console.error('Error executing the main function:', error);
    }
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))