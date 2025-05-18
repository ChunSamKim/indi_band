const express = require('express')
const db = require('../db')
const router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const JWT_KEY = "abcd";
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage });

// 새 채팅방 생성
router.post("/createRoom", async (req, res) => {
  const { title, user_id } = req.body;
  const defaultProfileImg = "uploads/default_background.png";

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 채팅방 생성
    const [roomResult] = await conn.query(`
        INSERT INTO chat_room (title, profile_img, created_at)
        VALUES (?, ?, NOW())
      `, [title, defaultProfileImg]);
    const chat_no = roomResult.insertId;

    // 2. 채팅방 생성자를 chat_member에 등록
    await conn.query(`
        INSERT INTO chat_member (chat_no, user_id, joined_at)
        VALUES (?, ?, NOW())
      `, [chat_no, user_id]);

    await conn.commit();
    res.json({ message: "success", chat_no });
  } catch (err) {
    await conn.rollback();
    console.error("채팅방 생성 오류:", err);
    res.status(500).json({ message: "fail" });
  } finally {
    conn.release();
  }
});

// 내 채팅방 목록 가져오기
router.get('/myRooms', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.query(`
        SELECT 
        cr.chat_no,
        cr.title,
        cr.profile_img,
        (
          SELECT content 
          FROM chat_message 
          WHERE chat_no = cr.chat_no 
          ORDER BY sent_at DESC 
          LIMIT 1
        ) AS last_message,
        (
          SELECT COUNT(*) 
          FROM chat_message m
          LEFT JOIN chat_member cm2 ON m.chat_no = cm2.chat_no AND cm2.user_id = ?
          WHERE m.chat_no = cr.chat_no
            AND m.sent_at > COALESCE(cm2.last_read, '1900-01-01')
        ) AS unread_count
      FROM chat_room cr
      JOIN chat_member cm ON cr.chat_no = cm.chat_no
      WHERE cm.user_id = ?


      `, [user_id, user_id]);

    res.json(rows);
  } catch (err) {
    console.error('채팅방 목록 조회 실패:', err);
    res.status(500).json({ message: 'fail' });
  }
});

//채팅방 선택 시 정보 가져오기
router.get('/messages', async (req, res) => {
  const { chat_no } = req.query;
  try {
    const [rows] = await db.query(
      ` SELECT m.*, u.user_name
      FROM chat_message m
      JOIN user u ON m.user_id = u.user_id
      WHERE m.chat_no = ?
      ORDER BY m.sent_at ASC`,
      [chat_no]
    );
    res.json(rows);
  } catch (err) {
    console.error('메시지 조회 실패:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// lastread 업데이트
router.post('/updateLastRead', async (req, res) => {
  const { chat_no, user_id } = req.body;
  try {
    await db.query(
      `UPDATE chat_member SET last_read = NOW() WHERE chat_no = ? AND user_id = ?`,
      [chat_no, user_id]
    );
    res.json({ message: 'success' });
  } catch (err) {
    console.error('last_read 업데이트 실패:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// 사용자 이름으로 검색 (LIKE)
router.get("/searchUser", async (req, res) => {
  const keyword = req.query.keyword;

  try {
    const [rows] = await db.query(`
      SELECT *
      FROM user
      WHERE user_name LIKE ?
      LIMIT 10
    `, [`%${keyword}%`]);

    res.json(rows);
  } catch (err) {
    console.error("유저 검색 실패:", err);
    res.status(500).json({ message: "fail" });
  }
});


// 사용자 검색 (이미 속한 사람 표시)
router.get('/searchUser', async (req, res) => {
  const { keyword, chat_no } = req.query;

  try {
    const [users] = await db.query(`
      SELECT u.user_id, u.user_name, u.profile_img,
        EXISTS (
          SELECT 1 FROM chat_member cm
          WHERE cm.chat_no = ? AND cm.user_id = u.user_id
        ) AS already_member
      FROM user u
      WHERE u.user_name LIKE CONCAT('%', ?, '%')
      LIMIT 20
    `, [chat_no, keyword]);

    res.json(users);
  } catch (err) {
    console.error("검색 오류:", err);
    res.status(500).json([]);
  }
});

// 채팅방에 사용자 초대
router.post('/invite', async (req, res) => {
  const { chat_no, user_id } = req.body;
  const io = req.app.get("io"); // socket.io 인스턴스 가져오기

  try {
    const [exist] = await db.query(
      "SELECT * FROM chat_member WHERE chat_no = ? AND user_id = ?",
      [chat_no, user_id]
    );

    if (exist.length > 0) {
      return res.json({ message: "already" });
    }

    // 1. 채팅방 멤버 추가
    await db.query(
      "INSERT INTO chat_member (chat_no, user_id, last_read) VALUES (?, ?, NOW())",
      [chat_no, user_id]
    );

    // 2. 채팅방 이름 조회
    const [[chatRoom]] = await db.query(
      `SELECT title FROM chat_room WHERE chat_no = ?`,
      [chat_no]
    );
    const notiTitle = `채팅방 '${chatRoom.title}'에 초대되었습니다.`;

    // 3. 알림 저장 (type C = chat 초대)
    const [result] = await db.query(
      `INSERT INTO notification (noti_type, noti_title, noti_receiver, noti_isread, chat_no, created_at)
       VALUES ('C', ?, ?, 'N', ?, now())`,
      [notiTitle, user_id, chat_no]
    );

    // 4. 실시간 알림 전송
    io?.to(`noti_${user_id}`).emit("pushNotification", {
      type: 'C',
      title: "채팅방 초대",
      body: notiTitle,
      chat_no,
      noti_no: result.insertId
    });

    res.json({ message: "success" });
  } catch (err) {
    console.error("초대 에러:", err);
    res.json({ message: "fail" });
  }
});


// 채팅방 나가기
router.post('/leaveRoom', async (req, res) => {
  const { chat_no, user_id } = req.body;

  try {
    // chat_member 테이블에서 삭제
    const [result] = await db.query(
      `DELETE FROM chat_member WHERE chat_no = ? AND user_id = ?`,
      [chat_no, user_id]
    );

    // 삭제된 행이 없다면 이미 나간 상태로 판단
    if (result.affectedRows === 0) {
      return res.json({ message: "already_left" });
    }

    res.json({ message: "success" });
  } catch (err) {
    console.error("채팅방 나가기 실패:", err);
    res.status(500).json({ message: "fail" });
  }
});


//module.exprots는 객체든 함수든 변수든 다 내보낼 수 있음. 지금은 router객체를 내보냄
module.exports = router;