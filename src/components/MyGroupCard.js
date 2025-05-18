import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

function MyGroupCard({ group }) {
    const navigate = useNavigate();

    return (
        <Card
            sx={{
                width: 210, 
                height: 260,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
            }}
            onClick={() => navigate(`/GroupDetail?group_no=${group.group_no}`)}
        >
            <CardMedia
                component="img"
                image={
                    group.group_imgpath
                        ? `http://localhost:3000/${group.group_imgpath}`
                        : '/no-image.png'
                }
                alt={group.group_name}
                sx={{
                    height: '180px',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0',
                    padding: '4px'
                }}
            />
            <CardContent sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {group.group_name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                        {group.member_count}명
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default MyGroupCard;
