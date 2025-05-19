const express = require('express')
const path = require('path');
const db = require('../db')
const fs = require('fs'); 
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
//user 테이블 칼럼
//user_id, user_pwd, user_name, user_info, user_imgpath, user_status, user_cdate

router.post("/join", async (req, res) => {
    let { userId, pwd, name } = req.body;
    
    try {
        let hash = await bcrypt.hash(pwd, 10);
        let sql = `insert into user (user_id, user_pwd, user_name, user_info, user_imgpath, user_status, user_cdate)
                   VALUES (?, ?, ?, null, 'uploads/default_profile.png', 'A', now())`; 

        let result = await db.query(sql, [userId, hash, name]);
        console.log(result + hash);
        res.json({
            message: "회원가입 성공",
            result: result
        });
    } catch (err) {
        console.log("회원가입 에러", err);
        res.status(500).json({ message: "회원가입 실패" });
    }
});

router.post("/login", async (req, res) => {
    let { userId, pwd } = req.body;
    try {
      let query = "select * FROM user where user_id = ?";
      let [user] = await db.query(query, [userId]);
      let result = {};
  
      if (user.length > 0) {
        let isMatch = await bcrypt.compare(pwd, user[0].user_pwd);
        if (isMatch) {
          const payload = {
            tokenId: user[0].user_id,
            tokenName: user[0].user_name,
            tokenImgpath: user[0].user_imgpath,
            tokenStatus: user[0].user_status,
            tokenCdate: user[0].user_cdate,
          };
  
          const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });
  
          result = {
            message: "로그인 성공",
            user: payload, // 수정
            token: token
          };
        } else {
          result = {
            message: "비밀번호 불일치"
          };
        }
      } else {
        result = {
          message: "아이디 불일치"
        };
      }
  
      res.json(result); 
    } catch (err) {
      console.log("로그인 에러", err);
      res.status(500).send("Server Error");
    }
  });

router.get("/info", (req, res) => {
    if(req.session.user){
        res.json({
            isLogin : true,
            user : req.session.user
        })
    } else {
        res.json({
            isLogin : false
        })
    }
})



router.get("/logout",(req,res)=>{
    req.session.destroy(err =>{
        if(err){
            console.log("로그아웃 에러");
            res.status(500).send("로그아웃 에러");
        }else{
            res.clearCookie("connect.sid");
            res.json({
                message : "로그아웃"
            });
        }
    });

})

// 프로필 이미지 업데이트
router.post("/updateProfileImg", upload.single('profile'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: '토큰 없음' });

    const decoded = jwt.verify(token, JWT_KEY);
    const userId = decoded.tokenId;
    const imgPath = 'uploads/profile/' + req.file.filename;

    const sql = `UPDATE user SET user_imgpath = ? WHERE user_id = ?`;
    await db.query(sql, [imgPath, userId]);

    // 실제 파일 존재 여부 확인
    const fullPath = path.join(__dirname, '..', imgPath);
    const waitForFile = async () => {
      for (let i = 0; i < 10; i++) {
        if (fs.existsSync(fullPath)) return true;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return false;
    };

    const exists = await waitForFile();
    if (!exists) return res.status(500).json({ message: '파일 접근 불가' });

    res.json({ message: 'success', imgPath });
  } catch (err) {
    console.error("프로필 이미지 업로드 중 에러:", err);
    res.status(500).json({ message: 'fail' });
  }
});


// 이름 변경
router.post("/updateName", async (req, res) => {
  const { name, password } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    const userId = decoded.tokenId;

    const [rows] = await db.query("SELECT user_pwd FROM user WHERE user_id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "사용자 없음" });

    const isMatch = await bcrypt.compare(password, rows[0].user_pwd);
    if (!isMatch) return res.status(403).json({ message: "비밀번호 불일치" });

    await db.query("UPDATE user SET user_name = ? WHERE user_id = ?", [name, userId]);
    res.json({ message: "success" });
  } catch (err) {
    console.error("이름 변경 중 에러:", err);
    res.status(500).json({ message: "fail" });
  }
});

//  비밀번호 변경
router.post("/updatePassword", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    const userId = decoded.tokenId;

    const [rows] = await db.query("SELECT user_pwd FROM user WHERE user_id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "사용자 없음" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].user_pwd);
    if (!isMatch) return res.status(403).json({ message: "현재 비밀번호 불일치" });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE user SET user_pwd = ? WHERE user_id = ?", [hash, userId]);

    res.json({ message: "success" });
  } catch (err) {
    console.error("비밀번호 변경 중 에러:", err);
    res.status(500).json({ message: "fail" });
  }
});


module.exports = router;