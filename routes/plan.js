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
        const ext = path.extname(file.originalname); 
        const randomName = crypto.randomBytes(16).toString('hex'); // 32자리 랜덤 문자열
        cb(null, `${randomName}${ext}`);
    }
});

const upload = multer({ storage });

// plan 리스트
router.get('/list', async (req, res) => {
  const group_no = req.query.group_no;

  try {
    const [rows] = await db.query(`SELECT * FROM plan WHERE group_no = ?`, [group_no]);
    res.json(rows); 
  } catch (err) {
    console.error('일정 조회 오류:', err);
    res.status(500).json({ message: 'fail' });
  }
});

// plan 추가
router.post('/add', async (req, res) => {
    const { group_no, plan_title, plan_contents, start_date, end_date } = req.body;
  
    try {
      await db.query(`
        INSERT INTO plan (group_no, plan_title, plan_contents, start_date, end_date, plan_cdate)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [group_no, plan_title, plan_contents, start_date, end_date]);
  
      res.json({ message: 'success' });
    } catch (err) {
      console.error('일정 등록 중 에러:', err);
      res.status(500).json({ message: 'fail' });
    }
  });

  router.post('/edit', async (req, res) => {
    const { plan_no, plan_title, plan_contents, start_date, end_date } = req.body;
  
    try {
      await db.query(`
        UPDATE plan
        SET plan_title = ?, plan_contents = ?, start_date = ?, end_date = ?
        WHERE plan_no = ?
      `, [plan_title, plan_contents, start_date, end_date, plan_no]);
  
      res.json({ message: 'success' });
    } catch (err) {
      console.error('일정 수정 오류:', err);
      res.status(500).json({ message: 'fail' });
    }
  });
  
  router.post('/delete', async (req, res) => {
    const { plan_no } = req.body;
  
    try {
      await db.query(`DELETE FROM planㄴ WHERE plan_no = ?`, [plan_no]);
      res.json({ message: 'success' });
    } catch (err) {
      console.error('일정 삭제 오류:', err);
      res.status(500).json({ message: 'fail' });
    }
  });

module.exports = router;