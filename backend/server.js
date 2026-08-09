const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const productRoutes = require("./routes/products");

app.use("/products", productRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});