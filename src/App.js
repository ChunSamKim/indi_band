import React from 'react';
import { Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Login from './components/Login';
import Join from './components/Join';
import Feed from './components/Feed';
import Register from './components/Register';
import MyPage from './components/MyPage';
import Menu from './components/Menu';
import Group from './components/Group';
import Lobby from './components/Lobby';
import { jwtDecode } from 'jwt-decode';
import RecoilEx from './components/RecoilEx';
import AddGroup from './components/AddGroup';
import GroupDetail from './components/GroupDetail';
import Chat from './components/Chat';
import GroupSimilar from './components/GroupSimilar';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/join';
  const token = localStorage.getItem("token");

  const navigate = useNavigate();
  let dToken = null;
  try {
    if (token) {
      dToken = jwtDecode(token);
      console.log(dToken);
    }
  } catch (e) {
    console.error("토큰 파싱 에러:", e);
    localStorage.removeItem("token");
  }

  const isTokenValid = (decoded) => {
    if (!decoded || !decoded.exp) return false;
    const now = Date.now() / 1000;
    return decoded.exp > now;
  };

  const isLoggedIn = isTokenValid(dToken);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <CssBaseline />
      {/* 상단 헤더 */}
      {!isAuthPage && <Menu />}

      {/* AppBar 아래 여백 확보 */}
      {!isAuthPage && <Toolbar />}

      {/* 페이지 내용 */}
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Group /> : <Navigate to="/login" />} />
          <Route path="/join" element={<Join />} />
          <Route path="/login" element={<Login />} />
          <Route path="/group" element={<Group />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mypage" element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />} />
          <Route path="/feed" element={isLoggedIn ? <Feed /> : <Navigate to="/login" />} />
          <Route path="/recoilex" element={<RecoilEx />} />
          <Route path="/AddGroup" element={<AddGroup />} />
          <Route path="/GroupDetail" element={<GroupDetail />} />
           <Route path="/GroupSimilar" element={<GroupSimilar />} />
        </Routes>
      </Box>
      {isLoggedIn && !isAuthPage && <Chat />}
    </Box>
  );
}

export default App;
