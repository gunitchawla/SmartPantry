import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function usePantry() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

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
      await api.post("/products", payload);
      await fetchProducts();
    },
    [fetchProducts]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchProducts();
  }, [fetchProducts]);

  return { products, status, error, addProduct, refetch: fetchProducts };
}