import { useState } from "react";
import api from "../services/api";

function AddProduct({ onProductAdded }) {

    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            await api.post("/products", {
                name: name,
                quantity: Number(quantity),
                expiry_date: expiryDate
            });

            setName("");
            setQuantity("");
            setExpiryDate("");

            onProductAdded();

        } catch (error) {

            console.error("Error adding product:", error);

        }
    };

    return (
        <div>

            <h2>Add Product</h2>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Product Name:</label>

                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter product name"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Quantity:</label>

                    <input
                        type="number"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        placeholder="Enter quantity"
                        min="1"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Expiry Date:</label>

                    <input
                        type="date"
                        value={expiryDate}
                        onChange={(event) => setExpiryDate(event.target.value)}
                        required
                    />
                </div>

                <br />

                <button type="submit">
                    Add Product
                </button>

            </form>

        </div>
    );
}

export default AddProduct;