![GitHub Actions Workflow Status](https://github.com/epunx2/hh-credit-autoload-ruby/actions/workflows/main.yaml/badge.svg)

# Hello Hunter Credit Autoload

Hello Hunter is the platform used to blast out voice messages to clients. The auto load is multi step process with components on AWS and Zoho.

### What it does ###
1. Triggered by an EventBridge schedule that runs at 05:00 AM UTC every Monday.
2. Pulls Accounts from Zoho CRM that have Dynamic Dialer package, reload amount, and a Hello Hunter ID.
3. Loads the Reload amount to the Hello Hunter platform
4. Creates 1 Voice Dialer Record in Zoho CRM.

## Details ##
- AWS
    * There is an [AWS Eventbridge](https://us-east-1.console.aws.amazon.com/scheduler/home?region=us-east-1#schedules/default/hh-credit-autoload-ruby) that runs every 5 minutes and triggers the ruby script lambda_function
    * The [AWS Lambda Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/hh-credit-autoload-ruby?tab=configure) lambda_function checks their current balance, compares it with their threshold to reload and if its below the threshold it adds the appropriate amount to their account, then the script sends an email notification of the reload to a group email and Zoho.
- Zoho
    * Zoho receives the email, creates a record of the reload and then creates an invoice. [Bitbucket](https://bitbucket.org/ericchrobak/deluge-functions/src/main/CRM/create_voice_dialer_reload_invoice.dg)
- GitHub
    * [GitHub Repo](https://github.com/epunx2/hh-credit-autoload-ruby)

### How do I get set up? ###

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
    https://github.com/epunx2/hh-credit-autoload-ruby.git
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

### Making Changes ###
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

### Who do I talk to? ###

* [Eric Chrobak](mailto:echrobak@vaspian.com) or [Chris Aloi](mailto:caloi@vaspian.com)
* [Vaspian Engineering](mailto:engineering@vaspian.com)
