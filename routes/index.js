var express = require("express");
var router = express.Router();
var passport = require('passport');
const { ensureAuthenticated } = require("../auth.js");
const bcrypt = require("bcryptjs");
const User  = require("../models/user");
const Order = require("../models/order");
const { json } = require("body-parser");
var mongoose = require('mongoose');

function getUser(req){
  if(req.user) {
    return {
      _id: req.user._id,
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
  let error_full_msg = req.flash('error_full_msg');
  if(error_full_msg.length === 0) { error_full_msg = res.locals.error }
  res.render("login", {user: getUser(req), error_msg: error_full_msg});
});

router.get("/register", function (req, res, next) {
  res.render("register", {user: getUser(req), error_msg: req.flash('error_full_msg')});
});

router.get("/reserve_table", ensureAuthenticated, function (req, res, next) {
  res.render("reserve_table", {user: getUser(req)});
});

router.get("/dashboard", ensureAuthenticated, function (req, res, next) {
  const currentUser = getUser(req)
  User.findOne({username:currentUser.username, email:currentUser.email}).then(obj=>{
    Order.find({user:obj._id}).then(reservedTables=>{
      res.render('dashboard', {user: getUser(req), reservedTables: reservedTables})
    })
  })
});

router.post("/delete_table", ensureAuthenticated, function(req, res, next){
  const tableId = req.body.tableId
  const currentUser = getUser(req)
  Order.deleteOne({_id:tableId, user:currentUser._id})
  .then(x=>{ res.json({successMessage:"deleted"})})
  .catch(err=>res.json({errorMessage: err}));
})

function checkCorrectDateTime(date, time){
  let tokensDate = date.split("-");
  let tokensTime = time.split(":");
  let otherDate = new Date(tokensDate[0], tokensDate[1], tokensDate[2], tokensTime[0], tokensTime[1]);
  let nowDate = new Date();
  delta=nowDate.getTime()-otherDate.getTime();
  if(Math.floor(delta/1000/60/60/24) > 0){
    return false;
  }
  return true;
}

// on reserve table form
router.post("/reserve_table", ensureAuthenticated, function(req, res, next){
  const room = req.body.room_type
  const date = req.body.date
  const time = req.body.time
  const persons = req.body.persons
  const table = req.body.table_radio
  const additional = req.body.additional

  if(!room || !date || !time || !persons || !table){
    res.render('error',{message:"Заполните все поля формы!", error:{status:0, stack:''}})
  }
  else if(!(["Домашний","Восточный","VIP","Музыкальный"].includes(room))){
    res.render('error',{message:"Нет такого зала!", error:{status:1, stack:room}})
  }
  else if(!checkCorrectDateTime(date, time)){
    res.render('error',{message:"Неправильная дата и время!", error:{status:1, stack:room}})
  }
  else{
    Order.findOne({room:room, table:table, date:date, time:time}).select("_id").lean().then(result=>{
      if(result){
        res.render('error',{message:"Время занято", error:{status:1, stack:room}})
      }
      else{
        const currentUser = getUser(req)
        let orderId = undefined;
        try{
          let order = new Order({room:room, date:date, time:time, additional:additional, user: currentUser._id, persons:persons, table:table})
          orderId = order._id
          order.save()
        }
        catch(e){
          console.log(e);
        }
        res.render('success_reserved_table', {user:currentUser, 
          tableInfo:{_id:orderId, room:room, date:date, time:time, additional:additional, persons:persons, table:table}
        })
      }
    })
  }
})

// login-register
router.post("/login", (req, res, next) => {
  if(!req.body.email || !req.body.user_password){
    req.flash("error_full_msg","Заполните все поля!")
    res.redirect("/login")
    next();
    return;
  }
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

router.post("/register", function (req, res, next) {
  if(!req.body.agree_rules){
    req.flash("error_full_msg", "Нужно поставить галочку");
    res.redirect("/register")
    next();
    return;
  }
  if(!req.body.username || !req.body.email || !req.body.user_password || !req.body.phone_number){
    req.flash("error_full_msg", "Нужно заполнить все поля");
    res.redirect("/register")
    next();
    return;
  }

  let newUser = undefined;
  try {
    newUser = new User({
      _id: mongoose.Types.ObjectId(),
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
      req.flash("error_full_msg", "User with that email already exists");
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

router.get("/restore_password", (req, res, next) => {
  res.render("restore_password", {user: getUser(req)});
})

/* qr code generation */
const QRCode = require('qrcode');
const { PassThrough } = require('stream');

router.get('/qr/:content', async (req, res, next) => {
    try{
        const content = req.params.content;
        if(content.length > 48){
          console.error("500");
        }
        else{
          const qrStream = new PassThrough();
          const result = await QRCode.toFileStream(qrStream, content,
                      {
                          type: 'png',
                          width: 200,
                          errorCorrectionLevel: 'H'
                      }
                  );
          qrStream.pipe(res);
        }
    } catch(err){
        console.error('Failed to return content', err);
    }
})

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/login");
});

module.exports = router;
