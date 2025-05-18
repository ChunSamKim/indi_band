import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Avatar, IconButton, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { jwtDecode } from 'jwt-decode';

function ProfileEdit() {
  const [currentName, setCurrentName] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [openPwdConfirm, setOpenPwdConfirm] = useState(false);
  const [pwdForNameChange, setPwdForNameChange] = useState('');
  const [profileImg, setProfileImg] = useState('uploads/default_profile.png');

  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [newImg, setNewImg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentName(decoded.tokenName);
      if (decoded.tokenImgpath) {
        setProfileImg(decoded.tokenImgpath);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleProfileImageUpdate = () => setImgModalOpen(true);

  const handleSaveImage = async () => {
    if (!newImg) return;

    const formData = new FormData();
    formData.append("profile", newImg);

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3000/user/updateProfileImg", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (data.message === "success") {
      alert("이미지가 변경되었습니다.");
      setProfileImg(data.imgPath);
      setImgModalOpen(false);
      setPreviewUrl(null);
      setNewImg(null);

      // 🔄 토큰 갱신 없이 프론트 상태만 변경 (원한다면 토큰도 새로 저장 필요)
    } else {
      alert("이미지 변경 실패");
    }
  };

  const handleNameSave = () => {
    if (!name.trim()) return alert("이름을 입력해주세요.");
    setOpenPwdConfirm(true);
  };

  const confirmNameChange = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3000/user/updateName", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 토큰 추가
      },
      body: JSON.stringify({ name, password: pwdForNameChange })
    });

    const data = await res.json();
    if (data.message === 'success') {
      alert("이름이 변경되었습니다.");
      setCurrentName(name);
      setOpenPwdConfirm(false);
      setPwdForNameChange('');
    } else {
      alert(data.message || "이름 변경 실패");
    }
  };


  const validatePassword = (pwd) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(pwd);
  };

  const handlePasswordSave = async () => {
    if (!validatePassword(newPassword)) return alert("비밀번호 조건 불충족");
    if (newPassword !== confirmPassword) return alert("비밀번호 불일치");

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3000/user/updatePassword", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` //  토큰 추가
      },
      body: JSON.stringify({ password: newPassword })
    });

    const data = await res.json();
    if (data.message === 'success') {
      alert("비밀번호가 변경되었습니다.");
      setNewPassword('');
      setConfirmPassword('');
    } else {
      alert(data.message || "변경 실패");
    }
  };


  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ flex: 1, p: 4 }}>
        {/* 프로필 사진 */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>프로필 사진</Typography>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', width: 150, height: 150, margin: '0 auto'
          }}>
            <Avatar
              src={`http://localhost:3000/${profileImg}`}
              sx={{ width: 150, height: 150 }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: '#ffffffcc',
                border: '1px solid #ccc',
                '&:hover': { backgroundColor: '#f0f0f0' }
              }}
              size="small"
              onClick={handleProfileImageUpdate}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

        {/* 이름 수정 */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>이름 수정</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>현재 이름: <strong>{currentName}</strong></Typography>
          <TextField
            fullWidth label="새 이름" value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <Button variant="contained" onClick={handleNameSave}>이름 저장</Button>
        </Paper>

        {/* 비밀번호 수정 */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>비밀번호 수정</Typography>
          <TextField
            fullWidth type="password" label="새 비밀번호"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth type="password" label="비밀번호 확인"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handlePasswordSave}>비밀번호 저장</Button>
        </Paper>
      </Box>

      {/* 이름 변경용 비밀번호 확인 모달 */}
      <Dialog open={openPwdConfirm} onClose={() => setOpenPwdConfirm(false)}>
        <DialogTitle>비밀번호 확인</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth type="password" label="비밀번호"
            value={pwdForNameChange}
            onChange={(e) => setPwdForNameChange(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPwdConfirm(false)}>취소</Button>
          <Button variant="contained" onClick={confirmNameChange}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* 프로필 이미지 수정 모달 */}
      <Dialog open={imgModalOpen} onClose={() => setImgModalOpen(false)}>
        <DialogTitle>프로필 이미지 변경</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {previewUrl && (
            <Avatar
              src={previewUrl}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
          )}
          <input
            type="file" accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setNewImg(file);
              setPreviewUrl(URL.createObjectURL(file));
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImgModalOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSaveImage}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfileEdit;
