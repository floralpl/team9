CREATE DATABASE IF NOT EXISTS `protfolio`;
USE `protfolio`;
CREATE TABLE portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL
);
CREATE TABLE asset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    type ENUM('stock', 'bond', 'etf', 'fund') NOT NULL  -- 可扩展
);
CREATE TABLE portfolio_asset (
    portfolio_id INT NOT NULL,
    asset_id INT NOT NULL,
    quantity INT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (portfolio_id, asset_id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
);
