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
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.get('/list', async (req, res) => {
  const { group_no, user_id, offset = 0, limit = 10, only_mine } = req.query;

  try {
    let sql = `
      SELECT 
        f.feed_no,
        f.feed_title,
        f.feed_contents,
        f.feed_status,
        f.feed_cdate,
        f.group_no,
        f.maker_id,
        u.user_name,
        u.user_imgpath,
        (SELECT COUNT(*) FROM feed_like fl WHERE fl.feed_no = f.feed_no) AS like_count,
        (SELECT COUNT(*) FROM comment c WHERE c.feed_no = f.feed_no) AS comment_count,
        (SELECT COUNT(*) FROM feed_like fl WHERE fl.feed_no = f.feed_no AND fl.user_id = ?) AS liked,
        COALESCE(GROUP_CONCAT(fi.image_path ORDER BY fi.image_order), '') AS image_paths
      FROM feed f
      LEFT JOIN feed_image fi ON f.feed_no = fi.feed_no
      JOIN user u ON f.maker_id = u.user_id
      WHERE f.feed_status = 'PUBLIC'
    `;

    const params = [user_id];

    if (group_no) {
      sql += ` AND f.group_no = ?`;
      params.push(group_no);
    }

    if (only_mine === 'true') {
      sql += ` AND f.maker_id = ?`;
      params.push(user_id);
    }

    sql += `
      GROUP BY 
        f.feed_no, f.feed_title, f.feed_contents, f.feed_status, f.feed_cdate,
        f.group_no, f.maker_id, u.user_name, u.user_imgpath
      ORDER BY f.feed_cdate DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(sql, params);

    const result = rows.map(row => ({
      ...row,
      liked: !!row.liked,
      image_paths: row.image_paths ? row.image_paths.split(',') : []
    }));
    res.json(result);
  } catch (err) {
    console.error('피드 불러오기 오류:', err);
    res.status(500).send('Server error');
  }
});






// 좋아요 추가
router.post('/like', async (req, res) => {
  const { user_id, feed_no } = req.body;
  try {
    const [exists] = await db.query(
      'SELECT * FROM feed_like WHERE user_id = ? AND feed_no = ?',
      [user_id, feed_no]
    );

    if (exists.length === 0) {
      await db.query(
        'INSERT INTO feed_like (user_id, feed_no, like_date) VALUES (?, ?, NOW())',
        [user_id, feed_no]
      );
      return res.json({ result: 'liked' });
    } else {
      return res.json({ result: 'already liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error in liking feed');
  }
});

// 좋아요 취소
router.post('/unlike', async (req, res) => {
  const { user_id, feed_no } = req.body;
  try {
    await db.query(
      'DELETE FROM feed_like WHERE user_id = ? AND feed_no = ?',
      [user_id, feed_no]
    );
    res.json({ result: 'unliked' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error in unliking feed');
  }
});

// 특정 피드에 좋아요 했는지 확인
router.get('/liked', async (req, res) => {
  const { user_id, feed_no } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM feed_like WHERE user_id = ? AND feed_no = ?',
      [user_id, feed_no]
    );
    res.json({ liked: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error checking liked state');
  }
});

router.post('/add', upload.array('images'), async (req, res) => {
  const { group_no, maker_id, feed_title, feed_contents } = req.body;
  const files = req.files;

  const conn = await db.getConnection(); // 트랜잭션용

  try {
    await conn.beginTransaction();

    // 1. feed 등록
    const [result] = await conn.query(
      `INSERT INTO feed (group_no, maker_id, feed_title, feed_contents, feed_cdate, feed_status)
         VALUES (?, ?, ?, ?, NOW(), 'PUBLIC')`,
      [group_no, maker_id, feed_title, feed_contents]
    );

    const feed_no = result.insertId;

    // 2. feed_image 등록
    for (let i = 0; i < files.length; i++) {
      const path = files[i].path.replace(/\\/g, '/'); // 윈도우 경로 대응
      await conn.query(
        `INSERT INTO feed_image (feed_no, image_path, image_order)
           VALUES (?, ?, ?)`,
        [feed_no, path, i + 1]
      );
    }

    await conn.commit();
    res.json({ message: 'success' });
  } catch (err) {
    await conn.rollback();
    console.error('피드 등록 실패:', err);
    res.status(500).json({ message: 'fail' });
  } finally {
    conn.release();
  }
});


// 기존 댓글 등록 + 대댓글 지원
router.post('/comment', async (req, res) => {
  const { feed_no, user_id, comment_contents, parent_comment_no = null } = req.body;

  if (!feed_no || !user_id || !comment_contents) {
    return res.status(400).json({ message: '모든 값 필요' });
  }

  try {
    const sql = `
        INSERT INTO comment (feed_no, maker_no, comment_contents, comment_cdate, parent_comment_no)
        VALUES (?, ?, ?, NOW(), ?)
      `;
    await db.query(sql, [feed_no, user_id, comment_contents, parent_comment_no]);
    res.json({ message: '댓글 등록 완료' });
  } catch (err) {
    console.error('댓글 등록 오류:', err);
    res.status(500).send('Server error');
  }
});

// 댓글 + 대댓글 불러오기 + 좋아요 수 포함
router.get('/comments', async (req, res) => {
  const { feed_no, user_id } = req.query;
  if (!feed_no) return res.status(400).json({ message: 'feed_no 필요' });

  try {
    const sql = `
        SELECT 
          c.comment_no,
          c.feed_no,
          c.comment_contents,
          c.comment_cdate,
          c.parent_comment_no,
          u.user_id,
          u.user_name as writer_name,
          u.user_imgpath,
          (SELECT COUNT(*) FROM comment_like cl WHERE cl.comment_no = c.comment_no) AS like_count,
          EXISTS (
            SELECT 1 FROM comment_like cl WHERE cl.comment_no = c.comment_no AND cl.user_id = ?
          ) AS liked
        FROM comment c
        JOIN user u ON c.maker_no = u.user_id
        WHERE c.feed_no = ?
        ORDER BY c.comment_cdate ASC
      `;
    const [rows] = await db.query(sql, [user_id, feed_no]);
    res.json(rows);
  } catch (err) {
    console.error('댓글 불러오기 오류:', err);
    res.status(500).send('Server error');
  }
});

// 댓글 좋아요 토글
router.post('/comment/like', async (req, res) => {
  const { comment_no, user_id } = req.body;
  if (!comment_no || !user_id) return res.status(400).json({ message: '값 부족' });

  try {
    const [exists] = await db.query(
      'SELECT * FROM comment_like WHERE comment_no = ? AND user_id = ?',
      [comment_no, user_id]
    );

    if (exists.length > 0) {
      await db.query(
        'DELETE FROM comment_like WHERE comment_no = ? AND user_id = ?',
        [comment_no, user_id]
      );
      res.json({ result: 'unliked' });
    } else {
      await db.query(
        'INSERT INTO comment_like (comment_no, user_id, liked_at) VALUES (?, ?, NOW())',
        [comment_no, user_id]
      );
      res.json({ result: 'liked' });
    }
  } catch (err) {
    console.error('댓글 좋아요 오류:', err);
    res.status(500).send('Server error');
  }
});

router.post('/edit', upload.array('new_images'), async (req, res) => {
  const { feed_no, feed_title, feed_contents } = req.body;
  const removedPathsRaw = req.body['removed_image_paths'];

  // 삭제 경로 배열화
  const removedPaths = removedPathsRaw
    ? Array.isArray(removedPathsRaw)
      ? removedPathsRaw
      : [removedPathsRaw]
    : [];

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. feed 테이블 수정
    await conn.query(
      `
        UPDATE feed
        SET feed_title = ?, feed_contents = ?, feed_udate = NOW()
        WHERE feed_no = ?
      `,
      [feed_title, feed_contents, feed_no]
    );

    // 2. 삭제할 이미지 경로가 있을 경우 삭제
    if (removedPaths.length > 0) {
      const placeholders = removedPaths.map(() => '?').join(',');
      await conn.query(
        `DELETE FROM feed_image WHERE image_path IN (${placeholders})`,
        removedPaths
      );
    }

    // 3. 새 이미지 추가
    const files = req.files || [];

    // 기존 이미지 중 가장 큰 image_order 조회
    const [[{ maxOrder }]] = await conn.query(
      `SELECT MAX(image_order) AS maxOrder FROM feed_image WHERE feed_no = ?`,
      [feed_no]
    );
    let startOrder = (maxOrder ?? -1) + 1;

    for (let i = 0; i < files.length; i++) {
      const image_path = "uploads/" + files[i].filename; // 슬래시 없이 저장
      await conn.query(
        `
          INSERT INTO feed_image (feed_no, image_path, image_order)
          VALUES (?, ?, ?)
        `,
        [feed_no, image_path, startOrder + i]
      );
    }

    // 4. 최신 이미지 목록 반환
    const [updatedImages] = await conn.query(
      `
        SELECT image_path FROM feed_image
        WHERE feed_no = ?
        ORDER BY image_order ASC
      `,
      [feed_no]
    );

    const updatedPaths = updatedImages.map((row) => row.image_path);

    await conn.commit();
    res.json({ message: 'success', updated_image_paths: updatedPaths });

  } catch (err) {
    await conn.rollback();
    console.error("피드 수정 에러:", err);
    res.status(500).json({ message: 'fail', error: err.message });
  } finally {
    conn.release();
  }
});

// 내가 쓴 글 조회
router.get('/my-posts', async (req, res) => {
  const { user_id } = req.query;

  try {
    const sql = `
      SELECT 
        f.feed_no,
        f.feed_title,
        f.feed_contents,
        f.feed_cdate,
        f.maker_id,
        u.user_name,
        u.user_imgpath,
        (SELECT COUNT(*) FROM feed_like fl WHERE fl.feed_no = f.feed_no) AS like_count,
        (SELECT COUNT(*) FROM comment c WHERE c.feed_no = f.feed_no) AS comment_count,
        COALESCE(GROUP_CONCAT(fi.image_path ORDER BY fi.image_order), '') AS image_paths
      FROM feed f
      JOIN user u ON f.maker_id = u.user_id
      LEFT JOIN feed_image fi ON f.feed_no = fi.feed_no
      WHERE f.maker_id = ?
      GROUP BY 
        f.feed_no, f.feed_title, f.feed_contents, f.feed_cdate, f.maker_id,
        u.user_name, u.user_imgpath
      ORDER BY f.feed_cdate DESC
    `;

    const [rows] = await db.query(sql, [user_id]);

    const result = rows.map(row => ({
      ...row,
      image_paths: row.image_paths ? row.image_paths.split(',') : []
    }));

    res.json(result);
  } catch (err) {
    console.error("내가 쓴 글 조회 실패:", err);
    res.status(500).send('Server Error');
  }
});

// 해당 그룹 내 좋아요 top5
router.get('/top5', async (req, res) => {
  const { group_no, user_id } = req.query;

  if (!group_no) {
    return res.status(400).json({ message: "group_no는 필수입니다." });
  }

  try {
    const sql = `
      SELECT 
        f.feed_no,
        f.feed_title,
        f.feed_contents,
        f.feed_status,
        f.feed_cdate,
        f.group_no,
        f.maker_id,
        u.user_name,
        u.user_imgpath,
        (SELECT COUNT(*) FROM feed_like fl WHERE fl.feed_no = f.feed_no) AS like_count,
        (SELECT COUNT(*) FROM comment c WHERE c.feed_no = f.feed_no) AS comment_count,
        (SELECT COUNT(*) FROM feed_like fl WHERE fl.feed_no = f.feed_no AND fl.user_id = ?) AS liked,
        COALESCE(GROUP_CONCAT(fi.image_path ORDER BY fi.image_order), '') AS image_paths
      FROM feed f
      LEFT JOIN feed_image fi ON f.feed_no = fi.feed_no
      JOIN user u ON f.maker_id = u.user_id
      WHERE f.feed_status = 'PUBLIC' AND f.group_no = ?
      GROUP BY 
        f.feed_no, f.feed_title, f.feed_contents, f.feed_status, f.feed_cdate,
        f.group_no, f.maker_id, u.user_name, u.user_imgpath
      ORDER BY like_count DESC
      LIMIT 5
    `;

    const [rows] = await db.query(sql, [user_id || 0, group_no]);

    const result = rows.map(row => ({
      ...row,
      liked: !!row.liked,
      image_paths: row.image_paths ? row.image_paths.split(',') : []
    }));

    res.json(result);
  } catch (err) {
    console.error('인기 피드 조회 오류:', err);
    res.status(500).send('Server Error');
  }
});




module.exports = router;