'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { dbName: process.env.DB_NAME || undefined })
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error('Mongo error', err));

require('./routes/api')(app);

app.get('/', (req, res) => res.send('Issue Tracker API'));

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on ${port}`));
}

module.exports = app;