require('dotenv').config();
const path = require('path');

module.exports = {
"development": {
  "username": "user",
  "password": null,
  "database": "database",
  "host": "127.0.0.1",
  "dialect": "sqlite",
  "storage": path.resolve(__dirname, '..', '..', 'data', 'database.sqlite'),
  "logging": false
}
};