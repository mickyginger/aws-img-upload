const multer = require('multer');
const uuid = require('uuid');

module.exports = multer({
  storage: multer.diskStorage({
    destination(req, file, next) {
      next(null, 'tmp/');
    },
    filename(req, file, next) {
      const ext = file.mimetype.replace('image/', '');
      next(null, `${uuid.v4()}.${ext}`);
    }
  })
});