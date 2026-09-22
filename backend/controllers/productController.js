const storageService = require("../services/storageService");
const notificationService = require("../services/notificationService");
const exportService = require("../services/exportService");

// Get all products from Managed Storage (DynamoDB)
exports.getProducts = async (req, res) => {
  try {
    const products = await storageService.getAllProducts();
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: err.message,
    });
  }
};

// Add a new product to Managed Storage (DynamoDB) & trigger SNS alerts if needed
exports.addProduct = async (req, res) => {
  try {
    const { name, quantity, expiry_date, category } = req.body;

    if (!name || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: "Product name and expiry date are required.",
      });
    }

    const newProduct = await storageService.addProduct({
      name,
      quantity: Number(quantity) || 1,
      expiry_date,
      category: category || "General",
    });

    // Cloud Event Trigger: Asynchronously evaluate and publish Amazon SNS alert
    if (newProduct.status === "soon" || newProduct.status === "expired") {
      notificationService.alertProductStatus(newProduct).catch((err) => {
        console.error("SNS Alert dispatch error:", err);
      });
    }

    if (newProduct.quantity <= 2) {
      notificationService.alertLowStock(newProduct).catch((err) => {
        console.error("SNS Low Stock alert error:", err);
      });
    }

    res.status(201).json({
      success: true,
      message: "Product added to cloud inventory successfully",
      product: newProduct,
    });
  } catch (err) {
    console.error("Failed to add product:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: err.message,
    });
  }
};

// Delete a product from Managed Storage
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await storageService.deleteProduct(id);
    res.status(200).json({
      success: true,
      message: `Product ${id} deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: err.message,
    });
  }
};

// Update product quantity / stock
exports.updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity number is required.",
      });
    }

    const updated = await storageService.updateQuantity(id, Number(quantity));

    if (updated && updated.quantity <= 2) {
      notificationService.alertLowStock(updated).catch((err) => {
        console.error("SNS Low Stock alert error:", err);
      });
    }

    res.status(200).json({
      success: true,
      message: "Product quantity updated successfully",
      product: updated,
    });
  } catch (err) {
    console.error("Error updating quantity:", err);
    res.status(500).json({
      success: false,
      message: "Error updating quantity",
      error: err.message,
    });
  }
};

// Automated Expiry & Stock Audit Sweep -> Dispatches Amazon SNS Digest
exports.runAudit = async (req, res) => {
  try {
    const products = await storageService.getAllProducts();

    let fresh = 0;
    let soon = 0;
    let expired = 0;
    let lowStock = 0;
    const actionableItems = [];

    products.forEach((p) => {
      if (p.status === "fresh") fresh++;
      if (p.status === "soon") {
        soon++;
        actionableItems.push(p);
      }
      if (p.status === "expired") {
        expired++;
        actionableItems.push(p);
      }
      if (p.quantity <= 2) lowStock++;
    });

    const stats = {
      total: products.length,
      fresh,
      soon,
      expired,
      lowStock,
      actionableItems,
    };

    // Dispatch SNS Digest
    const notificationResult = await notificationService.alertAuditSweep(stats);

    res.status(200).json({
      success: true,
      message: "Pantry audit sweep completed and alert dispatched via Amazon SNS",
      stats,
      notification: notificationResult,
    });
  } catch (err) {
    console.error("Error running audit:", err);
    res.status(500).json({
      success: false,
      message: "Error running audit",
      error: err.message,
    });
  }
};

// Subscribe user email to Amazon SNS alerts
exports.subscribeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const result = await notificationService.subscribeEmail(email);
    res.status(200).json({
      success: true,
      message: `Subscription initiated for ${email}. Check inbox to confirm.`,
      result,
    });
  } catch (err) {
    console.error("Error subscribing email:", err);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe email to SNS alerts",
      error: err.message,
    });
  }
};

// Export inventory snapshot to Amazon S3
exports.exportToS3 = async (req, res) => {
  try {
    const products = await storageService.getAllProducts();
    const result = await exportService.exportInventory(products);
    res.status(200).json({
      success: true,
      message: "Inventory report exported to Amazon S3 bucket",
      result,
    });
  } catch (err) {
    console.error("Error exporting to S3:", err);
    res.status(500).json({
      success: false,
      message: "Failed to export inventory to S3",
      error: err.message,
    });
  }
};
