# backend configuration
terraform {
  backend "s3" {
    bucket = "copilot-analyzer-tf-backend"
    key    = "event-handler/terraform.tfstate"
    region = "us-east-1"
  }
}

# provider configuration
provider "aws" {
  region = "us-east-1"
}

# Data source to get the AWS account ID
data "aws_caller_identity" "current" {}

# Lambda function role with necessary permissions
resource "aws_iam_role" "lambda_role" {
  name = "copilot-event-handler-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach policies to Lambda role
resource "aws_iam_policy_attachment" "lambda_dynamodb_policy" {
  name       = "lambda-dynamodb-policy-attachment"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_policy_attachment" "lambda_sqs_policy" {
  name       = "lambda-sqs-policy-attachment"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_policy_attachment" "lambda_basic_execution_policy" {
  name       = "lambda-basic-execution-policy-attachment"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function definition
resource "aws_lambda_function" "copilot_event_handler" {
  function_name = "copilot-event-handler"
  role          = aws_iam_role.lambda_role.arn
  handler       = "src/index.handler"
  runtime       = "nodejs18.x"

  filename = "lambda_function_payload.zip"
  source_code_hash = filebase64sha256("lambda_function_payload.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = "CopilotUsage"
    }
  }
}

# SQS event source mapping for Lambda
resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = "arn:aws:sqs:us-east-1:${data.aws_caller_identity.current.account_id}:copilot-events"
  function_name    = aws_lambda_function.copilot_event_handler.arn
  enabled          = true
}

# Output the Lambda function ARN
output "lambda_arn" {
  value = aws_lambda_function.copilot_event_handler.arn
}
