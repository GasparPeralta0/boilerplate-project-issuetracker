'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Boilerplate UI
// Static assets
app.use('/public', express.static(process.cwd() + '/public'));

// Home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Project page: /apitest etc.
app.get('/:project', (req, res) => {
  res.sendFile(process.cwd() + '/views/issue.html');
});;

// ✅ Mongo
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || undefined })
    .then(() => console.log('Mongo connected'))
    .catch(err => console.error('Mongo error', err));
}

// ✅ FCC test runner endpoint (lo que faltaba)
const runner = require('./test-runner');
app.get('/_api/get-tests', (req, res) => {
  runner.removeAllListeners('done'); // evita duplicados si refrescas
  runner.on('done', (tests) => res.json(tests));
  runner.run();
});

// ✅ Tu API
require('./routes/api')(app);

// ✅ Home
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on ${port}`));
}

module.exports = app;