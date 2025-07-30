# team9
### ProjectManagement Sheet
【Tencent Docs】Project Management
https://docs.qq.com/smartsheet/DR0F6cGxoQ0hKVHVO?tab=ss_ydvsoc
# Portfolio Management System

This system is primarily designed for asset management in stock investment scenarios. It enables users to conveniently view price trends of stocks by entering stock codes, helping them quickly understand stock information. The system records stock purchases and sales, continuously updates stock prices, and visually displays investment gains/losses and total asset value. If time permits, the system will also incorporate features for fund/bond investments and salary/income tracking.

## Key Features
- Query stock information using stock codes
- Buy/sell stocks and display holdings, with support for recording historical stock purchases
- Display profit/loss percentages of held stocks categorized by gain/loss type
- Calculate and visualize personal cash balance and total assets

## Built With
- HTML5 & CSS
- Node.js
- SQL
- Third-party Libraries: express, mysql2, yahoo-finance2, node-cron, cors

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/floralpl/team9.git
```

2.Modify the database configuration in db.js according to your setup:

```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'YOUR_PASSWORD', // Replace with your password
  database: 'portfolio',
});
```

3.Initialize the database and create tables/views (find database.sql in root directory):

```bash
mysql -u [username] -p < database.sql
```

Enter your password when prompted

4.Start the stock data initialization and scheduled update task:

```bash
node ./utils/updateStockInfo.js
```

5.Launch the server:

```bash
node server.js
```

Access the application at:```text
https://localhost:5000/index.html```
