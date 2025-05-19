const express = require('express');
const userRouter = require('./routes/user.js');
const groupRouter = require('./routes/group.js');
const feedRouter = require('./routes/feed.js');
const planRouter = require('./routes/plan.js');
const chatRouter = require('./routes/chat.js');
const notificationRouter = require('./routes/notification.js');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const app = express(); 
const http = require('http');
const server = http.createServer(app); // app 기반 http 서버 생성

// Socket.IO 서버 구성
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: true
  }
});

//라우터에서 io 사용 가능하게 함
app.set('io', io); 

io.on('connection', (socket) => {
  console.log('Socket 연결됨:', socket.id);

  // 공용 알림 채널 접속 (클라이언트에서 유저 ID 넘김)
  socket.on('registerNotificationChannel', (userId) => {
    socket.join(`noti_${userId}`);
    console.log(`사용자 ${userId} → 알림 채널 입장`);
  });

  // 그룹 채팅 입장
  socket.on('joinGroupChat', (groupNo) => {
    socket.join(`group_${groupNo}`);
    console.log(`사용자 ${socket.id} → 그룹 ${groupNo} 입장`);
  });

  // 메시지 수신/그룹 전파
  socket.on('groupMessage', async (data) => {
    const { groupNo, senderId, message, sentAt } = data;

    try {
      // 메시지 저장
      const [result] = await db.query(
        `INSERT INTO chat_message (chat_no, user_id, content, sent_at)
       VALUES (?, ?, ?, NOW())`,
        [groupNo, senderId, message]
      );

      // 사용자 이름 조회
      const [[user]] = await db.query(
        `SELECT user_name FROM user WHERE user_id = ?`,
        [senderId]
      );

      const senderName = user?.user_name || senderId;

      // 메시지 전송
      const payload = {
        groupNo,
        senderId,
        user_name: senderName,
        message,
        sentAt,
        message_no: result.insertId
      };

      // 그룹 채팅방에 전송
      io.to(`group_${groupNo}`).emit('groupMessage', payload);

      //  알림 대상자 조회 
      const [members] = await db.query(
        `SELECT user_id FROM chat_member WHERE chat_no = ? AND user_id != ?`,
        [groupNo, senderId]
      );

      
    } catch (err) {
      console.error('채팅 메시지 저장 또는 전송 실패:', err);
    }
  });


  socket.on('disconnect', () => {
    console.log('Socket 연결 해제:', socket.id);
  });
});



// 미들웨어 등록
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}));

app.use(session({
  secret: 'test1234',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 30
  }
}));

// 정적 파일
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 연결
app.use("/user", userRouter);
app.use("/group", groupRouter);
app.use("/feed", feedRouter);
app.use("/plan", planRouter);
app.use("/chat", chatRouter);
app.use("/notification", notificationRouter);



// 서버 실행
server.listen(3000, () => {
  console.log("서버 실행 중! 포트: 3000");
});
