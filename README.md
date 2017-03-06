# Bullet Proof File Upload with AWS and Multer

## The problem

Uploading to AWS with `multer` and `multer-s3` is very simple, however the image is uploaded **before** the form is validated.

This means that even if the form validation fails, there is an image in your bucket that needs removing.

## The solution

Instead of using `multer-s3`, I am uploading the image to a `tmp/` folder, then processing the form. If the form validates, I then upload the image in the `tmp/` folder to AWS using the `aws-sdk` package. Otherwise, the record is never saved, and the image is never uploaded to S3.

Either way, I then delete the file from the `tmp/` folder.

## The code

This code is from `controllers/registrations.js`.

I am using [`bluebird`](http://bluebirdjs.com/) for promises, [`fs`](https://nodejs.org/api/fs.html) for reading the file from the `tmp/` folder, and `s3` is a configured AWS [`S3`](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html) instance.

```js
const User = require('../models/user');
const Promise = require('bluebird');
// convert `fs` and `s3` methods to promises (http://bluebirdjs.com/docs/api/promise.promisifyall.html)
const fs = Promise.promisifyAll(require('fs'));
const s3 = Promise.promisifyAll(require('../lib/s3'));

function createRoute(req, res, next) {
  // attach the filename of the file that's been uploaded to `req.body`, so it can be saved to the db
  if(req.file) req.body.profileImage = req.file.filename;

  // create a new user
  User
    .create(req.body)
    .then(() => {
      // if there's no file uploaded, move to the next `then` block
      if(!req.file) return false;

      // otherwise read the file that's just been uploaded
      return fs.readFileAsync(req.file.path)
        .then((data) => {
          // upload the file to s3, using the `putObject` method (http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)
          s3.putObjectAsync({
            Key: req.file.filename, // the filename (required)
            Body: new Buffer(data, 'binary'), // this is the file as binary data (required)
            ContentType: req.file.mimetype, // ensure s3 stores the file with the correct mime type (optional defaults to application/octet-stream)
            ContentLength: req.file.size // the size of the fine (optional)
          });
        });
    })
    .then(() => {
      // redirect the user to the login page
      res.redirect('/login');
    })
    .catch((err) => {
      // handle any errors
      if(err.name === 'ValidationError') return res.badRequest('/register', err.toString());
      next(err);
    })
    .finally(() => {
      // whatever happens delete the file from the `tmp/` folder
      fs.unlinkAsync(req.file.path)
        .catch(next);
    });
}
```

## Issues

This should be refactored into a module, which could be then required in any controller, however the `.finally` block is quite important here, and I'm not sure how to wrap that up in a module, might have to be two separate modules.

I could potentially set up a cron task which empties out the `tmp/` folder every x hours. If this was deployed to Heroku the local images would be deleted every 2 hours or so anyway, so it would be less of an issue.