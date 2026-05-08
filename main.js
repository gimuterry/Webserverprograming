const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

// 뷰 엔진 설정 (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 경로 설정 (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 경로 라우팅
app.get('/', (req, res) => {
    res.render('index'); // views/index.ejs를 보여줌
});

// 기존 코드 아래에 추가
const authRouter = require('./routes/auth');


app.use('/auth', authRouter); // '/auth' 경로로 들어오는 요청 처리

// 기존 authRouter 아래에 추가
const channelRouter = require('./routes/channel');
app.use('/channel', channelRouter);

const voiceRoom = require('./socket/voiceRoom'); 

// 소켓 엔진 실행 (이게 중요!)
voiceRoom(io);

// 서버 가동
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 3조 서버 가동 시작: http://localhost:${PORT}`);
});


