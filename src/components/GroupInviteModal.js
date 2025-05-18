import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, Avatar
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';

function GroupInviteModal({ open, onClose, groupNo }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!searchTerm.trim()) {
                setResults([]);
                return;
            }

            // 그룹 초대용 검색 API
            fetch(`http://localhost:3000/group/searchUser?keyword=${encodeURIComponent(searchTerm)}&group_no=${groupNo}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setResults(data);
                    else setResults([]);
                })
                .catch(err => {
                    console.error('유저 검색 실패:', err);
                    setResults([]);
                });
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, groupNo]);

    //  그룹 초대 API 호출
    const handleInvite = async (user_id) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("로그인이 필요합니다.");
                return;
            }

            const sender_id = jwtDecode(token).tokenId;

            const res = await fetch("http://localhost:3000/group/invite", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_no: groupNo,
                    receiver_id: user_id, // 초대 대상
                    sender_id: sender_id  // 초대 보낸 사람
                })
            });

            const data = await res.json();

            if (data.message === "success") {
                alert("초대 완료");
                setResults(prev =>
                    prev.map(user =>
                        user.user_id === user_id ? { ...user, already_member: true } : user
                    )
                );
            } else if (data.message === "already") {
                alert("이미 그룹에 속한 사용자입니다.");
            } else if (data.message === 'already_invited') {
                alert("이미 초대 요청을 보낸 사용자입니다.");
            } else {
                alert("초대 실패: " + data.message);
            }
        } catch (err) {
            console.error("초대 실패:", err);
            alert("서버 오류로 초대에 실패했습니다.");
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>그룹원 초대</DialogTitle>
            <DialogContent sx={{ height: 300, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            placeholder="사용자 이름 검색"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            size="small"
                        />
                        <Button variant="contained">검색</Button>
                    </Box>
                </Box>

                <Box sx={{ flex: 3, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                    {results.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">사용자 이름 검색</Typography>
                    ) : (
                        results.map(user => (
                            <Box
                                key={user.user_id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                    borderBottom: '1px solid rgb(138, 138, 138)',
                                    pb: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar
                                        src={`http://localhost:3000/${user.user_imgpath || 'uploads/default_background.png'}`}
                                        sx={{ width: 36, height: 36 }}
                                    />
                                    <Typography variant="body2">{user.user_name} ({user.user_id})</Typography>
                                </Box>

                                {!user.already_member && (
                                    <Typography
                                        variant="body2"
                                        color="primary"
                                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => handleInvite(user.user_id)}
                                    >
                                        초대하기
                                    </Typography>
                                )}
                            </Box>
                        ))
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>닫기</Button>
            </DialogActions>
        </Dialog>
    );
}

export default GroupInviteModal;
