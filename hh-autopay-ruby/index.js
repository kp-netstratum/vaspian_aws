const express = require('express');
const { lambdaHandler } = require('./services/lambda_functions'); // Import the service function

const app = express();
const port = 3000;

// Basic route to check if the server is working
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Route to trigger the Lambda function
app.get('/trigger-lambda', async (req, res) => {
    try {
        console.log('Lambda function started');
        await lambdaHandler(req.body, {});  // Passing the request body and an empty context
        console.log('Lambda function completed successfully');
        res.status(200).send('Lambda function executed successfully');
    } catch (error) {
        console.error('Error in Lambda function execution', error);
        res.status(500).send('Error executing Lambda function');
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

// To run the code directly for testing
if (require.main === module) {
    // If this is being run directly (not in a Lambda environment), call the Lambda function for testing
    const event = {}; // Mock event if running directly
    const context = {}; // Mock context if running directly
    lambdaHandler(event, context);
}
