const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 로그인 확인
function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.'
    });
  }

  next();
}

// 친구 요청 보내기
router.post('/request', checkLogin, async (req, res) => {
  const { friendUsername } = req.body;
  const myId = req.session.user.id;

  try {
    const [users] = await db.query(
      'SELECT id, username FROM users WHERE username = ?',
      [friendUsername]
    );

    // 존재하지 않는 유저
    if (users.length === 0) {
      return res.json({
        success: false,
        message: '존재하지 않는 유저입니다.'
      });
    }

    const friendId = users[0].id;

    // 자기 자신 추가 방지
    if (myId === friendId) {
      return res.json({
        success: false,
        message: '자기 자신은 친구 추가할 수 없습니다.'
      });
    }

    // 이미 친구인지 확인
    const [existing] = await db.query(
      `SELECT * FROM friendships
       WHERE (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)`,
      [myId, friendId, friendId, myId]
    );

    if (existing.length > 0) {
      return res.json({
        success: false,
        message: '이미 친구 요청 중이거나 친구입니다.'
      });
    }

    // 친구 요청 저장
    await db.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
      [myId, friendId, 'pending']
    );

    res.json({
      success: true,
      message: '친구 요청을 보냈습니다.'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: '서버 오류'
    });
  }
});

// 친구 목록
router.get('/list', checkLogin, async (req, res) => {
  const myId = req.session.user.id;

  try {
    const [friends] = await db.query(
      `SELECT u.id, u.username, u.is_online
       FROM friendships f
       JOIN users u
       ON u.id = CASE
         WHEN f.user_id = ? THEN f.friend_id
         ELSE f.user_id
       END
       WHERE (f.user_id = ? OR f.friend_id = ?)
       AND f.status = 'accepted'`,
      [myId, myId, myId]
    );

    res.json(friends);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 받은 친구 요청 목록
router.get('/pending', checkLogin, async (req, res) => {
  const myId = req.session.user.id;

  try {
    const [requests] = await db.query(
      `SELECT f.id AS friendship_id, u.username
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = ?
       AND f.status = 'pending'`,
      [myId]
    );

    res.json(requests);

  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// 친구 요청 수락 / 거절
router.post('/respond', checkLogin, async (req, res) => {
  const { friendshipId, action } = req.body;

  try {

    // 수락
    if (action === 'accepted') {

      await db.query(
        'UPDATE friendships SET status = ? WHERE id = ?',
        ['accepted', friendshipId]
      );

    } else {

      // 거절
      await db.query(
        'DELETE FROM friendships WHERE id = ?',
        [friendshipId]
      );
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false
    });
  }
});

// 친구 삭제 / 비활성화
router.post('/remove', checkLogin, async (req, res) => {
  const myId = req.session.user.id;
  const { friendId } = req.body;

  try {

    await db.query(
      `DELETE FROM friendships
       WHERE (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)`,
      [myId, friendId, friendId, myId]
    );

    res.json({
      success: true,
      message: '친구가 삭제되었습니다.'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false
    });
  }
});

// 개인 친구 페이지
// 개인 친구 페이지
router.get('/profile/:id', checkLogin, async (req, res) => {
    const friendId = req.params.id;

    try {
        const [rows] = await db.query(
            'SELECT id, username, is_guest, is_online, status_message FROM users WHERE id = ?',
            [friendId]
        );

        if (rows.length === 0) {
            return res.send('존재하지 않는 사용자입니다.');
        }

        res.render('friendProfile', {
            friend: rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;