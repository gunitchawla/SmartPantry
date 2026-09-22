import { useMemo } from "react";
import Header from "./components/Header";
import AddProduct from "./components/AddProduct";
import ProductList from "./components/ProductList";
import CloudControls from "./components/CloudControls";
import { usePantry } from "./hooks/usePantry";
import { getFreshnessStatus } from "./utils/freshness";
import "./App.css";

function App() {
  const {
    products,
    status,
    error,
    actionFeedback,
    cloudHealth,
    addProduct,
    deleteProduct,
    runAudit,
    subscribeAlerts,
    exportToS3,
    refetch,
  } = usePantry();

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

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        {actionFeedback && (
          <div
            role="status"
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              fontWeight: 600,
              fontSize: "0.92rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: actionFeedback.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: actionFeedback.type === "success" ? "#065f46" : "#991b1b",
              border: `1px solid ${actionFeedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            <span>{actionFeedback.message}</span>
          </div>
        )}

        <CloudControls
          onRunAudit={runAudit}
          onExportToS3={exportToS3}
          onSubscribeAlerts={subscribeAlerts}
          cloudHealth={cloudHealth}
        />
      </div>

      <main className="layout">
        <AddProduct onProductAdded={addProduct} />
        <ProductList
          products={products}
          status={status}
          error={error}
          onRetry={refetch}
          onDelete={deleteProduct}
        />
      </main>

      <footer className="site-footer">
        <p>
          SmartPantry Cloud Edition • Powered by AWS EC2, DynamoDB, SNS, and S3 • COSC349 Assignment 2
        </p>
      </footer>
    </div>
  );
}

export default App;