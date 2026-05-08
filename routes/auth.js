const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 팀장님이 만든 db.js (pool)

// 1. 회원가입 API
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // [중요] 나중에 users 테이블 만들 때 username, password 컬럼 필수!
        const sql = "INSERT INTO users (username, password, is_guest) VALUES (?, ?, 0)";
        await db.query(sql, [username, password]);
        res.json({ success: true, message: "회원가입 성공!" });
    } catch (err) {
        console.error("회원가입 에러:", err);
        res.status(400).json({ success: false, message: "이미 있는 아이디거나 데이터 오류입니다." });
    }
});

// 2. 로그인 API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
        
        if (rows.length > 0) {
            // [핵심] 로그인 성공 시 세션에 유저 정보 저장!
            req.session.user = {
                id: rows[0].id,
                username: rows[0].username,
                is_guest: rows[0].is_guest
            };
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 틀렸습니다." });
        }
    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
});

// 3. 게스트 로그인 (기존에 팀장님이 하신 것 기반)
router.post('/guest', async (req, res) => {
    try {
        const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;
        const sql = "INSERT INTO users (username, is_guest) VALUES (?, 1)";
        const [result] = await db.query(sql, [guestName]);
        
        req.session.user = {
            id: result.insertId,
            username: guestName,
            is_guest: 1
        };
        res.json({ success: true, username: guestName, id: result.insertId });
    } catch (err) {
        res.status(500).send("게스트 생성 실패");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/'); // 세션 파괴 후 다시 로그인 페이지로
    });
});

module.exports = router;