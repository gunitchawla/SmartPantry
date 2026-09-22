require("dotenv").config();

const region = process.env.AWS_REGION || "us-east-1";

let DynamoDBClient;
let DynamoDBDocumentClient;
let SNSClient;
let S3Client;
let isAwsSdkInstalled = false;

try {
  const dynamoPkg = require("@aws-sdk/client-dynamodb");
  const docPkg = require("@aws-sdk/lib-dynamodb");
  const snsPkg = require("@aws-sdk/client-sns");
  const s3Pkg = require("@aws-sdk/client-s3");

  DynamoDBClient = dynamoPkg.DynamoDBClient;
  DynamoDBDocumentClient = docPkg.DynamoDBDocumentClient;
  SNSClient = snsPkg.SNSClient;
  S3Client = s3Pkg.S3Client;
  isAwsSdkInstalled = true;
} catch {
  console.log("[AWS Config] AWS SDK v3 packages not locally installed; running in local mock/fallback mode.");
}

// Base AWS Client Options
const clientConfig = {
  region,
};

let dynamoClient = null;
let docClient = null;
let snsClient = null;
let s3Client = null;

if (isAwsSdkInstalled && process.env.DB_TYPE !== "mock") {
  try {
    dynamoClient = new DynamoDBClient(clientConfig);
    docClient = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
      },
    });
    snsClient = new SNSClient(clientConfig);
    s3Client = new S3Client(clientConfig);
    console.log(`[AWS Config] Initialized AWS SDK v3 clients for region: ${region}`);
  } catch (error) {
    console.warn(`[AWS Config] AWS client initialization warning: ${error.message}`);
  }
}

module.exports = {
  region,
  tableName: process.env.DYNAMODB_TABLE_NAME || "smartpantry-inventory",
  snsTopicArn: process.env.SNS_TOPIC_ARN || "",
  s3BucketName: process.env.S3_BUCKET_NAME || "",
  isAwsSdkInstalled,
  docClient,
  snsClient,
  s3Client,
};
