const { s3Client, s3BucketName, region } = require("../config/aws");

let PutObjectCommand;
try {
  const s3Pkg = require("@aws-sdk/client-s3");
  PutObjectCommand = s3Pkg.PutObjectCommand;
} catch {
  // Graceful fallback when SDK is not present locally
}

const exportService = {
  getStatus() {
    return {
      configured: Boolean(s3Client && s3BucketName && PutObjectCommand),
      bucketName: s3BucketName || "not-configured",
      region,
      mode: s3Client && s3BucketName && PutObjectCommand ? "cloud-s3" : "local-simulation",
    };
  },

  async exportInventory(products) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `inventory-report-${timestamp}.json`;
    const s3Key = `exports/${filename}`;

    const reportData = {
      report_generated_at: new Date().toISOString(),
      generator: "SmartPantry Cloud Engine (COSC349 Assignment 2)",
      total_items: products.length,
      products,
    };

    const payload = JSON.stringify(reportData, null, 2);

    if (!s3Client || !s3BucketName || !PutObjectCommand) {
      console.log(`[S3 Mock/Local] Simulated inventory export (${products.length} items) -> ${filename}`);
      return {
        status: "simulated",
        filename,
        itemCount: products.length,
        bucket: "local-simulated-bucket",
      };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        Body: payload,
        ContentType: "application/json",
      });

      await s3Client.send(command);
      console.log(`[S3 Service] Successfully uploaded inventory report to s3://${s3BucketName}/${s3Key}`);

      return {
        status: "uploaded",
        bucket: s3BucketName,
        key: s3Key,
        filename,
        itemCount: products.length,
      };
    } catch (error) {
      console.error(`[S3 Service] Failed to upload to S3: ${error.message}`);
      return {
        status: "error",
        error: error.message,
        itemCount: products.length,
      };
    }
  },
};

module.exports = exportService;
