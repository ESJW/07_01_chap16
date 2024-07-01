const router = require('express').Router();
const setup = require('../db_setup');

const sha = require('sha256');

// 회원가입 화면 보기
router.get('/account/enter', (req, res) => {
    res.render('enter.ejs');
});

// 회원가입 처리
router.post("/account/save", async (req, res) => {
    const { mongodb, mysqldb } = await setup();
    mongodb.collection('account')
        .findOne({userid: req.body.userid})
        .then(result => {
            if(result){// 중복 상태
                res.render('enter.ejs', {data: {msg: 'ID가 중복되었습니다.'}});
            } else {
                const generateSalt = (length = 16) => {
                    const crypto = require('crypto');
                    return crypto.randomBytes(length).toString('hex');  // 버퍼를 16진수의 string으로 바꿔 반환
                };

                const salt = generateSalt();
                console.log(req.body);
                req.body.userpw = sha(req.body.userpw + salt);
                mongodb.collection('account')
                    .insertOne(req.body)
                    .then( result => {
                        if(result){
                            console.log('회원가입 성공');
                            const sql = `insert into usersalt(userid, salt) values (?, ?)`
                            mysqldb.query(sql, [req.body.userid, salt], (err, rows, fields)=>{
                                if (err){
                                    console.log(err);
                                } else {
                                    console.log('salt 저장 성공');
                                }
                            });
                            res.redirect('/');
                        } else{
                            console.log('회원가입 fail');
                            res.render('enter.ejs', {data: {alertMsg: '회원가입 실패'}});    // 페이지 그대로 머무는것 처럼 보이게
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).send(); 
                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(); 
        });
});


// 로그인 처리
router.post('/account/login', async (req, res) => {
    console.log(req.body);
    // db연결
    const { mongodb, mysqldb } = await setup();
    mongodb.collection('account')
        .findOne({ userid: req.body.userid })
        .then(result => {
            if (result) {
                const sql = `SELECT salt FROM usersalt 
                            WHERE userid=?`
                mysqldb.query(sql, [req.body.userid], (err, rows, fields) => {
                    console.log(rows);
                    const salt = rows[0].salt;
                    const hashPw = sha(req.body.userpw + salt);
                    if(result.userpw == hashPw){
                        // login ok
                        req.body.userpw = hashPw;
                        req.session.user = req.body;
                        res.cookie('uid', req.body.userid);
                        res.render('index.ejs');
                    } else {
                        // pw fail
                        res.render('login.ejs', {data: {alertMsg: '다시 로그인 해주세요'}});
                    }
                });
            } else {
                // login fail
                res.render("index.ejs", {data:{alertMsg:'다시 로그인 해주세요'}});
            }
        })
        .catch(err => {
            // login fail
            res.render("index.ejs", {data:{alertMsg:'다시 로그인 해주세요'}});
        });
    
});

// herf는 다 get방식으로 넘어옴
router.get('/account/logout', (req, res) => {
    req.session.destroy();
    res.render('index.ejs');
});

module.exports = router;