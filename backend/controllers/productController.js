const db = require("../config/db");

// Get all products
exports.getProducts = (req, res) => {

    db.query("SELECT * FROM products", (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error fetching products",
                error: err
            });
        }

        res.status(200).json(results);
    });

};

// Add a new product
exports.addProduct = (req, res) => {

    const { name, quantity, expiry_date } = req.body;

    const sql = `
        INSERT INTO products
        (name, quantity, expiry_date)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [name, quantity, expiry_date],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to add product",
                    error: err
                });
            }

            res.status(201).json({
                success: true,
                message: "Product added successfully",
                id: result.insertId
            });

        }
    );
};