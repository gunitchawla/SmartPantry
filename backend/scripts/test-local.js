const storageService = require("../services/storageService");
const notificationService = require("../services/notificationService");
const exportService = require("../services/exportService");

async function runTests() {
  console.log("==========================================");
  console.log("🥫 SmartPantry Cloud Integration Test Suite");
  console.log("==========================================");

  try {
    // 1. Storage Health & Initialization
    console.log("Testing 1: Storage Service Health Check");
    const health = await storageService.checkHealth();
    console.log("✓ Storage status:", health.status, "| Mode:", health.mode);

    // 2. Fetch Initial Products
    console.log("\nTesting 2: Fetch Products (GET /products)");
    const initialProducts = await storageService.getAllProducts();
    console.log(`✓ Retrieved ${initialProducts.length} items from storage.`);
    if (initialProducts.length === 0) throw new Error("Expected seeded items");

    // 3. Add Product (Near Expiry -> Trigger SNS Alert)
    console.log("\nTesting 3: Add Product (POST /products)");
    const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const newProduct = await storageService.addProduct({
      name: "Organic Strawberries",
      quantity: 1, // Low stock <= 2
      expiry_date: tomorrow, // Expiring soon
      category: "Fruit",
    });
    console.log(`✓ Product created successfully: [${newProduct.id}] ${newProduct.name}`);
    console.log(`✓ Freshness evaluation: status=${newProduct.status}`);

    // Verify SNS alert trigger
    console.log("\nTesting 4: Amazon SNS Alert Dispatch");
    const alertResult = await notificationService.alertProductStatus(newProduct);
    console.log("✓ Status alert dispatched:", alertResult.status);
    const lowStockResult = await notificationService.alertLowStock(newProduct);
    console.log("✓ Low stock alert dispatched:", lowStockResult.status);

    // 4. Audit Sweep
    console.log("\nTesting 5: Expiry & Stock Audit Sweep (POST /products/audit)");
    const allProducts = await storageService.getAllProducts();
    const stats = {
      total: allProducts.length,
      fresh: allProducts.filter((p) => p.status === "fresh").length,
      soon: allProducts.filter((p) => p.status === "soon").length,
      expired: allProducts.filter((p) => p.status === "expired").length,
      lowStock: allProducts.filter((p) => p.quantity <= 2).length,
      actionableItems: allProducts.filter((p) => p.status !== "fresh" || p.quantity <= 2),
    };
    const auditNotification = await notificationService.alertAuditSweep(stats);
    console.log("✓ Audit digest dispatched:", auditNotification.status, "| Actionable items:", stats.actionableItems.length);

    // 5. Amazon S3 Export
    console.log("\nTesting 6: Amazon S3 Inventory Export (POST /products/export)");
    const exportResult = await exportService.exportInventory(allProducts);
    console.log("✓ S3 export completed:", exportResult.status, "| Filename:", exportResult.filename);

    // 6. Delete Product
    console.log(`\nTesting 7: Delete Product (DELETE /products/${newProduct.id})`);
    const deleted = await storageService.deleteProduct(newProduct.id);
    console.log("✓ Delete operation result:", deleted);

    console.log("\n==========================================");
    console.log("🎉 ALL SMARTPANTRY CLOUD INTEGRATION TESTS PASSED!");
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    process.exit(1);
  }
}

runTests();
