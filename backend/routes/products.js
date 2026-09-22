const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");

// Product CRUD Endpoints
router.get("/", controller.getProducts);
router.post("/", controller.addProduct);
router.delete("/:id", controller.deleteProduct);
router.patch("/:id/quantity", controller.updateQuantity);

// Cloud Managed Services Integration Endpoints
router.post("/audit", controller.runAudit);               // Amazon SNS Audit sweep
router.post("/subscribe", controller.subscribeEmail);     // Amazon SNS Email Subscription
router.post("/export", controller.exportToS3);           // Amazon S3 Report Upload

module.exports = router;