# Create Daily Scrub Batch Invoices #

AWS Lambda Ruby Function 

### What it does ###
1. Triggered by an EventBridge schedule that runs at 05:00 AM UTC every day.
2. Pulls previous day's Scrub Batch records from Zoho CRM. 
3. Creates 1 invoice in Zoho Books for each client with each scrub as a line item. 
4. Updates the scrub batch records in CRM as invoiced.

Intially a weekly process. AWS Lambda doesn't allow name changes for Lambda functions so it retained `weekly` in the name.

## Details ##

**AWS Lambda Function Name:**   ***[create-weekly-scrub-batch-invoices](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/create-weekly-scrub-batch-invoices?tab=configure)***

**AWS Lambda Function Runtime:** ***[Ruby 3.3.0](https://ruby-doc.org/3.3.0/)***

**Amazon EventBridge Rule Name:** ***[trigger-scrub-batch-invoices](https://us-east-1.console.aws.amazon.com/scheduler/home?region=us-east-1#schedules/default/trigger_scrub_batch_invoicing)***

**BitBucket Repository Name:**  ***[create-daily-scrub-batch-invoices](https://bitbucket.org/vzoho/create-daily-scrub-batch-invoices/src/main/)***

## How do I get set up? ##

### Mac ###
1. Install Ruby package manager Rbenv and Ruby Build with brew 
   ```bash
   $ brew install Rbenv 
   $ brew install Ruby build
   ```
2. Set up your shell to load rbenv:
    ```bash
    $ rbenv init
    ```
3. Install Ruby 3.3.0 with Rbenv: 
    ```bash
    $ rbenv install 3.3.0
    ```
4. Clone repo: 
    ```bash
    $ git clone https://ericchrobak@bitbucket.org/vzoho/create-weekly-scrub-batch-invoices.git
    ```
5. Set local version of Ruby for folder to 3.3.0:
   ```bash
   $ rbenv local 3.3.0
   ```
6. Install bundler
    ```bash
    $ gem install bundler
    ```
7. Install gems
    ```bash
    $ bundle install
    ```

## Making Changes ##
* Make changes
* Test changes
    ```bash
    $ ruby lambda_function.rb
    ```
* Bundle gems for deployment
    ```bash
    bundle config set --local path 'vendor/bundle' && bundle install
    ```
* Push changes to repo
  * Add to staging
  ```bash
  $ git add --all
  ``` 
  * Commit Changes
  ```bash
  $ git commit -m 'your message'
  ``` 
  * Push to BitButcket *(you may be prompted to enter your Atlassian app password)*
  ```bash
  $ git push origin main
  ``` 
Bitbucket will automatically deploy the changes to AWS Lambda.

## Who do I talk to? ##

* [Eric Chrobak](mailto:echrobak@vaspian.com) or [Chris Aloi](mailto:caloi@vaspian.com)
* [Vaspian Engineering](mailto:engineering@vaspian.com)
