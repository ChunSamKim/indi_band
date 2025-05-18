import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Chip, Button
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import TagSearchBox from '../components/TagSearchBox';
import GroupListSimpleItem from '../components/GroupListSimpleItem';

function GroupSimilar() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (userId && tags.length > 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 사용자 정보 및 초기 태그 설정
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserId(decoded.tokenId);
    }

    const rawTags = searchParams.get('tags');
    if (rawTags) {
      const parsedTags = rawTags.split(',').filter(Boolean);
      setTags(parsedTags);
    }
  }, [searchParams]);

  // 검색 요청 함수 (버튼으로만 트리거)
  const handleSearch = () => {
    if (!tags.length || !userId) return;

    fetch(`http://localhost:3000/group/similar?tags=${encodeURIComponent(tags.join(','))}&userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setGroups(data);
        setPage(1);
      })
      .catch(err => console.error("유사 그룹 검색 실패:", err));
  };

  const startIdx = (page - 1) * itemsPerPage;
  const paginatedGroups = groups.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(groups.length / itemsPerPage);

  return (
    <Box sx={{ maxWidth: 800, Height:`80%`, mx: 'auto', px: 2, py: 4, backgroundColor: '#e3f2fd', minHeight: '100vh' }}>

      {/* 태그 검색창 */}
      <TagSearchBox onTagSelect={(tag) => {
        setTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
      }} />

      <Typography variant="h6" gutterBottom>
        태그 기반 그룹 검색 결과
      </Typography>

      {/* 태그 목록 + 검색 버튼 */}
      {tags.length > 0 && (
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={10}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tags.map((tag, idx) => (
                <Chip
                  key={idx}
                  label={`#${tag}`}
                  size="small"
                  color="primary"
                  onDelete={() => {
                    setTags(prev => prev.filter(t => t !== tag));
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              disabled={tags.length === 0}
            >
              검색
            </Button>
          </Grid>
        </Grid>
      )}

      {/* 검색 결과 */}
      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          조건에 맞는 그룹이 없습니다.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedGroups.map(group => (
              <Grid item xs={12} sm={6} key={group.group_no}>
                <GroupListSimpleItem group={group} />
              </Grid>
            ))}
          </Grid>

          {/* 페이지네이션 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
            >
              이전
            </Button>
            <Typography variant="body2" sx={{ pt: '6px' }}>
              {page} / {totalPages}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage(prev => prev + 1)}
            >
              다음
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default GroupSimilar;
