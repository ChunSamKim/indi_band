import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ProfileEdit from './ProfileEdit';
import MyPosts from './MyPosts';
import MyGroups from './MyGroups';

function MyPage() {
  const [selectedTab, setSelectedTab] = useState('profile');

  const renderContent = () => {
    switch (selectedTab) {
      case 'profile':
        return <ProfileEdit />;
      case 'groups':
        return <MyGroups />;
      case 'posts':
      default:
        return <MyPosts />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '90%',
          maxWidth: 1000,
          minHeight: 820, //  모든 콘텐츠 높이 동일하게 고정 (ProfileEdit 기준)
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'hidden'
        }}
      >
        {/* 왼쪽 메뉴 */}
        <Box
          sx={{
            width: 200,
            backgroundColor: '#e3f2fd',
            p: 2,
            borderRight: '1px solid #ccc',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>내 정보</Typography>
          <Button
            variant={selectedTab === 'profile' ? 'contained' : 'outlined'}
            onClick={() => setSelectedTab('profile')}
          >
            프로필 수정
          </Button>
          <Button
            variant={selectedTab === 'posts' ? 'contained' : 'outlined'}
            onClick={() => setSelectedTab('posts')}
          >
            내가 쓴 글
          </Button>
        </Box>

        {/* 오른쪽 콘텐츠 */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            overflowY: 'auto',
            height: '100%',           
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}

export default MyPage;
