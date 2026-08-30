import { useState } from "react";
import "./AddProduct.css";

function AddProduct({ onProductAdded }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await onProductAdded({
        name,
        quantity: Number(quantity),
        expiry_date: expiryDate,
      });

      setFeedback({ type: "success", message: `${name} added to the shelf.` });
      setName("");
      setQuantity("");
      setExpiryDate("");
    } catch (error) {
      console.error("Error adding product:", error);
      setFeedback({ type: "error", message: "Couldn't add that item. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="add-card" aria-labelledby="add-card-title">
      <span className="add-card__tab">New item</span>

      <h2 id="add-card-title">Add to pantry</h2>
      <p className="add-card__hint">
        Log what came in so nothing gets lost at the back of the shelf.
      </p>

      <form onSubmit={handleSubmit} className="add-form">
        <label className="field">
          <span>Product name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rolled oats"
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Quantity</span>
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="2"
              min="1"
              required
            />
          </label>

          <label className="field">
            <span>Expiry date</span>
            <input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              required
            />
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Adding\u2026" : "Add to shelf"}
        </button>

        {feedback && (
          <p className={`form-feedback form-feedback--${feedback.type}`} role="status">
            {feedback.message}
          </p>
        )}
      </form>
    </section>
  );
}

export default AddProduct;
