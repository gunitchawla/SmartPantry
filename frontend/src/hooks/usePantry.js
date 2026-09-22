import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function usePantry() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [cloudHealth, setCloudHealth] = useState(null);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setActionFeedback(null);
    }, 4500);
  };

  const fetchHealth = useCallback(async () => {
    try {
      const res = await api.get("/health");
      setCloudHealth(res.data);
    } catch {
      // Non-critical, just keep health null or minimal
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await api.get("/products");
      setProducts(Array.isArray(response.data) ? response.data : []);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Couldn't reach the pantry server. Check that the API is running.");
      setStatus("error");
    }
  }, []);

  const addProduct = useCallback(
    async (payload) => {
      const response = await api.post("/products", payload);
      await fetchProducts();
      return response.data;
    },
    [fetchProducts]
  );

  const deleteProduct = useCallback(
    async (id) => {
      try {
        await api.delete(`/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setActionFeedback({ type: "success", message: "Item removed from pantry." });
        clearFeedbackAfterDelay();
      } catch (err) {
        console.error("Error deleting product:", err);
        setActionFeedback({ type: "error", message: "Failed to delete item." });
        clearFeedbackAfterDelay();
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (id, quantity) => {
      try {
        const response = await api.patch(`/products/${id}/quantity`, { quantity });
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, quantity: response.data.product.quantity } : p))
        );
      } catch (err) {
        console.error("Error updating quantity:", err);
      }
    },
    []
  );

  const runAudit = useCallback(async () => {
    try {
      const response = await api.post("/products/audit");
      setActionFeedback({
        type: "success",
        message: `Audit complete! Amazon SNS alert sent for ${response.data.stats.actionableItems.length} actionable item(s).`,
      });
      clearFeedbackAfterDelay();
      return response.data;
    } catch (err) {
      console.error("Error running audit:", err);
      setActionFeedback({ type: "error", message: "Failed to complete audit sweep." });
      clearFeedbackAfterDelay();
      throw err;
    }
  }, []);

  const subscribeAlerts = useCallback(async (email) => {
    try {
      const response = await api.post("/products/subscribe", { email });
      setActionFeedback({
        type: "success",
        message: `Subscription initiated! Check ${email} to confirm Amazon SNS alerts.`,
      });
      clearFeedbackAfterDelay();
      return response.data;
    } catch (err) {
      console.error("Error subscribing:", err);
      setActionFeedback({ type: "error", message: "Failed to subscribe to alerts." });
      clearFeedbackAfterDelay();
      throw err;
    }
  }, []);

  const exportToS3 = useCallback(async () => {
    try {
      const response = await api.post("/products/export");
      const filename = response.data.result?.filename || "report.json";
      setActionFeedback({
        type: "success",
        message: `Report exported to Amazon S3: ${filename}`,
      });
      clearFeedbackAfterDelay();
      return response.data;
    } catch (err) {
      console.error("Error exporting to S3:", err);
      setActionFeedback({ type: "error", message: "Failed to export report to S3." });
      clearFeedbackAfterDelay();
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchHealth();
  }, [fetchProducts, fetchHealth]);

  return {
    products,
    status,
    error,
    actionFeedback,
    cloudHealth,
    addProduct,
    deleteProduct,
    updateQuantity,
    runAudit,
    subscribeAlerts,
    exportToS3,
    refetch: fetchProducts,
  };
}