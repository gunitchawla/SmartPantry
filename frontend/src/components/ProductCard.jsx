import { formatDate, formatDaysLabel, getFreshnessStatus } from "../utils/freshness";
import "./ProductCard.css";

const STATUS_LABEL = {
  fresh: "Fresh",
  soon: "Use soon",
  expired: "Expired",
  unknown: "No date",
};

function ProductCard({ product, onDelete }) {
  const status = getFreshnessStatus(product.expiry_date);

  return (
    <article className={`product-card status--${status}`}>
      <div className="product-card__body">
        <div className="product-card__top">
          <h3>{product.name}</h3>
          <span className="status-pill">{STATUS_LABEL[status]}</span>
        </div>

        <dl className="product-card__meta">
          <div>
            <dt>Qty</dt>
            <dd>{product.quantity}</dd>
          </div>
          <div>
            <dt>Best by</dt>
            <dd>{formatDate(product.expiry_date)}</dd>
          </div>
        </dl>

        {onDelete && (
          <div className="product-card__actions">
            <button
              type="button"
              className="btn-consume"
              onClick={() => onDelete(product.id)}
              title="Consume or remove item from DynamoDB managed storage"
            >
              Consume / Remove
            </button>
          </div>
        )}
      </div>

      <div className="product-card__stamp">{formatDaysLabel(product.expiry_date)}</div>
    </article>
  );
}

export default ProductCard;
