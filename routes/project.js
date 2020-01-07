var express = require('express');
var router = express.Router();
const path = require('path');
var moment = require('moment');

const helpers = require("../helpers/util")


module.exports = function (pool) {


    //todo: function get pagination only
    // router.get("/", (req, res, next) => {
    //     const page = req.query.page || 1;
    //     const limit = 5;
    //     const offset = (page - 1) * limit;
    //     pool.query(`SELECT COUNT(*) AS total FROM projects  `, (err, response) => {
    //         if (err) return res.send(err);
    //         const pages = Math.ceil(response.rows[0].total / limit);


    //         sql = `SELECT * FROM projects LIMIT ${limit} OFFSET ${offset}`;
    //         pool.query(sql, (err, response) => {
    //             if (err) return res.send(err);
    //             res.render('projects/listProject', {
    //                 data: response.rows,
    //                 page,
    //                 query: req.query,
    //                 pages


    //             });
    //         });
    //     });
    // });

    router.get("/", (req, res, next) => {

        // filter mode
        let params = [];
        if (req.query.check_id && req.query.id) {
            params.push(`projectid = '${req.query.id}' `)

        }
        if (req.query.check_name && req.query.name) {
            params.push(`name ILIKE '%${req.query.name}%' `)

        }


        //Pagination
        const page = req.query.page || 1;

        let url = req.url == '/' ? '/?page=1' : req.url;
        const limit = 5;
        const offset = (page - 1) * limit;
        let sql = `SELECT COUNT(*) AS total FROM projects  `;
        //check params filter

        if (params.length > 0) {
            sql += `WHERE ${params.join(' AND ')}`
        }

        pool.query(sql, (err, response) => {
            if (err) return res.send(err);
            const pages = Math.ceil(response.rows[0].total / limit);
            console.log('HALAMAN', response.rows);
            sql = `SELECT * FROM projects `;

            //check params filter
            if (params.length > 0) {
                sql += `WHERE ${params.join(' AND ')}`
            }
            sql += ` LIMIT ${limit} OFFSET ${offset}`;
            console.log(sql);

            pool.query(sql, (err, response) => {
                if (err) return res.send(err);
                res.render('projects/listProject', {
                    data: response.rows,
                    query: req.query,
                    pages,
                    page,
                    url


                });
            });
        });
    });


    router.post('/', (req, res) => {
        let sql = `UPDATE users SET projectsoptions = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`
        pool.query(sql, (err) => {
            if (err) {
                return res.send(err)
            };
            res.redirect('/projects', {
                // user: req.session.user

            })
        });
    });

    //GET FORM ADD
    router.get('/add', (req, res, next) => {
        let sql = `SELECT userid, firstname || ' ' || lastname AS fullname FROM users`;
        pool.query(sql, (err, result) => {
            if (err) {
                return res.send(err)
            };
            res.render('projects/addProject', {
                // title: 'Add Project',
                path: 'projects',
                users: result.rows,
                user: req.session.user
            });
            console.log(sql);

        });
    });


    //ADD PROJECT
    router.post('/add', (req, res, next) => {
        let sqlAddName = `INSERT INTO projects(name) VALUES('${req.body.projectname}')`;
        pool.query(sqlAddName, (err, result) => {
            let sqlAddNext = `SELECT MAX(projectid) total FROM projects`;
            pool.query(sqlAddNext, (err, result) => {
                if (err) throw err;
                let params = [];
                const projectid = result.rows[0].total;
                if (typeof req.body.members == 'string') {
                    params.push(`(${req.body.members}, ${projectid})`);
                } else {
                    for (let i = 0; i < req.body.members.length; i++) {
                        params.push(`(${req.body.members[i]}, ${projectid})`);
                    }
                }
                let sqlAddMembers = `INSERT INTO members(userid, projectid) VALUES ${params.join(', ')}`;
                pool.query(sqlAddMembers, (err) => {
                    if (err) {
                        return res.send(err)
                    };
                    res.redirect('/projects')
                });
            });
        });
    });

    router.get("/edit/:id", (req, res) => {

    });

    //OVERVIEW PROJECT
    router.get("/overview/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql1 = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        let sql2 = `SELECT * FROM issues WHERE projectid = ${projectid}`;

        pool.query(sql1, (err, data) => {
            pool.query(sql2, (err, issues) => {
                //bug counter
                let bugOpen = 0;
                let bugTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Bug" && item.status != "Closed") {
                        bugOpen += 1;
                    }
                    if (item.tracker == "Bug") {
                        bugTotal += 1;
                    }
                });
                //featur Counter
                let featureOpen = 0;
                let featureTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Feature" && item.status != "Closed") {
                        featureOpen += 1;
                    }
                    if (item.tracker == "Feature") {
                        featureTotal += 1;
                    }
                });

                //support counter
                let supportOpen = 0;
                let supportTotal = 0;
                issues.rows.forEach((item, index) => {
                    if (item.tracker == "Support" && item.status != "Closed") {
                        supportOpen += 1;
                    }
                    if (item.tracker == "Support") {
                        supportTotal += 1;
                    }
                });

                res.render("projects/overview/listOverview", {
                    data: data.rows,
                    issues: issues.rows,
                    //todo: issue tracking
                    bugOpen,
                    bugTotal,
                    featureOpen,
                    featureTotal,
                    supportOpen,
                    supportTotal,
                    // isadmin: req.session.user.isadmin;
                });
            });
        });
    });



    // router.get("/members/:projectid", (req, res, next) =>{
    // router.get("/overview/", (req, res, next) => {
    //     res.render("projects/overview/listOverview");
    // });

    router.get("/activity/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql1 = `SELECT * FROM projects WHERE projectid = ${projectid} ORDER BY projectid DESC`;
        let sql2 = `SELECT * ,(SELECT CONCAT(firstname, ' ', lastname) AS author FROM users WHERE projectid = ${projectid}) FROM activity WHERE projectid = ${projectid} ORDER BY activityid DESC`;
        // let sql2 = `SELECT * FROM activity WHERE `
        console.log(sql2);

        pool.query(sql1, (err, data) => {
            // console.log(data);
            
            if (err) {
                return res.send(err)
            };
            pool.query(sql2, (err, issues) => {
                if (err) {
                    return res.send(err)
                };
                // console.log(sql2);
                res.render("projects/overview/activity/listActivity", {
                    data: data.rows,
                    issues: issues.rows,
                });
            });
        });

    });

    

    // router.get("/members/:projectid", (req, res, next) =>{
    router.get("/members/:projectid", (req, res, next) => {
        let projectid = req.params.projectid;
        let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
        pool.query(sql, (err, data) =>{
            res.render("projects/overview/members/listMember",{
                data: data.rows,

            });

        });
    });

    //add members
    router.get("/members/:projectid/add", (req, res, next) => {
        let projectid = req.params.projectid;
        res.locals.title = "Project Details | Members";
        let sql = `SELECT userid, email, CONCAT(firstname, ' ',lastname) AS fullname FROM users WHERE userid NOT IN (SELECT userid FROM members WHERE projectid =${projectid} )`;

        pool.query(sql, (err, data) =>{
            if(data.rows.length > 0){
                res.render("projects/overview/members/addMember",{
                    data: data.rows,
                    projectid: req.params.projectid,
                });
            }else{
                res.send(err);
                res.redirect(`/projects/members/${projectid}`);               
            }

            console.log(data.rows.length);
            
        });
    });

    router.post("/members/:projectid/add", (req, res, next) =>{
        let projectid = req.params.projectid;
        let data = [
            req.body.userid,
            req.body.position,
        ]
        sql = `INSERT INTO members(userid, role, projectid) VALUES($1, $2, ${projectid})`;
        pool.query(sql,data, (err, data) =>{
            res.redirect(`/projects/members/${projectid}`);
        });
    });

    router.get("/members/:projectid/:userid/edit", (req, res, next) =>{
        let userid = req.params.userid;
        res.locals.title = "Members | Edit Member";
        let sql = `SELECT * FROM users WHERE userid = ${userid}`;
        pool.query(sql, (err, data)=>{
            res.render("projects/overview/members/editMember", {
                data: data.rows[0],
                projectid: req.params.projectid,
            });

        });

    });

    router.post("/members/:projectid/:userid/edit", (req, res, next) =>{
        console.log(req.params);
        let userid = req.params.userid;
        let projectid = req.params.projectid;
        sql = `UPDATE members SET role = '${req.body.position}' WHERE userid = ${userid} AND projectid = ${projectid}`;
        pool.query(sql, (err, data) =>{
            console.log(sql);
            res.redirect(`/projects/members/${projectid}`);           
            
        });
        
    });

    router.get("/members/:projectid/:userid/delete", (req, res, next) =>{
        console.log(req.params);
        let userid = req.params.userid;
        let projectid = req.params.projectid;
        sql = `DELETE FROM members WHERE userid = ${userid}`;
        console.log(sql);
        
        pool.query(sql, (err, data) =>{
            console.log(sql);
            res.redirect(`/projects/members/${projectid}`);         
            
        });
        
    });



  // ISSUES
  // ISSUES LIST
  router.get("/issues/:projectid",(req, res, next) => {
    res.locals.title = "Project Details | Issues";
    let sql1 = `SELECT * FROM projects WHERE projectid = ${req.params.projectid}`;
    let sql2 = `SELECT * FROM issues WHERE projectid = ${req.params.projectid} ORDER BY issueid DESC`;
    pool.query(sql1, (err, data) => {
      pool.query(sql2, (err, issues) => {
        // console.log(sql2);
        res.render("projects/overview/issues/listIssues", {
          data: data.rows,
          issues: issues.rows,
          moment,
        //   isadmin: req.session.user.isadmin
        });
      });
    });
  });

  //issue list add
  router.get("/issues/:projectid/add", (req, res, next) =>{
    // res.locals.title = "Porject | Add Issues";
    let projectid = req.params.projectid;
    let sql = `SELECT * FROM members JOIN projects ON (members.projectid = ${projectid} AND projects.projectid = ${projectid}) JOIN users ON members.userid = users.userid`;
    console.log(sql);
    
    pool.query(sql, (err, data)=>{
        res.render("projects/overview/issues/addIssues", {
            data: data.rows,
            moment,
            projectid: req.params.projectid,
        });
    })

  });

    return router;
};