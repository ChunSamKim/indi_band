import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Join() {
  const [userId, setUserId] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [name, setName] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdMatchError, setPwdMatchError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  };

  const handleJoin = async () => {
    let valid = true;
  
    
    if (!validatePassword(pwd)) {
      setPwdError('비밀번호는 숫자, 영문, 특수문자 포함 8자 이상이어야 합니다.');
      valid = false;
    } else {
      setPwdError('');
    }
  
    
    if (pwd !== pwdConfirm) {
      setPwdMatchError('비밀번호가 일치하지 않습니다.');
      valid = false;
    } else {
      setPwdMatchError('');
    }
  
    if (valid) {
      try {
        const res = await fetch("http://localhost:3000/user/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: userId,
            pwd: pwd,
            name: name
          })
        });
        
        const result = await res.json();
  
        if (res.ok) {
          alert("회원가입 성공");
          navigate("/login");
        } else {
          alert("회원가입 실패: " + result.message);
        }
      } catch (err) {
        console.error("회원가입 오류 :", err);
      }
    }
  };
  

  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Typography variant="h4" gutterBottom>
          회원가입
        </Typography>
        <TextField
          label="아이디"
          variant="outlined"
          margin="normal"
          fullWidth
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <TextField
          label="비밀번호"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          error={!!pwdError}
          helperText={pwdError}
        />
        <TextField
          label="비밀번호 확인"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
          value={pwdConfirm}
          onChange={(e) => setPwdConfirm(e.target.value)}
          error={!!pwdMatchError}
          helperText={pwdMatchError}
        />
        <TextField
          label="이름"
          variant="outlined"
          margin="normal"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: '20px' }}
          onClick={handleJoin}
        >
          회원가입
        </Button>
        <Typography variant="body2" style={{ marginTop: '10px' }}>
          회원이신가요? <Link to="/login">로그인</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Join;
