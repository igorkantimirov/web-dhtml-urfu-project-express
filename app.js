var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('connect-flash');
const mongoose = require("mongoose");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// db
mongoose.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function(err){
    if(err) return console.log(err);
    app.listen(3000, function(){
        console.log("Сервер ожидает подключения...");
    });
});

// passport js
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

const LocalStrategy = require('passport-local').Strategy

passport.use(
  new LocalStrategy(function (username, password, done) {
    User.findOne({ email: username }, function (err, user) {
      bcrypt.compare(password.user.password, (err, isMatch) => {
        if (err) { console.log(err); throw err; };
        if (isMatch) return done(null, user);
        else {
          done(new Error("invalid user or password"));
        }
      });
    });
    User.findOne({ phone: username }, function (err, user) {
      bcrypt.compare(password.user.password, (err, isMatch) => {
        if (err) { console.log(err); throw err; };
        if (isMatch) return done(null, user);
        else {
          done(new Error("invalid user or password"));
        }
      });
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(flash())
app.use((req,res,next)=> {
  res.locals.sucess_msg = req.flash('sucess_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next()
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
