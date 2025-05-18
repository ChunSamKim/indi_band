import React from 'react';
import {
  Box, Typography, Avatar, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function GroupListSimpleItem({ group }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        mb: 2,
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/GroupDetail?group_no=${group.group_no}`)}
    >
      <Avatar
        src={group.group_imgpath ? `http://localhost:3000/${group.group_imgpath}` : '/no-image.png'}
        alt={group.group_name}
        variant="rounded"
        sx={{ width: 64, height: 64 }}
      />

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {group.group_name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mt: 0.5
          }}
        >
          {group.group_comment || '그룹 소개가 없습니다.'}
        </Typography>

        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(group.tagList || []).map((tag, idx) => (
            <Chip
              key={idx}
              label={`#${tag}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default GroupListSimpleItem;
