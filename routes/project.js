var express = require('express');
var router = express.Router();
const path = require('path');

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
        
        // if (params.length > 0) {
        //     sql += `WHERE ${params.join(' AND ')}`
        // }

        pool.query(sql, (err, response) => {
            if (err) return res.send(err);
            const pages = Math.ceil(response.rows[0].total / limit);
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

    router.get("/edit/:id", (req, res) =>{

    });


    return router;
};