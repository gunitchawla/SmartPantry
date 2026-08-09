const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "192.168.56.12",
    user: "pantryuser",
    password: "pantrypassword",
    database: "smartpantry"
});

connection.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL");
    }
});

module.exports = connection;