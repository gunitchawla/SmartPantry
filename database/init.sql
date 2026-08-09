CREATE TABLE products (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100),

    quantity INT,

    expiry_date DATE

);

INSERT INTO products(name, quantity, expiry_date)

VALUES

('Milk',2,'2026-08-15'),

('Bread',1,'2026-08-10'),

('Eggs',12,'2026-08-20');