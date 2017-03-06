const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const { dbURI } = require('../config/environment');
const User = require('../models/user');

mongoose.connect(dbURI);

User.collection.drop();

mongoose.connection.close();

