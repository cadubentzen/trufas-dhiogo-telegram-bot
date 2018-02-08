const tableNames = require('./tableNames');

function clearAllTables(db) {
  Object.values(tableNames).forEach((name) => {
    db.run('DELETE FROM (?)', name);
  });
}

module.exports = clearAllTables;
