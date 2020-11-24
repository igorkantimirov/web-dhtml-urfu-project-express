var express = require("express");
var router = express.Router();

var passport = require('passport');
const { ensureAuthenticated } = require("../auth.js");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { json } = require("body-parser");

function getUser(req){
  if(req.user) {
    return {
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone
    };
  }
  else return undefined;
}

router.get("/", function (req, res, next) {
  res.render("home", {user: getUser(req)});
});

router.get("/login", function (req, res, next) {
  res.render("login", {user: getUser(req)});
});

router.get("/register", function (req, res, next) {
  res.render("register", {user: getUser(req)});
});

router.get("/reserve_table", ensureAuthenticated, function (req, res, next) {
  res.render("reserve_table", {user: getUser(req)});
});

router.get("/dashboard", ensureAuthenticated, function (req, res, next) {
  res.render('dashboard', {user: getUser(req)})
});

// login-register
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

router.post("/register", function (req, res, next) {
  let newUser = undefined;
  try {
    newUser = new User({
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone_number,
      password: req.body.user_password,
    });
  } catch (e) {
    console.log(e);
  }

  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      req.flash("error_msg", "User with that email already exists");
      res.redirect("/register");
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              req.flash("success_msg", "You are now registered and can log in");
              res.redirect("/login");
            })
            .catch((err) => console.log(err));
        });
      });

      res.status(200, "OK");
    }
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/login");
});

module.exports = router;
