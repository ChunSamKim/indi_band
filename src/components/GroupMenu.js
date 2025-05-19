import React ,{ useState }from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SettingsIcon from '@mui/icons-material/Settings';

function GroupMenu({
    isRightMenuCollapsed,
    setIsRightMenuCollapsed,
    menuExpanded,
    setMenuExpanded,
    memberMenuOpen,
    handleToggleMemberMenu,
    memberList,
    userAuth,
    currentUserId,
    removeFromGroup,
    changeUserRole // 권한 변경 함수
}) {

    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);


    if (isRightMenuCollapsed) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    right: '5%',
                    top: 100,
                    width: 60,
                    height: 36,
                    backgroundColor: '#64b5f6',
                    color: '#fff',
                    borderRadius: 2,
                    boxShadow: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 1000,
                    transition: 'all 0.3s ease-in-out'
                }}
                onClick={() => setIsRightMenuCollapsed(false)}
            >
                <Typography variant="body2" fontWeight="bold">메뉴</Typography>
            </Box>
        );
    }

    const handleOpenMenu = (event, userId) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(userId);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    const handleRoleChange = (role) => {
        if (selectedUser) changeUserRole(selectedUser, role);
        handleCloseMenu();
    };


    return (
        <Box sx={{
            position: 'fixed',
            right: '5%',
            top: 100,
            width: 350, 
            backgroundColor: '#e3f2fd',
            borderRadius: 2,
            boxShadow: 2,
            p: 1.5,
            zIndex: 1000
        }}>
            <Typography
                variant="subtitle1"
                sx={{
                    mb: 1,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    textAlign: 'center',
                }}
            >
                그룹 메뉴
            </Typography>
            <Box
                sx={{
                    position: 'absolute',
                    top: 6,
                    right: 8,
                    width: 36,
                    height: 28,
                    cursor: 'pointer',
                    zIndex: 1001
                }}
                onClick={() => setIsRightMenuCollapsed(true)}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 14,
                        height: 2,
                        backgroundColor: '#555',
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: '#000'
                        }
                    }}
                />
            </Box>

            <Typography
                variant="body2"
                onClick={() => setMenuExpanded(prev => !prev)}
                sx={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: '#1976d2',
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                    mb: menuExpanded ? 1 : 0
                }}
            >
                {menuExpanded ? '▲ 메뉴 닫기' : '▼ 메뉴 열기'}
            </Typography>

            {menuExpanded && (
                <Box
                    onClick={handleToggleMemberMenu}
                    sx={{
                        border: '1px solid #00e5ff',
                        borderRadius: 3,
                        color: '#0091ea',
                        textAlign: 'center',
                        py: 0.6,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: '#b3e5fc'
                        }
                    }}
                >
                    그룹원 목록
                </Box>
            )}

            {menuExpanded && memberMenuOpen && (
                <Box
                    sx={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        mt: 1,
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                        p: 1
                    }}
                >
                    {memberList.map((member, idx) => {
                        let roleLabel = "일반 사용자";
                        if (member.group_auth === 'O') roleLabel = "관리자";
                        else if (member.group_auth === 'M') roleLabel = "매니저";

                        return (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    py: 0.8,
                                    px: 1,
                                    borderBottom: idx !== memberList.length - 1 ? '1px solid #eee' : 'none',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <img
                                        src={`http://localhost:3000/${member.user_imgpath}`}
                                        alt="프로필"
                                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.85rem' }}>
                                            {member.user_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#888' }}>
                                            {roleLabel}
                                        </Typography>
                                    </Box>
                                </Box>

                                {userAuth === 'O' && member.user_id !== currentUserId && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(e) => handleOpenMenu(e, member.user_id)} // 메뉴 열기
                                        >
                                            <SettingsIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeFromGroup(member.user_id)}
                                        >
                                            <BlockIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}


                            </Box>
                        );
                    })}
                </Box>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={() => handleRoleChange('M')}>매니저로 설정</MenuItem>
                <MenuItem onClick={() => handleRoleChange('N')}>일반 사용자로 설정</MenuItem>
            </Menu>
        </Box>
    );
}

export default GroupMenu;
