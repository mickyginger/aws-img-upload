const User = require('../models/user');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const s3 = Promise.promisifyAll(require('../lib/s3'));

function newRoute(req, res) {
  return res.render('registrations/new');
}

function createRoute(req, res, next) {
  if(req.file) req.body.profileImage = req.file.filename;
  User
    .create(req.body)
    .then(() => {
      if(!req.file) return false;
      return fs.readFileAsync(req.file.path)
        .then((data) => {
          s3.putObjectAsync({
            Key: req.file.filename,
            Body: new Buffer(data, 'binary'),
            ContentType: req.file.mimetype,
            ContentLength: req.file.size
          });
        });
    })
    .then(() => {
      res.redirect('/login');
    })
    .catch((err) => {
      if(err.name === 'ValidationError') return res.badRequest('/register', err.toString());
      next(err);
    })
    .finally(() => {
      fs.unlinkAsync(req.file.path)
        .catch(next);
    });
}

module.exports = {
  new: newRoute,
  create: createRoute
};