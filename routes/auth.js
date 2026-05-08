const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 아까 만든 DB 설정 불러오기

// 게스트 로그인 (R_03, R_17)
router.post('/guest', async (req, res) => {
    const guestName = `Guest_${Math.floor(Math.random() * 1000)}`;
    try {
        // DB에 게스트 정보 저장 (is_guest를 true로 설정)
        const [result] = await db.query(
            'INSERT INTO users (username, is_guest) VALUES (?, ?)', 
            [guestName, true]
        );
        // 클라이언트에 생성된 정보 전달
        res.json({ id: result.insertId, username: guestName });
    } catch (err) {
        console.error(err);
        res.status(500).send('DB 접속 에러');
    }
});

module.exports = router;