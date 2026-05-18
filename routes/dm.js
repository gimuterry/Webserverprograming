const express = require('express');
const router = express.Router();
const db = require('../config/db');

function checkLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
}

// DM 페이지
router.get('/:friendId', checkLogin, async (req, res) => {
    const friendId = req.params.friendId;

    const [rows] = await db.query(
        'SELECT id, username, is_online FROM users WHERE id = ?',
        [friendId]
    );

    if (rows.length === 0) {
        return res.send('존재하지 않는 사용자입니다.');
    }

    res.render('dm', {
        friend: rows[0],
        me: req.session.user
    });
});

// 메시지 목록 불러오기
router.get('/:friendId/messages', checkLogin, async (req, res) => {
    const myId = req.session.user.id;
    const friendId = req.params.friendId;

    const [messages] = await db.query(
        `SELECT dm.*, u.username AS sender_name
         FROM direct_messages dm
         JOIN users u ON dm.sender_id = u.id
         WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
            OR (dm.sender_id = ? AND dm.receiver_id = ?)
         ORDER BY dm.created_at ASC`,
        [myId, friendId, friendId, myId]
    );

    res.json(messages);
});

// 메시지 보내기
router.post('/:friendId/send', checkLogin, async (req, res) => {
    const myId = req.session.user.id;
    const friendId = req.params.friendId;
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.json({
            success: false,
            message: '메시지를 입력하세요.'
        });
    }

    await db.query(
        'INSERT INTO direct_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
        [myId, friendId, message]
    );

    res.json({
        success: true
    });
});

module.exports = router;