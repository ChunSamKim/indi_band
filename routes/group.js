const express = require('express')
const db = require('../db')
const router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const fs = require('fs');
const JWT_KEY = "abcd";
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // 확장자 유지
    const randomName = crypto.randomBytes(16).toString('hex'); // 32자리 랜덤 문자열
    cb(null, `${randomName}${ext}`);
  }
});

const upload = multer({ storage });

router.get("/info", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "userId가 필요합니다." });
  }

  try {
    // 1. 내 그룹
    const [myGroups] = await db.query(`
      SELECT 
        g.group_no, g.group_name, g.group_comment, g.group_imgpath,
        (SELECT COUNT(*) FROM group_manage gm WHERE gm.group_no = g.group_no) AS member_count
      FROM group_manage gm
      JOIN tbl_group g ON gm.group_no = g.group_no
      WHERE gm.user_id = ?
    `, [userId]);

    // 2. 공개 그룹
    const [publicGroups] = await db.query(`
      SELECT 
        g.group_no, g.group_name, g.group_comment, g.group_imgpath,
        (SELECT COUNT(*) FROM group_manage gm WHERE gm.group_no = g.group_no) AS member_count
      FROM tbl_group g
      WHERE g.group_status = 'PUBLIC'
    `);

    // 3. 각 그룹별 태그 추가
    const enrichWithTags = async (groupList) => {
      for (const group of groupList) {
        const [tags] = await db.query(`
          SELECT t.tag_name
          FROM group_tag gt
          JOIN tbl_tag t ON gt.tag_no = t.tag_no
          WHERE gt.group_no = ?
        `, [group.group_no]);

        group.tagList = tags.map(row => row.tag_name);
      }
    };

    await enrichWithTags(myGroups);
    await enrichWithTags(publicGroups);

    res.json({ myGroups, publicGroups });
  } catch (err) {
    console.error("그룹 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});




router.post('/', upload.single('image'), async (req, res) => {
  const { userId, name, comment, status } = req.body;
  let tagList = [];

  try {
    tagList = JSON.parse(req.body.tagList);
  } catch (err) {
    return res.status(400).json({ message: '해시태그 파싱 오류' });
  }

  const imgPath = req.file ? `uploads/${req.file.filename}` : null;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. 그룹 등록
    const [groupResult] = await conn.query(
      `INSERT INTO tbl_group (maker_id, group_name, group_comment, group_status, group_imgpath, group_cdate)
         VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, name, comment, status, imgPath]
    );

    const groupNo = groupResult.insertId;

    await conn.query(
      "INSERT INTO group_manage (user_id, group_no, group_auth) VALUES (?, ?, 'O')",
      [userId, groupNo]
    );

    // 2. 해시태그 처리
    for (let tag of tagList) {
      const [existing] = await conn.query("SELECT tag_no FROM tbl_tag WHERE tag_name = ?", [tag]);

      let tagNo;
      if (existing.length > 0) {
        tagNo = existing[0].tag_no;
      } else {
        const [tagInsert] = await conn.query("INSERT INTO tbl_tag (tag_name) VALUES (?)", [tag]);
        tagNo = tagInsert.insertId;
      }

      await conn.query("INSERT INTO group_tag (group_no, tag_no) VALUES (?, ?)", [groupNo, tagNo]);
    }

    await conn.commit();
    res.json({ message: '그룹 등록 완료', groupNo });
  } catch (err) {
    await conn.rollback();
    console.error('그룹 등록 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release();
  }
});

router.get('/detail', async (req, res) => {
  const { group_no, user_id } = req.query;

  try {
    const [groupRows] = await db.query(`
  SELECT 
    g.*, 
    u.user_name,
    (SELECT COUNT(*) FROM group_manage gm WHERE gm.group_no = g.group_no) AS member_count
  FROM tbl_group g
  INNER JOIN user u ON g.maker_id = u.user_id
  WHERE g.group_no = ?
`, [group_no]);


    const [authRows] = await db.query("SELECT group_auth FROM group_manage WHERE group_no = ? AND user_id = ?", [group_no, user_id]);
    const [planRows] = await db.query("SELECT * FROM plan WHERE group_no = ?", [group_no]);

    const [tagRows] = await db.query(`
            SELECT t.tag_name
            FROM group_tag gt
            JOIN tbl_tag t ON gt.tag_no = t.tag_no
            WHERE gt.group_no = ?`, [group_no]);
    res.json({
      groupInfo: groupRows[0] || null,
      userAuth: authRows[0]?.group_auth || null,
      planRows: planRows || [],
      tagList: tagRows.length > 0 ? tagRows.map(row => row.tag_name) : []
    });
  } catch (err) {
    console.error("상세조회 오류:", err);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/list', async (req, res) => {
  const { group_no } = req.query;

  if (!group_no) {
    return res.status(400).json({ message: 'group_no 필요' });
  }

  try {
    const [rows] = await db.query(`
        SELECT 
          plan_no, group_no, plan_title, plan_contents, start_date, end_date, plan_cdate
        FROM plan
        WHERE group_no = ?
        ORDER BY start_date ASC
      `, [group_no]);

    res.json({ plans: rows });
  } catch (err) {
    console.error('plan list 조회 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/members', async (req, res) => {
  const { group_no } = req.query;

  if (!group_no) {
    return res.status(400).json({ message: "group_no required" });
  }

  try {
    const [rows] = await db.query(`
        SELECT
          u.user_id,
          u.user_name,
          u.user_imgpath,
          gm.group_auth
        FROM group_manage gm
        JOIN user u ON gm.user_id = u.user_id
        WHERE gm.group_no = ?
      `, [group_no]);

    res.json(rows);
  } catch (err) {
    console.error("그룹원 목록 조회 오류:", err);
    res.status(500).json({ message: "fail" });
  }
});


router.post('/kick', async (req, res) => {
  const { group_no, target_user_id } = req.body;

  try {
    const [result] = await db.query(
      `DELETE FROM group_manage WHERE group_no = ? AND user_id = ?`,
      [group_no, target_user_id]
    );

    if (result.affectedRows > 0) {
      res.json({ message: "success" });
    } else {
      res.json({ message: "fail" });
    }
  } catch (err) {
    console.error("그룹원 추방 오류:", err);
    res.status(500).json({ message: "error" });
  }
});


// 내 초대 검색용 라우트
router.get('/searchUser', async (req, res) => {
  const { keyword, group_no } = req.query;

  try {
    const [users] = await db.query(`
      SELECT 
        u.user_id, 
        u.user_name, 
        u.user_imgpath,
        EXISTS (
          SELECT 1 FROM group_manage gm
          WHERE gm.group_no = ? AND gm.user_id = u.user_id
        ) AS already_member
      FROM user u
      WHERE u.user_name LIKE CONCAT('%', ?, '%')
      LIMIT 20
    `, [group_no, keyword]);

    res.json(users);
  } catch (err) {
    console.error("그룹 초대용 사용자 검색 실패:", err);
    res.status(500).json([]);
  }
});

// 그룹 초대 알림
router.post('/invite', async (req, res) => {
  const { group_no, sender_id, receiver_id  } = req.body;

  try {
    // 안 읽은 초대 알림이 이미 있는지 확인
    const [existing] = await db.query(
      `SELECT 1 FROM notification 
       WHERE noti_type = 'I' AND group_no = ? AND noti_receiver = ? AND noti_isread = 'N'`,
      [group_no, receiver_id ]
    );

    if (existing.length > 0) {
      return res.json({ message: "already_invited" });
    }

    // 그룹명 조회
    const [[group]] = await db.query(
      `SELECT group_name FROM tbl_group WHERE group_no = ?`,
      [group_no]
    );

    const notiTitle = `채팅방 '${group.group_name}'에 초대되었습니다.`;

    await db.query(
      `INSERT INTO notification (noti_type, noti_title, noti_receiver, noti_isread, group_no, user_id, created_at)
       VALUES ('I', ?, ?, 'N', ?, ?, now())`,
      [notiTitle, receiver_id , group_no, sender_id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`noti_${receiver_id }`).emit('newNotification', {
        noti_type: 'I',
        noti_title: notiTitle,
        group_no,
        user_id: sender_id
      });
    }

    res.json({ message: "success" });
  } catch (err) {
    console.error("초대 실패:", err);
    res.status(500).json({ message: "server_error" });
  }
});


router.get('/similar', async (req, res) => {
  const rawTags = req.query.tags;
  if (!rawTags) return res.status(400).send("태그 없음");

  const tagNames = rawTags.split(',');
  const minMatch = Math.ceil(tagNames.length / 2);

  try {
    const placeholders = tagNames.map(() => '?').join(',');
    const sql = `
      SELECT 
        g.*, 
        GROUP_CONCAT(DISTINCT t_all.tag_name) AS tag_list,
        COUNT(DISTINCT t_match.tag_no) AS match_count
      FROM tbl_group g
      JOIN group_tag gt_all ON g.group_no = gt_all.group_no
      JOIN tbl_tag t_all ON gt_all.tag_no = t_all.tag_no

      LEFT JOIN group_tag gt_match ON g.group_no = gt_match.group_no
      LEFT JOIN tbl_tag t_match ON gt_match.tag_no = t_match.tag_no AND t_match.tag_name IN (${placeholders})

      WHERE g.group_status = 'PUBLIC'
      GROUP BY g.group_no
      HAVING match_count >= ?
    `;

    const [rows] = await db.query(sql, [...tagNames, minMatch]);

    const result = rows.map(row => ({
      ...row,
      tagList: row.tag_list ? row.tag_list.split(',') : []
    }));

    res.json(result);
  } catch (err) {
    console.error("유사 그룹 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  try {
    const [rows] = await db.query(
      `SELECT tag_no, tag_name FROM tbl_tag WHERE tag_name LIKE ? LIMIT 10`,
      [`%${query}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error('태그 검색 실패:', err);
    res.status(500).send("서버 오류");
  }
});

// 공개/비공개
router.post("/updateStatus", async (req, res) => {
  const { group_no, group_status } = req.body;

  if (!group_no || !group_status) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  try {
    await db.query(`UPDATE tbl_group SET group_status = ? WHERE group_no = ?`, [group_status, group_no]);
    res.json({ message: "success" });
  } catch (err) {
    console.error("공개 여부 수정 오류:", err);
    res.status(500).json({ message: "fail" });
  }
});

router.post('/change-role', async (req, res) => {
  const { group_no, user_id, group_auth } = req.body;

  try {
    await db.query(`
      UPDATE group_manage 
      SET group_auth = ? 
      WHERE group_no = ? AND user_id = ?
    `, [group_auth, group_no, user_id]);

    res.json({ message: 'success' });
  } catch (err) {
    console.error("권한 변경 오류:", err);
    res.status(500).json({ message: '서버 오류' });
  }
});


// 그룹 프로필 소개문구, 제목 업데이트
router.post('/updateText', async (req, res) => {
  const { group_no, group_name, group_comment } = req.body;

  if (!group_no || !group_name) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  try {
    await db.query(`
      UPDATE tbl_group 
      SET group_name = ?, group_comment = ? 
      WHERE group_no = ?
    `, [group_name, group_comment, group_no]);

    res.json({ message: "success" });
  } catch (err) {
    console.error("그룹명/소개 수정 오류:", err);
    res.status(500).json({ message: "fail" });
  }
});

//그룹 프로필 이미지 업데이트
router.post('/updateImage', upload.single('group_img'), async (req, res) => {
  const { group_no } = req.body;

  if (!group_no || !req.file) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  const imagePath = `uploads/${req.file.filename}`;

  try {
    await db.query(`
      UPDATE tbl_group 
      SET group_imgpath = ?
      WHERE group_no = ?
    `, [imagePath, group_no]);

    res.json({ message: "success", group_imgpath: imagePath });
  } catch (err) {
    console.error("그룹 이미지 변경 오류:", err);
    res.status(500).json({ message: "fail" });
  }
});


module.exports = router;