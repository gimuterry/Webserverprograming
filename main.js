const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const session = require('express-session'); // [추가] 세션 패키지

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [추가] 세션 설정: 로그인 상태를 유지하는 '틀'입니다.
app.use(session({
    secret: '3jo-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24시간 유지
}));

// [수정] 기본 경로 라우팅: 로그인 여부에 따라 '대문' 혹은 '로비'를 보여줌
app.get('/', (req, res) => {
    if (req.session.user) {
        res.render('index', { user: req.session.user }); // 로그인 했으면 메인(index)
    } else {
        res.render('login'); // 안 했으면 로그인 페이지(login)
    }
});

// 라우터 연결
const authRouter = require('./routes/auth');
const channelRouter = require('./routes/channel');
const dmRouter = require('./routes/dm');
app.use('/auth', authRouter);
app.use('/channel', channelRouter);
app.use('/dm', dmRouter);

// main.js 기존 라우터 아래에 추가
const friendRouter = require('./routes/friend');
app.use('/friend', friendRouter); // '/friend' 경로로 오는 요청 처리

// 소켓 연결
const voiceRoom = require('./socket/voiceRoom'); 
voiceRoom(io);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 3조 서버 가동 시작: http://localhost:${PORT}`);
});