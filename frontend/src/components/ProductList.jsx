import { useEffect, useState } from "react";
import api from "../services/api";

function ProductList() {

    const [products, setProducts] = useState([]);

    useEffect(() => {

        api.get("/products")
            .then((response) => {
                setProducts(response.data);
            });

    }, []);

    return (

        <div>

            <h2>Products</h2>

            <table border="1">

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Expiry</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        products.map((product) => (

                            <tr key={product.id}>

                                <td>{product.name}</td>
                                <td>{product.quantity}</td>
                                <td>{product.expiry_date}</td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default ProductList;