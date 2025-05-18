import React, { useRef, useState, useEffect } from 'react';
import {
  Box, Typography, Button, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { io } from "socket.io-client";
import InviteModal from './InviteModal'; //채팅방에 초대할 때 모달
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton'; // 추가



function Chat() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const chatRef = useRef(null);

  const [chatRooms, setChatRooms] = useState([]);
  const [dimensions, setDimensions] = useState({
    width: 500,
    height: 400,
    //top: window.innerHeight - 420,
    bottom: 20,
    left: 20
  });
  const [myInfo, setMyInfo] = useState({ name: '', img: '' });

  const [selectedRoom, setSelectedRoom] = useState(null); // 선택된 채팅방
  const [messages, setMessages] = useState([]); // 해당 채팅방 메시지들

  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 500, height: 400, top: 0 });

  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState(''); // 채팅보낼 메세지
  const [inviteOpen, setInviteOpen] = useState(false); // 채팅방 초대 모달

  const [anchorEl, setAnchorEl] = useState(null); // 메뉴 anchor
  const menuOpen = Boolean(anchorEl);


  const socket = useRef(null);

  useEffect(() => { // 소켓 생성
    socket.current = io("http://localhost:3000");
    return () => socket.current.disconnect();
  }, []);


  useEffect(() => {  //알림
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const userId = jwtDecode(token).tokenId;
    const decoded = jwtDecode(token);
    setMyInfo({
      name: decoded.tokenName,
      img: decoded.tokenImgpath || 'uploads/default_profile.png'
    });

    fetch(`http://localhost:3000/chat/myRooms?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        setChatRooms(data || [])
        if (data && data.length > 0) {
          handleSelectRoom(data[0]); // 첫 번째 채팅방 자동 접속
        }
      })
      .catch(err => console.error("채팅방 목록 조회 실패:", err));
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ ...dimensions });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;

      const newWidth = Math.max(300, startSize.width + dx);
      const newHeight = Math.max(300, startSize.height - dy);
      const newTop = startSize.top + dy;

      setDimensions(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize]);


  //새로고침 시 lastread 갱신
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const token = localStorage.getItem("token");
      if (!token || !selectedRoom) return;
      const userId = jwtDecode(token).tokenId;

      navigator.sendBeacon(
        "http://localhost:3000/chat/updateLastRead",
        new Blob([JSON.stringify({
          chat_no: selectedRoom.chat_no,
          user_id: userId
        })], { type: 'application/json' })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedRoom]);



  const handleCreateChatRoom = () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    const userId = jwtDecode(token).tokenId;

    fetch("http://localhost:3000/chat/createRoom", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, user_id: userId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === "success") {
          alert("채팅방이 생성되었습니다.");
          setOpenModal(false);
          setNewTitle('');
          fetch(`http://localhost:3000/chat/myRooms?user_id=${userId}`)
            .then(res => res.json())
            .then(data => setChatRooms(data || []))
            .catch(err => console.error("채팅방 목록 재조회 실패:", err));
        } else {
          alert("생성 실패");
        }
      });
  };

  const handleSelectRoom = async (room) => {
    const token = localStorage.getItem("token");
    const userId = jwtDecode(token).tokenId;
    setChatRooms(prev =>
      prev.map(r => r.chat_no === room.chat_no ? { ...r, unread_count: 0 } : r)
    );
    // 현재 선택된 방에 대해 last_read 갱신
    if (selectedRoom) { //다른방으로 옮길 때 last_read를 갱신하기 위함
      await fetch("http://localhost:3000/chat/updateLastRead", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_no: selectedRoom.chat_no,
          user_id: userId
        })
      });
    }

    //해당 채팅방의 채팅내역 가져오기
    setSelectedRoom(room);
    try {
      const res = await fetch(`http://localhost:3000/chat/messages?chat_no=${room.chat_no}`);
      const data = await res.json();
      setMessages(data || []);

      socket.current.emit("joinGroupChat", room.chat_no);


      /*socket.current.off("groupMessage");
      socket.current.on("groupMessage", (msg) => {
        console.log("받은 메시지:", msg);
        if (msg.groupNo === room.chat_no) {
          setMessages(prev => [...prev, {
            ...msg,
            user_id: msg.senderId,
            content: msg.message,
            user_name: msg.user_name,
            message_no: msg.message_no || `recv-${Date.now()}`
          }]);
        }
      });*/
    } catch (err) {
      console.error('채팅 메시지 조회 실패:', err);
    }
  };


  //메세지 보내기
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const token = localStorage.getItem("token");
    const userId = jwtDecode(token).tokenId;

    const msgData = {
      groupNo: selectedRoom.chat_no,
      senderId: userId,
      message: newMessage,
      sentAt: new Date().toISOString(), // 필요 시 추가
    };

    // 1 소켓 전송
    socket.current.emit("groupMessage", msgData);

    // 2 입력창 초기화
    setNewMessage('');
  };


  // 새 채팅 오면 
  useEffect(() => {
    if (!socket.current) return;

    const handler = (msg) => {
      console.log("받은 메시지:", msg);

      // 현재 열려 있는 방에 수신된 경우 → 채팅에 출력
      if (msg.groupNo === selectedRoom?.chat_no) {
        setMessages(prev => [...prev, {
          ...msg,
          user_id: msg.senderId,
          content: msg.message,
          user_name: msg.user_name,
          message_no: msg.message_no || `recv-${Date.now()}`
        }]);
      } else {
        // 다른 방이면 → 해당 채팅방의 unread_count를 +1
        setChatRooms(prev =>
          prev.map(r =>
            r.chat_no === msg.groupNo
              ? { ...r, unread_count: (r.unread_count || 0) + 1 }
              : r
          )
        );
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`${msg.user_name}님의 메시지`, {
            body: msg.message,
            icon: `http://localhost:3000/uploads/default_profile.png`
          });
        }
      }
    };

    socket.current.on("groupMessage", handler);
    return () => socket.current.off("groupMessage", handler);
  }, [selectedRoom?.chat_no]);


  useEffect(() => {
    const handleBeforeUnload = async () => {
      const token = localStorage.getItem("token");
      if (!token || !selectedRoom) return;
      const userId = jwtDecode(token).tokenId;

      navigator.sendBeacon(
        "http://localhost:3000/chat/updateLastRead",
        new Blob([JSON.stringify({
          chat_no: selectedRoom.chat_no,
          user_id: userId
        })], { type: 'application/json' })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedRoom]);


  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleInviteClick = () => {
    setInviteOpen(true);
    handleSettingsClose();
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;
    const token = localStorage.getItem("token");
    const userId = jwtDecode(token).tokenId;

    const confirmed = window.confirm("채팅방을 나가시겠습니까?");
    if (!confirmed) return;

    try {
      const res = await fetch("http://localhost:3000/chat/leaveRoom", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_no: selectedRoom.chat_no, user_id: userId })
      });
      const result = await res.json();
      if (result.message === "success") {
        alert("채팅방에서 나갔습니다.");
        setSelectedRoom(null);
        setMessages([]);
        setChatRooms(prev => prev.filter(r => r.chat_no !== selectedRoom.chat_no));
      } else {
        alert("나가기 실패");
      }
    } catch (err) {
      console.error("채팅방 나가기 실패:", err);
      alert("오류 발생");
    }

    handleSettingsClose();
  };

  return (
    <>
      {!isCollapsed && (
        <Box
          ref={chatRef}
          sx={{
            position: 'fixed',
            bottom: `${dimensions.bottom}px`,
            left: `${dimensions.left}px`,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* 리사이즈 핸들 */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              cursor: 'nwse-resize',
              zIndex: 1001,
              backgroundColor: 'transparent'
            }}
          />

          {/* 좌측: 채팅방 목록 */}
          <Box sx={{ width: '33.33%', display: 'flex', flexDirection: 'column', borderRight: '2px solid #64b5f6' }}>
            <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #64b5f6' }}>
              <Avatar
                src={`http://localhost:3000/${myInfo.img}`}
                sx={{ width: 40, height: 40, mr: 1 }}
              />
              <Typography variant="body1">{myInfo.name}</Typography>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, borderBottom: '1px solid #64b5f6' }}>
              <Typography variant="body2" fontWeight="bold">채팅 목록</Typography>
              <Button size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderRadius: 2 }} onClick={() => setOpenModal(true)}>
                ➕ 새 채팅
              </Button>
            </Box>

            <Box sx={{ flex: 7, overflowY: 'auto', px: 1, py: 1 }}>
              {Array.isArray(chatRooms) && chatRooms.map((room) => (
                <Box
                  key={room.chat_no}
                  onClick={() => handleSelectRoom(room)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    borderRadius: 1,
                    px: 1,
                    py: 0.8,
                    mb: 1,
                    boxShadow: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#e0f7fa' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={`http://localhost:3000/${room.profile_img}`} sx={{ width: 36, height: 36 }} />
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'max-width 0.3s ease',
                          maxWidth: `${dimensions.width * 0.33 - 100}px`, // 부모 width의 1/3에서 여백 감안
                        }}
                      >
                        {room.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'max-width 0.3s ease',
                          maxWidth: `${dimensions.width * 0.33 - 100}px`,
                        }}
                      >
                        {room.last_message || '메시지 없음'}
                      </Typography>
                    </Box>
                  </Box>


                  {room.unread_count > 0 && (
                    <Box
                      sx={{
                        backgroundColor: '#ef5350',
                        color: 'white',
                        fontSize: '0.75rem',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {room.unread_count > 99 ? '99+' : room.unread_count}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* 우측: 채팅 상세 */}
          <Box sx={{ width: '66.66%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, borderBottom: '2px solid #64b5f6' }}>
              <Typography variant="h6">
                {selectedRoom ? selectedRoom.title : '채팅방 제목'}
              </Typography>
              {selectedRoom && (
                <>
                  <IconButton onClick={handleSettingsClick} size="small" sx={{ mr: 3 }}>
                    <SettingsIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleSettingsClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem onClick={handleInviteClick}>채팅 초대</MenuItem>
                    <MenuItem onClick={handleLeaveRoom}>채팅방 나가기</MenuItem>
                  </Menu>
                </>
              )}

              <Box
                onClick={() => setIsCollapsed(true)}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 24, // 클릭 가능한 영역
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1002,
                  '&:hover .bar': {
                    backgroundColor: '#000'
                  }
                }}
              >
                <Box
                  className="bar"
                  sx={{
                    width: 14,
                    height: 2,
                    backgroundColor: '#666',
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>



            <Box sx={{ flex: 9, p: 2, overflowY: 'auto', backgroundColor: '#f1f8ff' }}>
              {messages.map((msg) => {
                const isMine = msg.user_id === jwtDecode(localStorage.getItem("token")).tokenId;

                return (
                  <Box
                    key={msg.message_no}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    {!isMine && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ mb: 0.5 }}
                      >
                        {msg.user_name || msg.user_id}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        maxWidth: '70%',
                        backgroundColor: '#ffffff',
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Box>
                  </Box>
                );
              })}


            </Box>

            <Box sx={{ height: 50, display: 'flex', alignItems: 'center', borderTop: '2px solid #64b5f6', backgroundColor: '#ffffff', px: 2 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px' }}
              />

              <Button variant="contained" size="small" sx={{ ml: 1 }} onClick={sendMessage}>전송</Button>

            </Box>
          </Box>
        </Box>
      )}

      {/* 채팅방 생성 모달 */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>새 채팅방 만들기</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="채팅방 제목"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>취소</Button>
          <Button variant="contained" onClick={handleCreateChatRoom}>생성</Button>
        </DialogActions>
      </Dialog>


      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        chatNo={selectedRoom?.chat_no}
      />
      {isCollapsed && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            width: 160,
            height: 40,
            backgroundColor: '#64b5f6',
            color: '#fff',
            borderRadius: 2,
            boxShadow: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000
          }}
          onClick={() => setIsCollapsed(false)}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            채팅
          </Typography>
        </Box>
      )}


    </>
  );
}

export default Chat;
