/* eslint prefer-arrow-callback: 0, func-names: 0,
   padded-blocks: 0, no-console: 0 */

const assert = require('assert');
const {
  describe, it, before, beforeEach,
  after,
} = require('mocha');
const sqlite3 = require('sqlite3').verbose();
const {
  createTables, clearAllTables,
} = require('../database');

// The test database runs in memory, so it's temporary and
// deleted after the tests
const db = new sqlite3.Database(':memory:');

describe('Database', function () {

  before(function () {
    // Create the tables at the beginning
    createTables(db);
  });

  after(function () {
    db.close();
  });

  beforeEach(function () {
    // Before all tests, clear all tables
    clearAllTables(db);
  });

  // TODO: really implement tests
  describe('#addSeller', function () {
    it('should add a new seller to the sellers table', function () {
      assert.ok(1);
    });
  });
});
