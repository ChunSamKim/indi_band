import React, { useEffect, useState, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Tooltip, Badge, Box, Paper
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import CloseIcon from '@mui/icons-material/Close';

import NotificationsIcon from '@mui/icons-material/Notifications';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

function Menu() {
  const [notiCount, setNotiCount] = useState(0);
  const [notiList, setNotiList] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedNoti, setSelectedNoti] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const socketRef = useRef(null);
  const userId = useRef(null);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const res = await fetch(`http://localhost:3000/notification/unreadList?user_id=${userId.current}`);
      const data = await res.json();
      setNotiList(data || []);
      setNotiCount(data.length);
    } catch (err) {
      console.error("알림 목록 조회 실패:", err);
    }
  };

  const markAsRead = async (noti_no) => {
    try {
      await fetch(`http://localhost:3000/notification/markRead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noti_no })
      });
      setNotiList(prev => prev.filter(n => n.noti_no !== noti_no));
      setNotiCount(prev => prev - 1);
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = jwtDecode(token);
    userId.current = decoded.tokenId;

    socketRef.current = io("http://localhost:3000");
    socketRef.current.emit('registerNotificationChannel', userId.current);

    socketRef.current.on('pushNotification', () => {
      fetchUnread();
    });

    fetchUnread();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNotiClick = (noti) => {
    setSelectedNoti(noti);
    setShowModal(true);
  };

  const handleAccept = async (noti) => {
    let url = '';
    let payload = { noti_no: noti.noti_no };

    if (noti.noti_type === 'I') {
      url = 'http://localhost:3000/notification/accept-invite';
      payload.group_no = noti.group_no;
      payload.user_id = userId.current;
    } else if (noti.noti_type === 'R') {
      url = 'http://localhost:3000/notification/accept-request';
      payload.group_no = noti.group_no;
      payload.user_id = noti.user_id;
    }

    if (url) {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowModal(false);
      fetchUnread();
    }
  };

  const handleDecline = async (noti) => {
    let url = '';
    if (noti.noti_type === 'I') url = 'http://localhost:3000/notification/reject-invite';
    else if (noti.noti_type === 'R') url = 'http://localhost:3000/notification/reject-request';

    if (url) {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noti_no: noti.noti_no })
      });
      setShowModal(false);
      fetchUnread();
    }
  };

  const handleConfirm = async (noti_no) => {
    await markAsRead(noti_no);
    setShowModal(false);
    fetchUnread();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#64b5f6' }}>
      <Toolbar>
        {/* 로고 이미지 클릭 시 /main 이동 */}
        <Link to="/">
          <img
            src="/img/bandee.png"
            alt="로고"
            style={{ height: '100px', cursor: 'pointer' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', marginRight: '30px', position: 'relative' }}>
          <Box sx={{ position: 'relative' }}>
            <Tooltip title="알림">
              <IconButton color="inherit" onClick={() => setShowPopup(prev => !prev)}>
                <Badge badgeContent={notiCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {showPopup && notiList.length > 0 && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '42px',
                  right: '100%',
                  mr: 2,
                  width: 300,
                  height: 300,
                  backgroundColor: '#fff',
                  boxShadow: 3,
                  zIndex: 9999,
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  새 알림
                </Typography>

                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {notiList.map(noti => (
                    <Box
                      key={noti.noti_no}
                      onClick={() => handleNotiClick(noti)}
                      sx={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        p: 1.2,
                        mb: 1,
                        height: 70,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <Box sx={{ maxWidth: 230, overflow: 'hidden' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {noti.noti_title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {new Date(noti.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(noti.noti_no);
                      }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>

          <Tooltip title="그룹">
            <IconButton color="inherit" component={Link} to="/group">
              <GroupsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="마이페이지">
            <IconButton color="inherit" component={Link} to="/mypage">
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="로그아웃">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </div>
      </Toolbar>

      {showModal && selectedNoti && (
        <Paper
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            p: 3,
            zIndex: 9999,
            backgroundColor: '#fff',
            boxShadow: 6,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {selectedNoti.noti_type === 'I' && '그룹 초대 알림'}
            {selectedNoti.noti_type === 'C' && '채팅방 초대 알림'}
            {selectedNoti.noti_type === 'R' && '그룹 가입 요청'}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedNoti.noti_title}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {selectedNoti.noti_type === 'C' && (
              <button onClick={() => handleConfirm(selectedNoti.noti_no)}>확인</button>
            )}
            {['I', 'R'].includes(selectedNoti.noti_type) && (
              <>
                <button onClick={() => handleAccept(selectedNoti)}>수락</button>
                <button onClick={() => handleDecline(selectedNoti)}>거절</button>
              </>
            )}
          </Box>
        </Paper>
      )}
    </AppBar>
  );
}

export default Menu;
