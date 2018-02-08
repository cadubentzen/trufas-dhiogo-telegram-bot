const {
  sellers,
  customers,
  trufas,
  movements,
} = require('./tableNames');

function createTables(db) {
  db.serialize(() => {
    // Create Sellers table
    db.run(`
      CREATE TABLE ${sellers} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_username TEXT NOT NULL,
        telegram_id INTEGER
      )
    `);

    // Create Customers table
    db.run(`
      CREATE TABLE ${customers} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_username TEXT NOT NULL,
        telegram_id INTEGER,
        balance REAL DEFAULT 0,
        seller_id INTEGER,
        FOREIGN KEY(seller_id) REFERENCES sellers(id)
      )
    `, customers);

    // Create Trufas table
    db.run(`
      CREATE TABLE ${trufas} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flavour TEXT NOT NULL,
        price REAL,
        quantity INTEGER DEFAULT 0,
        seller_id INTEGER,
        FOREIGN KEY(seller_id) REFERENCES sellers(id)
      )
    `);

    // Create Movements table
    db.run(`
      CREATE TABLE ${movements} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        value REAL NOT NULL,
        datetime DATETIME,
        customer_id INTEGER,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      )
    `, movements);
  });
}

module.exports = createTables;
