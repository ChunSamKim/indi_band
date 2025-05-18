import React from 'react';
import { Card, Avatar, Box, Typography, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

function GroupCard({ group }) {
  const navigate = useNavigate();
  if (!group) return null;

  return (
    <Card
      sx={{
        width: 320,
        height: 180,
        display: 'flex',
        p: 1.5,
        mb: 2,
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/GroupDetail?group_no=${group.group_no}`)}
    >
      <Avatar
        src={group.group_imgpath ? `http://localhost:3000/${group.group_imgpath}` : '/no-image.png'}
        alt={group.group_name}
        variant="rounded"
        sx={{ width: 60, height: 60, mr: 2 }}
      />

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {group.group_name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {group.group_comment || '그룹 소개가 없습니다.'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
          <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            {group.member_count}명
          </Typography>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {group.tagList?.map((tag, idx) => (
            <Chip
              key={idx}
              label={`#${tag}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
}

export default GroupCard;
