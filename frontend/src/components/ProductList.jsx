import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { getFreshnessStatus } from "../utils/freshness";
import "./ProductList.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "soon", label: "Expiring soon" },
  { id: "expired", label: "Expired" },
];

function ProductList({ products, status, error, onRetry, onDelete }) {
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    });
  }, [products]);

  const visible = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((product) => getFreshnessStatus(product.expiry_date) === filter);
  }, [sorted, filter]);

  return (
    <section className="pantry-section" aria-labelledby="pantry-title">
      <div className="pantry-section__head">
        <h2 id="pantry-title">Your shelf</h2>

        <div className="filter-chips" role="tablist" aria-label="Filter pantry items">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`chip ${filter === item.id ? "chip--active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <div className="pantry-grid" aria-busy="true" aria-label="Loading pantry items">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="product-card product-card--skeleton" key={index} />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="state-panel state-panel--error">
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && visible.length === 0 && (
        <div className="state-panel">
          <p>
            {filter === "all"
              ? "Your pantry is empty. Add your first item to start tracking freshness."
              : "Nothing matches this filter right now."}
          </p>
        </div>
      )}

      {status === "ready" && visible.length > 0 && (
        <div className="pantry-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductList;