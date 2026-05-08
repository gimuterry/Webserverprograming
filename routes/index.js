// routes/index.js
router.get('/', (req, res) => {
    if (req.session.user) {
        res.render('index', { user: req.session.user }); // 로그인됨 -> 메인 로비로
    } else {
        res.render('login'); // 로그인 안됨 -> 로그인 페이지로
    }
});