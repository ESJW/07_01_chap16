const setup = require("./db_setup");
const express = require("express");

const app = express();

app.use(express.static("public")); //static 미들웨어 설정

const session = require("express-session");
app.use(
    session({
        secret: "암호화키",
        resave: false,
        saveUninitialized: false,
    })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.use('/', require('./routes/account.js'));
app.use('/', require('./routes/post'));

app.listen(process.env.WEB_PORT, async () => {
    await setup();
    console.log("8080 서버가 준비되었습니다...");
});

