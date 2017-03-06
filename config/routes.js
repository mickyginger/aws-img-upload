const router = require('express').Router();
const registrations = require('../controllers/registrations');
const sessions = require('../controllers/sessions');
const secureRoute = require('../lib/secureRoute');
const upload = require('../lib/upload');

router.get('/', secureRoute, (req, res) => res.render('statics/index'));

router.route('/register')
  .get(registrations.new)
  .post(upload.single('profileImage'), registrations.create);

router.route('/login')
  .get(sessions.new)
  .post(sessions.create);

router.route('/logout')
  .get(sessions.delete);

router.all('*', (req, res) => res.notFound());

module.exports = router;