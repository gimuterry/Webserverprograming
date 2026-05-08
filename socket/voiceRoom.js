// socket/voiceRoom.js
module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('join-room', (roomId, userId) => {
         socket.join(roomId); // 1. 먼저 방에 집어넣고
    
    // 2. '그 방(roomId)'에 있는 사람들에게만 "누구 왔다"고 알림
    // socket.to(roomId)를 써야 다른 방에 신호가 안 넘어갑니다!
          socket.to(roomId).emit('user-connected', userId); 
        });

        // 💬 실시간 메시지 처리 추가
        socket.on('send-message', (roomId, data) => {
            // data에는 { sender: '닉네임', message: '내용' }이 담깁니다.
            // 같은 방에 있는 모든 사람(나 포함)에게 메시지 전달
            io.to(roomId).emit('receive-message', data);
        });

        socket.on('disconnect', () => {
            console.log('❌ 유저 접속 끊김');
        });
        
        // socket/voiceRoom.js
        socket.on('join-room', (roomId, userId) => {
            socket.join(roomId);
            console.log(`📡 [입장] 방 ${roomId} : 유저 ${userId}`);
            socket.to(roomId).emit('user-connected', userId);
        });

        // [추가] 방 나가기 로직
        socket.on('leave-room', (roomId, userId) => {
            socket.leave(roomId);
            console.log(`🏃 [퇴장] 방 ${roomId} : 유저 ${userId}`);
            // 방 사람들에게 이 유저가 나갔음을 알림 (필요시 끊기 위해)
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
};