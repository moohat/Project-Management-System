var express = require('express');
var router = express.Router();

const helpers = require("../helpers/util")


module.exports = function (pool){

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('login',{

      info: req.flash('info')
    });
  });
  
  /* GET login page. */
  router.post('/login', function(req, res, next) {
    let {
      email,
      password
    } = req.body;
    pool.query(
      `SELECT * FROM users WHERE email = '${email}'`,
      (err, data) => {
        if (data.rows.length > 0) {
          if (data.rows[0].email == email && data.rows[0].password == password) {
            // data.rows[0].password = null;
            req.session.user = data.rows[0];
            res.redirect("/projects");
          }
        } else {
          // res.send( "Email & Passwords is wrong");
          req.flash('info', "Email and Password is wrong");
          res.redirect("/");
        }
      }
    );
  });


  
  // /* GET home page. */
  // router.get('/projects', function(req, res, next) {
  //   res.render('projects/project');
  // });
  
  // // /* GET home page. */
  // // router.get('/profile', function(req, res, next) {
  // //   res.render('profile/profile');
  // // });

  // LOG OUT
  router.get("/logout", helpers.isLoggedIn, (req, res, next) => {
    req.session.destroy();
    res.redirect("/");
  });


  return router;
}

