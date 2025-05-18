import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Avatar, IconButton, Chip,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { jwtDecode } from 'jwt-decode';

function AddGroup() {
  const [tagList, setTagList] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('PUBLIC');
  const [userId, setUserId] = useState('');
  const [imgPreview, setImgPreview] = useState('');  // 프리뷰용
  const [imageFile, setImageFile] = useState(null);  // 전송용

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      if (decoded.tokenId) {
        setUserId(decoded.tokenId);
      }
    } catch (e) {
      console.error('토큰 디코딩 에러', e);
    }
  }, []);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tagList.includes(tagInput.trim())) {
        setTagList([...tagList, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag) => {
    setTagList(tagList.filter((t) => t !== tag));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImgPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('제목은 필수입니다.');
      return;
    }
    if (tagList.length === 0) {
      alert('해시태그를 1개 이상 입력하세요.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('tagList', JSON.stringify(tagList));
    formData.append('name', name);
    formData.append('comment', comment);
    formData.append('status', status);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    fetch('http://localhost:3000/group', {
      method: 'POST',
      body: formData
    })
      .then((res) => res.json())
      .then((data) => {
        alert('그룹 생성 완료!');
        console.log(data);
      })
      .catch((err) => {
        console.error('에러:', err);
        alert('그룹 생성 실패');
      });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 0, p: 3, backgroundColor: '#F0F8FF', borderRadius: 2 }}>
      {/* 프로필 이미지 */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <input type="file" id="imgUpload" hidden accept="image/*" onChange={handleImageChange} />
        <label htmlFor="imgUpload">
          <IconButton component="span">
            <Avatar src={imgPreview} sx={{ width: 100, height: 100 }}>
              {!imgPreview && <AddAPhotoIcon />}
            </Avatar>
          </IconButton>
        </label>
        <Typography variant="body2" color="textSecondary">
          그룹 프로필 이미지 추가
        </Typography>
      </Box>

      {/* 해시태그 입력 */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="해시태그 입력 후 Enter"
          fullWidth
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {tagList.map((tag, index) => (
            <Chip key={index} label={`#${tag}`} onDelete={() => handleRemoveTag(tag)} />
          ))}
        </Box>
      </Box>

      {/* 제목 */}
      <TextField
        fullWidth
        label="그룹 제목 *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* 소개 */}
      <TextField
        fullWidth
        label="간단한 소개"
        multiline
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* 공개/비공개 */}
      <FormControl sx={{ mb: 2 }}>
        <FormLabel>공개 여부</FormLabel>
        <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value)}>
          <FormControlLabel value="PUBLIC" control={<Radio />} label="공개" />
          <FormControlLabel value="PRIVATE" control={<Radio />} label="비공개" />
        </RadioGroup>
      </FormControl>

      {/* 제출 버튼 */}
      <Button fullWidth variant="contained" color="primary" onClick={handleSubmit}>
        새 그룹 추가
      </Button>
    </Box>
  );
}

export default AddGroup;
