const {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Loop through each message in the batch
  for (const record of event.Records) {
    try {
      // Each record contains the message body
      const messageBody = JSON.parse(record.body);
      console.log("Processing message:", messageBody);

      const machineId = messageBody.machineId;
      const eventName = messageBody.eventName;
      const datetime = messageBody.datetime;

      const getItemParams = {
        TableName: "CopilotUsage",
        Key: {
          pk: { S: `user#${machineId}` },
          sk: { S: `user#${machineId}` },
        },
      };

      const command = new GetItemCommand(getItemParams);
      const response = await dynamoDbClient.send(command);
      const user = response.Item;

      console.log("User:", user);

      if (!user) {
        console.error("User not found");
        return;
      }

      const dateObject = new Date(datetime);
      // Extract only the date in YYYY-MM-DD format
      const dateOnly = dateObject.toISOString().split("T")[0];

      const updateItemParams = {
        TableName: "CopilotUsage",
        Key: {
          pk: { S: `user#${user.githubId.S}` },
          sk: { S: `metric#${eventName}#date#${dateOnly}` },
        },
        UpdateExpression: "ADD #value :increment",
        ExpressionAttributeNames: {
          "#value": "value",
        },
        ExpressionAttributeValues: {
          ":increment": { N: "1" },
        },
      };

      await dynamoDbClient.send(new UpdateItemCommand(updateItemParams));
      console.log("Record persisted successfully");
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }
};
