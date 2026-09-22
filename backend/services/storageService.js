const { docClient, tableName } = require("../config/aws");
const crypto = require("crypto");

let ScanCommand, PutCommand, DeleteCommand, UpdateCommand, GetCommand;
try {
  const docPkg = require("@aws-sdk/lib-dynamodb");
  ScanCommand = docPkg.ScanCommand;
  PutCommand = docPkg.PutCommand;
  DeleteCommand = docPkg.DeleteCommand;
  UpdateCommand = docPkg.UpdateCommand;
  GetCommand = docPkg.GetCommand;
} catch {
  // Graceful fallback when SDK is not present locally
}

// Local in-memory seed store for offline/local development or fallback
let inMemoryProducts = [
  {
    id: "prod-001",
    name: "Whole Milk",
    quantity: 2,
    expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Expiring tomorrow
    category: "Dairy",
    status: "soon",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-002",
    name: "Sourdough Bread",
    quantity: 1,
    expiry_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Expired 2 days ago
    category: "Bakery",
    status: "expired",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-003",
    name: "Free Range Eggs (Dozen)",
    quantity: 12,
    expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Fresh
    category: "Dairy",
    status: "fresh",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-004",
    name: "Rolled Oats 1kg",
    quantity: 1, // Low stock
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    category: "Pantry",
    status: "fresh",
    created_at: new Date().toISOString(),
  }
];

function calculateStatus(expiryDateStr) {
  if (!expiryDateStr) return "fresh";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "soon";
  return "fresh";
}

const storageService = {
  async checkHealth() {
    if (!docClient || !ScanCommand) {
      return { status: "operational", mode: "in-memory-fallback", table: tableName };
    }
    try {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });
      await docClient.send(command);
      return { status: "connected", mode: "dynamodb", table: tableName };
    } catch (error) {
      return { status: "degraded", mode: "in-memory-fallback", error: error.message };
    }
  },

  async getAllProducts() {
    if (process.env.DB_TYPE === "mock" || !docClient || !ScanCommand) {
      return [...inMemoryProducts].map((item) => ({
        ...item,
        status: calculateStatus(item.expiry_date),
      }));
    }

    try {
      const command = new ScanCommand({
        TableName: tableName,
      });
      const response = await docClient.send(command);
      const items = response.Items || [];
      return items.map((item) => ({
        ...item,
        status: calculateStatus(item.expiry_date),
      }));
    } catch (error) {
      console.warn(`[StorageService] DynamoDB scan failed (${error.message}). Falling back to memory store.`);
      return [...inMemoryProducts].map((item) => ({
        ...item,
        status: calculateStatus(item.expiry_date),
      }));
    }
  },

  async getProductById(id) {
    if (process.env.DB_TYPE === "mock" || !docClient || !GetCommand) {
      return inMemoryProducts.find((p) => String(p.id) === String(id)) || null;
    }

    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: { id: String(id) },
      });
      const response = await docClient.send(command);
      if (response.Item) {
        return {
          ...response.Item,
          status: calculateStatus(response.Item.expiry_date),
        };
      }
      return null;
    } catch (error) {
      console.warn(`[StorageService] DynamoDB get failed (${error.message}). Using memory fallback.`);
      return inMemoryProducts.find((p) => String(p.id) === String(id)) || null;
    }
  },

  async addProduct(product) {
    const id = product.id || `item-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const status = calculateStatus(product.expiry_date);
    const newProduct = {
      id: String(id),
      name: String(product.name).trim(),
      quantity: Number(product.quantity) || 1,
      expiry_date: product.expiry_date,
      category: product.category || "General",
      status,
      created_at: new Date().toISOString(),
    };

    if (process.env.DB_TYPE === "mock" || !docClient || !PutCommand) {
      inMemoryProducts.push(newProduct);
      return newProduct;
    }

    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: newProduct,
      });
      await docClient.send(command);
      console.log(`[StorageService] Successfully wrote item to DynamoDB: ${newProduct.id} (${newProduct.name})`);
      return newProduct;
    } catch (error) {
      console.warn(`[StorageService] DynamoDB put failed (${error.message}). Storing in memory fallback.`);
      inMemoryProducts.push(newProduct);
      return newProduct;
    }
  },

  async deleteProduct(id) {
    if (process.env.DB_TYPE === "mock" || !docClient || !DeleteCommand) {
      const initialLength = inMemoryProducts.length;
      inMemoryProducts = inMemoryProducts.filter((p) => String(p.id) !== String(id));
      return inMemoryProducts.length < initialLength;
    }

    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: { id: String(id) },
      });
      await docClient.send(command);
      console.log(`[StorageService] Successfully deleted item from DynamoDB: ${id}`);
      return true;
    } catch (error) {
      console.warn(`[StorageService] DynamoDB delete failed (${error.message}). Deleting from memory.`);
      inMemoryProducts = inMemoryProducts.filter((p) => String(p.id) !== String(id));
      return true;
    }
  },

  async updateQuantity(id, quantity) {
    const qty = Number(quantity);
    if (process.env.DB_TYPE === "mock" || !docClient || !UpdateCommand) {
      const item = inMemoryProducts.find((p) => String(p.id) === String(id));
      if (item) {
        item.quantity = qty;
        return item;
      }
      return null;
    }

    try {
      const command = new UpdateCommand({
        TableName: tableName,
        Key: { id: String(id) },
        UpdateExpression: "SET quantity = :q",
        ExpressionAttributeValues: {
          ":q": qty,
        },
        ReturnValues: "ALL_NEW",
      });
      const response = await docClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.warn(`[StorageService] DynamoDB update failed (${error.message}). Updating memory store.`);
      const item = inMemoryProducts.find((p) => String(p.id) === String(id));
      if (item) {
        item.quantity = qty;
        return item;
      }
      return null;
    }
  },
};

module.exports = storageService;
