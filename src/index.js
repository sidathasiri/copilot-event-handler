const {
  DynamoDBClient,
  PutItemCommand,
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

      //   const machineId = messageBody.machineId;
      const machineId = messageBody.machineId;
      const eventName = messageBody.eventName;
      const datetime = messageBody.datetime;

      const getItemParams = {
        TableName: "CopilotUsage", // Replace with your DynamoDB table name
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

      const putItemParams = {
        TableName: "CopilotUsage",
        Item: {
          pk: { S: `user#${user.githubId.S}` },
          sk: { S: `metric#${eventName}#date#${datetime}` },
          githubId: { S: user.githubId.S },
          type: { S: eventName },
          value: { S: "1" },
          date: { S: datetime },
        },
      };

      await dynamoDbClient.send(new PutItemCommand(putItemParams));
      console.log("Record persisted successfully");
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }
};
