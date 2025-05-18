import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { jwtDecode } from "jwt-decode";

function Register() {
  const token = localStorage.getItem("token");
  const dToken = jwtDecode(token);

  const [userId, setUserId] = useState("");
  const [images, setImages] = useState([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    console.log(dToken.tokenEmail)
    setUserId(dToken.tokenEmail);
  }, []);

  const imageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content || !title) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("content", content);
    formData.append("title", title);
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    fetch("http://localhost:3000/feed", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "등록 완료");
      })
      .catch((error) => {
        console.error("요청 오류:", error);
      });
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        minHeight="100vh"
        sx={{ padding: '20px' }}
      >
        <Typography variant="h4" gutterBottom>
          등록
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>카테고리</InputLabel>
          <Select defaultValue="" label="카테고리">
            <MenuItem value={1}>일상</MenuItem>
            <MenuItem value={2}>여행</MenuItem>
            <MenuItem value={3}>음식</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="제목"
          variant="outlined"
          margin="normal"
          fullWidth
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="내용"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          rows={4}
          onChange={(e) => setContent(e.target.value)}
        />

        <Box display="flex" alignItems="center" margin="normal" fullWidth>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={imageChange}
            multiple
          />
          <label htmlFor="file-upload">
            <IconButton color="primary" component="span">
              <PhotoCamera />
            </IconButton>
          </label>
          <Typography variant="body1" sx={{ marginLeft: 2 }}>
            {images.length > 0
              ? `${images.length}개 이미지 선택됨`
              : '첨부할 파일 선택'}
          </Typography>
        </Box>

        {/* 미리보기 섹션 */}
        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          {images.map((img, index) => (
            <Avatar
              key={index}
              src={URL.createObjectURL(img)}
              alt={`미리보기 ${index + 1}`}
              sx={{ width: 56, height: 56 }}
            />
          ))}
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: '20px' }}
          onClick={handleSubmit}
        >
          등록하기
        </Button>
      </Box>
    </Container>
  );
}

export default Register;
