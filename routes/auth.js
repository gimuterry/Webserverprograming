const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 팀장님이 만든 db.js (pool)

// 1. 회원가입 API
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const sql = `
            INSERT INTO users (username, password, is_guest, is_online)
            VALUES (?, ?, 0, 0)
        `;

        await db.query(sql, [username, password]);

        res.json({
            success: true,
            message: "회원가입 성공!"
        });
    } catch (err) {
        console.error("회원가입 에러:", err);
        res.status(400).json({
            success: false,
            message: "이미 있는 아이디거나 데이터 오류입니다."
        });
    }
});

// 2. 로그인 API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            [username, password]
        );

        if (rows.length > 0) {
            // 로그인 성공 시 세션에 유저 정보 저장
            req.session.user = {
                id: rows[0].id,
                username: rows[0].username,
                is_guest: rows[0].is_guest
            };

            // 로그인하면 온라인 상태로 변경
            await db.query(
                "UPDATE users SET is_online = 1 WHERE id = ?",
                [rows[0].id]
            );

            res.json({ success: true });
        } else {
            res.status(401).json({
                success: false,
                message: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }
    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({
            success: false,
            message: "서버 오류"
        });
    }
});

// 3. 게스트 로그인
router.post('/guest', async (req, res) => {
    try {
        const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;

        const sql = `
            INSERT INTO users (username, is_guest, is_online)
            VALUES (?, 1, 1)
        `;

        const [result] = await db.query(sql, [guestName]);

        req.session.user = {
            id: result.insertId,
            username: guestName,
            is_guest: 1
        };

        res.json({
            success: true,
            username: guestName,
            id: result.insertId
        });
    } catch (err) {
        console.error("게스트 생성 에러:", err);
        res.status(500).send("게스트 생성 실패");
    }
});

// 4. 로그아웃
router.get('/logout', async (req, res) => {
    try {
        const userId = req.session.user?.id;

        // 로그아웃하면 오프라인 상태로 변경
        if (userId) {
            await db.query(
                "UPDATE users SET is_online = 0 WHERE id = ?",
                [userId]
            );
        }

        req.session.destroy(() => {
            res.redirect('/');
        });
    } catch (err) {
        console.error("로그아웃 에러:", err);
        res.redirect('/');
    }
});

router.post('/status-message', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }

    const userId = req.session.user.id;
    const { statusMessage } = req.body;

    try {
        await db.query(
            'UPDATE users SET status_message = ? WHERE id = ?',
            [statusMessage, userId]
        );

        res.json({
            success: true,
            message: '상태메시지가 수정되었습니다.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: '서버 오류'
        });
    }
});

module.exports = router;