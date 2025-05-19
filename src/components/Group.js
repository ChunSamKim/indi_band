import React, { useEffect, useState } from 'react';
import {
    Box, Typography, IconButton, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import MyGroupCard from '../components/MyGroupCard';
import GroupListItem from '../components/GroupListItem';
import NewFeed from '../components/NewFeed';

function Group() {
    const [myGroups, setMyGroups] = useState([]);
    const [publicGroups, setPublicGroups] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.tokenId;

            fetch(`http://localhost:3000/group/info?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.myGroups) setMyGroups(data.myGroups);
                    if (data.publicGroups) setPublicGroups(data.publicGroups);
                    console.log(data.publicGroups)
                })
                .catch(err => {
                    console.error("그룹 정보 불러오기 실패", err);
                });
        } catch (e) {
            console.error("토큰 디코딩 실패", e);
        }
    }, []);

    return (
        <Box sx={{ backgroundColor: '#f9f9f9', minHeight: '100vh', py: 4 }}>
            <Box sx={{ maxWidth: 1000, mx: 'auto', px: 2 }}>

                {/* 마이 그룹 */}
                <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 2, mb: 4 }}>
                    {/* 마이그룹 상단: 타이틀 + 버튼 묶음 */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#bbdefb',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            mb: 2
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                            마이 그룹
                        </Typography>
                        <IconButton color="primary" onClick={() => navigate("/AddGroup")}>
                            <AddIcon />
                        </IconButton>
                    </Box>

                    {/* 슬라이드 가능한 박스*/}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            overflowX: 'auto',
                            pb: 1,
                            '&::-webkit-scrollbar': { height: 8 },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#90caf9', borderRadius: 4 }
                        }}
                    >
                        {myGroups.map(group => (
                            <Box key={group.group_no} sx={{ flex: '0 0 auto' }}>
                                <MyGroupCard group={group} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* 공개 그룹 */}
                <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 2 }}>
                    {/* 공개 그룹 상단 헤더 */}
                    <Box
                        sx={{
                            backgroundColor: '#bbdefb',
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            mb: 2
                        }}
                    >
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            공개 그룹
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {publicGroups.map(group => (
                            <Grid item xs={12} sm={6} key={group.group_no}>
                                <GroupListItem group={group} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

            </Box>
        </Box>
    );
}

export default Group;
