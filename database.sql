create database portfolio;
use portfolio;
-- 1. 股票信息表
CREATE TABLE stock_info (
    stock_code VARCHAR(10) PRIMARY KEY COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    company_name VARCHAR(255) COMMENT '股票所属公司',
    current_price DECIMAL(10, 2) NOT NULL COMMENT '当前价格',
    history_price JSON COMMENT '历史价格（15天内）'
) COMMENT='股票信息表';

-- 2. 投资表
CREATE TABLE portfolio (
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    quantity INT NOT NULL DEFAULT 0 COMMENT '持有数量',
    PRIMARY KEY (stock_code),
    CONSTRAINT fk_portfolio_stock FOREIGN KEY (stock_code) REFERENCES stock_info(stock_code)
        ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT='投资表';

-- 3. 交易记录表
CREATE TABLE trade_record (
    trade_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '交易ID',
    trade_type ENUM('支出', '收入') NOT NULL COMMENT '交易类型',
    trade_detail TEXT COMMENT '交易内容',
    amount DECIMAL(10, 2) NOT NULL COMMENT '金额',
    trade_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间'
) COMMENT='交易记录表';
