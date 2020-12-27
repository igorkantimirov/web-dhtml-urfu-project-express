module.exports = {
    ensureAuthenticated: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error_msg", "Please log in to view this resource");
        req.flash("error_full_msg", "Для совершения этого действия необходимо авторизоваться");
        res.redirect("/login")
    }
}