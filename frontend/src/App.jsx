import { useMemo } from "react";
import Header from "./components/Header";
import AddProduct from "./components/AddProduct";
import ProductList from "./components/ProductList";
import { usePantry } from "./hooks/usePantry";
import { getFreshnessStatus } from "./utils/freshness";
import "./App.css";

function App() {
  const { products, status, error, addProduct, refetch } = usePantry();

  const stats = useMemo(() => {
    let soon = 0;
    let expired = 0;

    products.forEach((product) => {
      const freshness = getFreshnessStatus(product.expiry_date);
      if (freshness === "soon") soon += 1;
      if (freshness === "expired") expired += 1;
    });

    return { total: products.length, soon, expired };
  }, [products]);

  return (
    <div className="page">
      <Header total={stats.total} soon={stats.soon} expired={stats.expired} />

      <main className="layout">
        <AddProduct onProductAdded={addProduct} />
        <ProductList
          products={products}
          status={status}
          error={error}
          onRetry={refetch}
        />
      </main>

      <footer className="site-footer">
        <p>Smart Pantry keeps a quiet eye on your shelves so nothing sneaks past its date.</p>
      </footer>
    </div>
  );
}

export default App;
