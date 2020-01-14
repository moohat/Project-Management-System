var express = require('express');
var router = express.Router();

const helpers = require("../helpers/util")


module.exports = function (pool){
/* GET home page. */
// router.get('/', function(req, res, next) {
//   let sql = `SELECT COUNT(*) AS total FROM users`
//     res.render('users/listUsers');
//   });

     //todo: function get pagination only
    router.get("/",helpers.isLoggedIn, (req, res, next) => {
        const page = req.query.page || 1;
        let url = req.url == '/' ? '/?page=1' : req.url;
        const limit = 3;
        const offset = (page - 1) * limit;
        pool.query(`SELECT COUNT(*) AS total FROM users  `, (err, response) => {
            if (err) return res.send(err);
            const pages = Math.ceil(response.rows[0].total / limit);


            sql = `SELECT * FROM users  ORDER BY userid LIMIT ${limit} OFFSET ${offset}`;
            pool.query(sql, (err, response) => {
                if (err) return res.send(err);
                res.render('users/listUsers', {
                    data: response.rows,
                    query: req.query,
                    pages,
                    page,
                    url


                });
            });
        });
    });

  /* GET add user page. */
router.get('/add',helpers.isLoggedIn, function(req, res, next) {
  res.render('users/addUser');
});

  //post add user
  router.post("/add", (req, res, next) =>{
    const sql = `INSERT INTO users(firstname, lastname,email, password, position, jobtype) VALUES ($1, $2, $3, $4, $5, $6) `;
    const data = [
      req.body.firstname,
      req.body.lastname,
      req.body.email,
      req.body.password,
      req.body.position,
      req.body.jobtype
    ]

    pool.query(sql, data, err =>{
      if(err){
        console.log(err.message);        
      }
      console.log(`data: ${data} berhasil diinput` );
          res.redirect('/users');

    });
  });

  /* Get Edit users. */
  router.get('/edit/:userid', function(req, res, next) {
    let sql = `SELECT * FROM users WHERE userid = ${req.params.userid}`;
    pool.query(sql, (err,user) =>{
      res.render('users/editUser', {
        user: user.rows[0]
      });

    });
  });

   /* post edit users. */
   router.post('/edit/:userid', function(req, res, next) {
    const userid = req.params.userid;
  const data = [
    req.body.firstname,
    req.body.lastname,
    req.body.email,
    req.body.password,
    req.body.position,
    req.body.jobtype,
    userid
  ]
    // let sql = `UPDATE users SET firstname ='${req.body.firstname}', lastname = '${req.body.lastname}', email = '${req.body.email}', password = '${ req.body.password}', position = '${ req.body.position}', jobtype = '${ req.body.jobtype}'  WHERE userid =${req.params.userid}`;

    let sql = `UPDATE users SET firstname = $1, lastname = $2, email = $3, password = $4, position = $5, jobtype = $6  WHERE (userid = $7) `;
    

    console.log(sql);
    
    pool.query(sql,data, (err,user) =>{
      if (err) {
        return console.error(err.message);
      }
      console.log(data);
      
      res.redirect('/users');

    });
  });

  //delete users
  router.get("/delete/:userid", (req, res, next) =>{
    const userid = req.params.userid;
    // let sql = `DELETE FROM members WHERE (userid = $1); DELETE FROM users WHERE (userid = $1)`;
    // let sql = `DELETE members, users FROM members INNER JOIN users WHERE members.userid = users.userid AND users.userid = '${userid}'`;
    let sql = `DELETE FROM members WHERE userid = ${userid}; DELETE FROM users WHERE userid = ${userid}`;
    pool.query(sql, (err) =>{
      if (err) {
        return console.error(err.message);
      }
      console.log('Delete Success');      
    });
    res.redirect('/users')
  });
//   router.get('/',helpers.isLoggedIn, function(req, res, next) {
//     res.render('profile/viewProfile');
//   });

  return router;
};