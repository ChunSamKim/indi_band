import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Chip, Grid } from '@mui/material';

function TagSearchBox({ onTagSelect }) {
  const [query, setQuery] = useState('');
  const [matchedTags, setMatchedTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!query.trim()) {
        setMatchedTags([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/group/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setMatchedTags(data);
      } catch (err) {
        console.error('태그 검색 실패:', err);
      }
    };

    fetchTags();
  }, [query]);

  return (
    <Box sx={{ paddingBottom: 2, marginBottom: 3 }}>
      <Typography variant="h6" gutterBottom>태그 검색</Typography>

      <TextField
        fullWidth
        placeholder="태그를 입력하세요"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {matchedTags.length > 0 ? (
        <Grid container spacing={1}>
          {matchedTags.map(tag => (
            <Grid item key={tag.tag_no}>
              <Chip
                label={`#${tag.tag_name}`}
                clickable
                onClick={() => onTagSelect(tag.tag_name)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        query && (
          <Typography variant="body2" color="text.secondary">
            관련 태그가 없습니다.
          </Typography>
        )
      )}
    </Box>
  );
}

export default TagSearchBox;
