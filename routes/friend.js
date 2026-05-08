const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 팀장님의 db.js

// 1. 친구 요청 보내기
router.post('/request', async (req, res) => {
    const { friendUsername } = req.body;
    const myId = req.session.user.id;

    try {
        // 상대방 유저가 존재하는지 확인
        const [users] = await db.query("SELECT id FROM users WHERE username = ?", [friendUsername]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "존재하지 않는 유저입니다." });
        }

        const friendId = users[0].id;

        if (myId === friendId) {
            return res.status(400).json({ success: false, message: "본인에게는 요청할 수 없습니다." });
        }

        // 이미 친구이거나 요청 중인지 확인
        const [existing] = await db.query(
            "SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
            [myId, friendId, friendId, myId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "이미 친구이거나 요청 대기 중입니다." });
        }

        // 친구 요청 삽입
        await db.query("INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending')", [myId, friendId]);
        res.json({ success: true, message: "친구 요청을 보냈습니다!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
});

// 2. 내 친구 목록 가져오기 (수락된 친구만)
router.get('/list', async (req, res) => {
    const myId = req.session.user.id;
    try {
        // 내가 보냈거나 받았을 때, 상대방의 이름을 가져오는 쿼리
        const sql = `
            SELECT u.id, u.username FROM users u
            JOIN friendships f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
            WHERE f.status = 'accepted' AND u.id != ?
        `;
        const [friends] = await db.query(sql, [myId, myId, myId]);
        res.json(friends);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 3. 나한테 온 '대기 중'인 요청 목록 가져오기
router.get('/pending', async (req, res) => {
    const myId = req.session.user.id;
    try {
        const sql = `
            SELECT f.id AS friendship_id, u.username 
            FROM friendships f 
            JOIN users u ON f.user_id = u.id 
            WHERE f.friend_id = ? AND f.status = 'pending'
        `;
        const [requests] = await db.query(sql, [myId]);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 4. 친구 요청 수락 또는 거절하기
router.post('/respond', async (req, res) => {
    const { friendshipId, action } = req.body; // action: 'accepted' 또는 'rejected'
    try {
        if (action === 'accepted') {
            await db.query("UPDATE friendships SET status = 'accepted' WHERE id = ?", [friendshipId]);
        } else {
            await db.query("DELETE FROM friendships WHERE id = ?", [friendshipId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;