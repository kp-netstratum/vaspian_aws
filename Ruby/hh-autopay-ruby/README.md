# README #

Hello Hunter is the platform used to blast out voice messages to clients. The auto load is multi step process with components on AWS and Zoho.

- AWS
    * There is a [AWS Eventbridge](https://us-east-1.console.aws.amazon.com/scheduler/home?region=us-east-1#schedules/default/hh_autoload) that runs every 5 minutes and triggers the ruby script lambda_function
    * The [AWS Lambda Function](https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/hh-autopay-ruby?tab=code) lambda_function checks their current balance, compares it with their threshold to reload and if its below the threshold it adds the appropriate amount to their account, then the script sends an email notification of the reload to a group email and Zoho. 
    * [AWS Cloud9 development environment](https://us-east-1.console.aws.amazon.com/cloud9/ide/299049b7d7e84f17b72e7d9614109d39) - Ruby version 2.7.2 installed so all you have to do is change the code and make a commit via the terminal
- Zoho
    * Zoho receives the email, creates a record of the reload and then creates an invoice. [Bitbucket](https://bitbucket.org/ericchrobak/deluge-functions/src/main/CRM/create_voice_dialer_reload_invoice.dg)
- Bitbucket 
    * [Bitbucket Repo](https://bitbucket.org/ericchrobak/hh-autopay-ruby/src/main/)

### What is this repository for? ###

* Quick summary
* Version Control
* Documentation

### How do I get set up? ###

- Mac
    * Install Rbenv and Ruby Build with brew - Brew install Rbenv, Brew install Ruby build
    * Install Ruby 2.7.2 with Rbenv - Rbenv install 2.7.2
    * Clone repo
    * Set local version of Ruby for folder to 2.7.2 - Rbenv local 2.7.2

- PC

### Making Changes ###
* Clone repo either locally or develop in Cloud9
* Push changes to repo
* Bitbucket will deploy to AWS

### Contribution guidelines ###

* No guidelines

### Who do I talk to? ###

* [Eric Chrobak](mailto:echrobak@vaspian.com) or [Chris Aloi](mailto:caloi@vaspian.com)
* [Vaspian Engineering](mailto:engineering@vaspian.com)