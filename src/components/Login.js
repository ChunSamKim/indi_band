import React from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';  //jwt 꺼내기
function Login() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const navigate = useNavigate();
  const handleLogin = () => {
    fetch("http://localhost:3000/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        userId: id,
        pwd: pw
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          alert(data.message || "로그인 성공");
          localStorage.setItem("token", data.token);
          navigate("/");
        } else {
          alert(data.message || "로그인 실패");
        }
      })
      .catch(err => {
        console.error("로그인 중 오류:", err);
        alert("서버 오류가 발생했습니다.");
      });
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
          로그인
        </Typography>
        <TextField label="Email" variant="outlined" margin="normal" fullWidth value={id} onChange={(e)=>setId(e.target.value)}/>
        <TextField
          label="Password"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
          value = {pw}
          onChange={(e)=>setPw(e.target.value)}
        />
        <Button variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }} onClick={handleLogin}>
          로그인
        </Button>
        <Typography variant="body2" style={{ marginTop: '10px' }}>
          회원이 아니신가요? ? <Link to="/join">회원가입</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;
