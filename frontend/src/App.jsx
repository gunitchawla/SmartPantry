import { useState } from "react";
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";

function App() {

    const [refresh, setRefresh] = useState(false);

    const handleProductAdded = () => {
        setRefresh(!refresh);
    };

    return (
        <div>

            <h1>Smart Pantry</h1>

            <AddProduct
                onProductAdded={handleProductAdded}
            />

            <hr />

            <ProductList
                refresh={refresh}
            />

        </div>
    );
}

export default App;