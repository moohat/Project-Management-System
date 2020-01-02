var express = require('express');
var router = express.Router();
const path = require('path');

const helpers = require("../helpers/util")


module.exports = function (pool) {

    router.get("/", (req, res, next) =>{
        sql = 'SELECT * FROM projects';
        pool.query(sql, (err, response) =>{
            if(err) return res.send(err);
            res.render('projects/listProject',{
                data: response.rows,
                query: req.query,

            })
        });
    });
    /* GET home page. */
    // router.get('/', (req, res, next) => {     
    //     let result = [];
    //     let filterData = false;

    //     if (req.query.check_id && req.query.id) {
    //         result.push(`projects.projectid = ${req.query.id}`);
    //         filterData = true;
    //     }
    //     if (req.query.check_name && req.query.name) {
    //         result.push(`projects.name ILIKE '%${req.query.name.toLowerCase()}%`);
    //         filterData = true;
    //     }
    //     if (req.query.check_member && req.query.member) {
    //         result.push(`members.userid = '${req.query.member}'`);
    //         filterData = true;
    //         console.log(req.query);
    //     }

    //     let sql = `SELECT COUNT(*) AS total FROM projects `;
    //     if (filterData) {
    //         sql += ` WHERE ${result.join(' AND ')}`
    //     }
    // //     // sql += `) AS projectmember`;

    // //     //todo: PAGINATION
    //     pool.query(sql, (err, count) => {
    //         const page = req.query.page || 1;
    //         const limit = 3;
    //         const offset = (page - 1) * limit;
    //         const url = req.url == '/' ? '/?page=1' : req.url;

    //         // console.log('page: ==>' + req.query.page);           
    //         const total = count.rows[0].total;
    //         const pages = Math.ceil(total / limit);

    //         let sql = `SELECT FROM projects`;
    //         if (filterData) {
    //             sql += ` WHERE ${result.join(' AND ')}`
    //         }
    //         sql += ` ORDER BY projectid LIMIT ${limit} OFFSET ${offset}`;

    //         pool.query(sql, (err, row) => {
    //             res.render('projects/listProject', {
    //                 data: row.rows,
    //                 page,
    //                 pages,
    //                 query: req.query,
    //                 url,
    //                 user: req.session.user
    //             });
    //         });
    //     });
    // });

   
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

    /* GET PROJECT PAGE. */
    // router.get('/add', (req, res, next) => {
    //     let sql = `SELECT userid, firstname || ' ' || lastname AS fullname FROM users`;
    //     pool.query(sql, (err, result) => {
    //         let sqladmin = `SELECT isadmin FROM users WHERE userid = ${req.session.user.userid}`;
    //         pool.query(sqladmin, (err, admin) => {
    //             admin = admin.rows;
    //             let isadmin = admin[0].isadmin;
    //             if (err) {
    //                 return res.send(err)
    //             };
    //             res.render('projects/addProject', {
    //                 title: 'Add Project',
    //                 path: 'projects',
    //                 isadmin,
    //                 users: result.rows,
    //                 user: req.session.user
    //             });
    //         });
    //     });
    // });

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

   
    router.post('/add',  (req, res, next) => {
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


    return router;
};