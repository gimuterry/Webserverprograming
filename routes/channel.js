const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 채널 생성 API (R_09)
router.post('/create', async (req, res) => {
    const { channelName, ownerId } = req.body;
    try {
        await db.query('INSERT INTO channels (channel_name, owner_id) VALUES (?, ?)', [channelName, ownerId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 채널 목록 가져오기 API
router.get('/list', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM channels');
        res.json(rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

module.exports = router;