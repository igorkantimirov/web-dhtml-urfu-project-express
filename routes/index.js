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
  const currentUser = getUser(req)
  User.findOne({username:currentUser.username, email:currentUser.email}).then(obj=>{
    res.render('dashboard', {user: getUser(req), reservedTables: obj.reservedTables})
  })
});

router.post("/delete_table", ensureAuthenticated, function(req, res, next){
  const tableId = req.body.tableId
  const currentUser = getUser(req)
  User.findOne({username:currentUser.username, email:currentUser.email})
  .then(x=>{
    let tables = x.reservedTables
    tables[tableId]=undefined
    tables = tables.filter(x=> x!=undefined)
    x.reservedTables = tables
    console.log(x.reservedTables)
    x.save();
    res.json({successMessage:"deleted"});}
  );
})

// on reserve table form
router.post("/reserve_table", ensureAuthenticated, function(req, res, next){
  const room = req.body.room_type
  const date = req.body.date
  const time = req.body.time
  const additional = req.body.additional
  if(!room || !date || !time){
    // TODO: Выдать красивую ошибку
  }
  const tableInfo = {room:room, date:date, time:time, additional:additional}
  const currentUser = getUser(req)
  User.findOne({username:currentUser.username, email:currentUser.email}, function(err,obj) { 
    obj.reservedTables.push(tableInfo);
    obj.save()
  })
  res.render('success_reserved_table', {user:currentUser, tableInfo})
})

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
