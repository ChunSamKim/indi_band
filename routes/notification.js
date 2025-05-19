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

//안읽은 알림 수
router.get('/unreadCount', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count FROM notification
       WHERE noti_receiver = ? AND noti_isread = 'N'`,
      [user_id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error('안읽은 알림 가져오기 에러:', err);
    res.status(500).json({ count: 0 });
  }
});

// 그룹 가입 요청 알림
router.post('/join-request', async (req, res) => {
  const { group_no, user_id } = req.body;

  try {
    // 안 읽은 가입 요청이 이미 있는지 확인
    const [existing] = await db.query(
      `SELECT 1 FROM notification 
       WHERE noti_type = 'R' AND group_no = ? AND user_id = ? AND noti_isread = 'N'`,
      [group_no, user_id]
    );

    if (existing.length > 0) {
      return res.json({ message: "already_requested" });
    }

    // 그룹명 조회
    const [[group]] = await db.query(
      `SELECT group_name FROM tbl_group WHERE group_no = ?`,
      [group_no]
    );

    // 해당 그룹의 관리자 조회
    const [owners] = await db.query(
      `SELECT user_id FROM group_manage 
       WHERE group_no = ? AND group_auth = 'O'`,
      [group_no]
    );

    const notiTitle = `${group.group_name} 그룹에 가입 요청이 도착했습니다.`;

    for (const owner of owners) {
      await db.query(
        `INSERT INTO notification (noti_type, noti_title, noti_receiver, noti_isread, group_no, user_id, created_at)
         VALUES ('R', ?, ?, 'N', ?, ?, now())`,
        [notiTitle, owner.user_id, group_no, user_id]
      );

      const io = req.app.get('io');
      if (io) {
        io.to(`noti_${owner.user_id}`).emit('newNotification', {
          noti_type: 'R',
          noti_title: notiTitle,
          group_no,
          user_id
        });
      }
    }

    res.json({ message: "success" });
  } catch (err) {
    console.error("가입 요청 중 에러:", err);
    res.status(500).json({ message: "server_error" });
  }
});



// 알림목록 가져오기
router.get('/unreadList', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM notification 
      WHERE noti_receiver = ? AND noti_isread = 'N'
      ORDER BY created_at DESC
    `, [user_id]);

    res.json(rows);
  } catch (err) {
    console.error("알림 목록 가져오기 에러:", err);
    res.status(500).json({ message: "error" });
  }
});

//읽음처리
router.post('/markRead', async (req, res) => {
  const { noti_no } = req.body;
  try {
    await db.query(`
      UPDATE notification SET noti_isread = 'Y'
      WHERE noti_no = ?
    `, [noti_no]);

    res.json({ message: "success" });
  } catch (err) {
    console.error("알림 읽기 에러:", err);
    res.status(500).json({ message: "error" });
  }
});

// 그룹 초대 수락 
router.post('/accept-invite', async (req, res) => {
  const { group_no, user_id, noti_no } = req.body;
  try {
    await db.query(`
      INSERT INTO group_manage (group_no, user_id, group_auth)
      VALUES (?, ?, 'N')
    `, [group_no, user_id]);

    await db.query(`UPDATE notification SET noti_isread = 'Y' WHERE noti_no = ?`, [noti_no]);
    res.json({ message: 'accepted' });
  } catch (err) {
    console.error('초대 수락 중 에러:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// 그룹 초대 거절 
router.post('/reject-invite', async (req, res) => {
  const { noti_no } = req.body;
  try {
    await db.query(`UPDATE notification SET noti_isread = 'Y' WHERE noti_no = ?`, [noti_no]);
    res.json({ message: 'rejected' });
  } catch (err) {
    console.error('초대 거절 중 에러:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// 그룹 가입 요청 수락 
router.post('/accept-request', async (req, res) => {
  const { group_no, user_id, noti_no } = req.body;
  try {
    await db.query(`
      INSERT INTO group_manage (group_no, user_id, group_auth)
      VALUES (?, ?, 'N')
    `, [group_no, user_id]);

    await db.query(`UPDATE notification SET noti_isread = 'Y' WHERE noti_no = ?`, [noti_no]);
    res.json({ message: 'request_accepted' });
  } catch (err) {
    console.error('가입 수락 중 에러:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// 그룹 가입 요청 거절 
router.post('/reject-request', async (req, res) => {
  const { noti_no } = req.body;
  try {
    await db.query(`UPDATE notification SET noti_isread = 'Y' WHERE noti_no = ?`, [noti_no]);
    res.json({ message: 'request_rejected' });
  } catch (err) {
    console.error('가입 요청 중 에러:', err);
    res.status(500).json({ message: 'fail' });
  }
});

module.exports = router;