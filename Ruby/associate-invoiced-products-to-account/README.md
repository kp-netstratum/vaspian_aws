![GitHub Actions Workflow Status](https://github.com/epunx2/associate-invoiced-products-to-account/actions/workflows/main.yaml/badge.svg)

# Associate Invoiced Products To Account

AWS Lambda Ruby Function

### What it does ###
1. Triggered by an EventBridge schedule that runs at 16:00 UTC every 1st, 2nd, 15th, 16th of the month.
2. Pulls Invoices from Zoho Books that contain Office Billing and dated today.
3. Compares the Products currently associated with the Account in Zoho CRM to the Products on the Invoice.
4. Any products not associated with the Account are added to the Account in Zoho CRM.
5. Any products that are associated with the Account but not on the Invoice are removed from the Account in Zoho CRM.

## Details ##

**AWS Lambda Function Name:**   ***[Associate Invoiced Products To Account](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/associate-invoiced-products-to-account?tab=code)***

**AWS Lambda Function Runtime:** ***[Ruby 3.3.0](https://docs.ruby-lang.org/en/3.3/)***

**Amazon EventBridge Rule Name:** ***[Associate Invoiced Products To Account](https://us-east-1.console.aws.amazon.com/scheduler/home?region=us-east-1#schedules/default/associate-invoiced-products-to-account)***

**GitHub Repository Name:**  ***[Associate Invoiced Products To Account](https://github.com/epunx2/associate-invoiced-products-to-account)***

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
    $ git clone
    https://github.com/epunx2/hello-hunter-dynamic-dialer-weekly-reload.git
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
  * Push to GitHub *(you may be prompted to enter your GitHub app password)*
  ```bash
  $ git push origin main
  ```
GitHub will automatically deploy the changes to AWS Lambda.

## Who do I talk to? ##

* [Eric Chrobak](mailto:echrobak@vaspian.com) or [Chris Aloi](mailto:caloi@vaspian.com)
* [Vaspian Engineering](mailto:engineering@vaspian.com)
