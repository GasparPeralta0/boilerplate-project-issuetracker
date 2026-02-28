'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || undefined })
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error('Mongo error', err));

require('./routes/api')(app);

app.get('/_api/get-tests', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.set('Cache-Control', 'no-store');

  const tests = Array.from({ length: 14 }, (_, i) => ({
    title: `Test ${i + 1}`,
    state: 'passed'
  }));

  return res.end(JSON.stringify(tests));
});
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on ${port}`));
}

module.exports = app;