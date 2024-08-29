# copilot-event-handler

This components will process the events emitted from the GitHub Copilot Proxy via the AWS SQS and persists on the DynamoDB table.

## Solution Overview

A Lambda function will be invoked when events are added to the queue for processing. The event received from the queue will include the machine ID of the user and the Copilot event. 

![Proxy Solution Image](solution.png)

First, the Lambda function will query the DynamoDB table to find the GitHub ID by the machine ID. This mapping is added to the DynamoDB table via the [Registration API](https://github.com/sidathasiri/copilot-registration-api) through the [Copilot Usage Analyzer tool](https://github.com/sidathasiri/copilot-usage-analyzer). Once the GitHub ID is found, it will increase the counter value of the received Copilot event to reflect the usage of Copilot.

The entire infrastructure can be provisioned by the provided Terraform implementation. 

**Note: Ensure to deploy the [Registration API](https://github.com/sidathasiri/copilot-registration-api) first, to create the required DynamoDB table and the [Copilot Proxy Server](https://github.com/sidathasiri/copilot-proxy-server) to create the SQS queue and emit events**

## How to setup?
- Run `npm install` to install dependencies
- Run `npm run package` to zip and prepare the lambda function source code
- Run `terraform init` to initialize the Terraform project
- Run `terraform apply` to deploy infrastructure