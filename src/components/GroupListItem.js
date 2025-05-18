import React from 'react';
import {
  Box, Typography, Avatar, Chip, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';

function GroupListItem({ group }) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {group.group_name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <PersonIcon sx={{ fontSize: 16, mr: 0.3, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {group.member_count}
            </Typography>
          </Box>
        </Box>

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

        <Typography
          variant="caption"
          color="primary"
          sx={{ mt: 0.5 }}
          onClick={(e) => {
            e.stopPropagation();
            const tagQuery = (group.tagList || []).join(',');
            navigate(`/GroupSimilar?tags=${encodeURIComponent(tagQuery)}`);
          }}
        >
          비슷한 태그 더보기 &gt;
        </Typography>

      </Box>
    </Box>
  );
}

export default GroupListItem;
