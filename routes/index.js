var express = require('express');
var router = express.Router();

const { ensureAuthenticated } = require("../auth.js")

router.get('/', function(req, res, next) {
  res.render('home');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.get('/reserve_table', ensureAuthenticated, function(req, res, next) {
  res.render('reserve_table');
});

// login-register
router.post('/login', function(req, res, next) {
  
});

router.post('/login', function(req, res, next) {
  
});

module.exports = router;
