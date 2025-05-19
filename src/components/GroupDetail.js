import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../css/calendar.css';
import '../css/Feed.css';
import GroupIcon from '@mui/icons-material/Group';
import FeedDetailModal from './FeedDetailModal';

import { format, parse, startOfWeek, getDay } from 'date-fns';
import ko from 'date-fns/locale/ko';
import { jwtDecode } from 'jwt-decode';

import {
    Box, Typography, Divider, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Button, Avatar, IconButton,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BlockIcon from '@mui/icons-material/Block';
import SettingsIcon from '@mui/icons-material/Settings';

import Feed from "./Feed";
import NewFeed from "./NewFeed";
import GroupMenu from "./GroupMenu";
import InviteModal from "./GroupInviteModal";


const locales = { ko };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales,
});
//제발 나중에 상세, 플랜, 피드 분리하자
function GroupDetail() {
    const [searchParams] = useSearchParams();
    const groupNo = searchParams.get("group_no");

    const [openFeedModal, setOpenFeedModal] = useState(false);
    const [newFeed, setNewFeed] = useState({ title: "", contents: "" });

    const [images, setImages] = useState([]); // FileList 저장
    const [currentUserId, setCurrentUserId] = useState(null);
    const [myFeedMode, setMyFeedMode] = useState(false);

    const [tab, setTab] = useState("info");
    const [groupInfo, setGroupInfo] = useState(null);
    const [userAuth, setUserAuth] = useState(null);
    const [events, setEvents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", start: null, end: null });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [tagList, setTagList] = useState([]);
    const [editEvent, setEditEvent] = useState(null);
    const [memberList, setMemberList] = useState([]);  // 그룹원 리스트
    const [memberMenuOpen, setMemberMenuOpen] = useState(false); // 그룹원 메뉴
    const [menuExpanded, setMenuExpanded] = useState(false); // 소메뉴 토글
    const [inviteOpen, setInviteOpen] = useState(false); // 초대메뉴 오픈
    const [isRightMenuCollapsed, setIsRightMenuCollapsed] = useState(false); // 접기/펼치기

    //공개/비공개
    const [newGroupStatus, setNewGroupStatus] = useState(groupInfo?.group_status || 'PUBLIC');
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);

    const [groupImage, setGroupImage] = useState(null);// 그룹 이미지
    const [editImageOpen, setEditImageOpen] = useState(false);// 그룹 이미지 모달 
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);


    const [editMode, setEditMode] = useState(false);  // 그룹정보 수정
    const [editName, setEditName] = useState('');
    const [editComment, setEditComment] = useState('');

    const [selectedFeed, setSelectedFeed] = useState(null); // 피드 눌러서 상세정보 모달띄우기
    const [modalOpen, setModalOpen] = useState(false);


    const [topFeeds, setTopFeeds] = useState([]); //인기피드



    const eventColors = ['#FFB6C1', '#B0E0E6', '#E6E6FA', '#FFDAB9', '#D8BFD8', '#C1FFC1'];


    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || !groupNo) return;

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.tokenId;
            setCurrentUserId(userId);

            fetch(`http://localhost:3000/group/detail?group_no=${groupNo}&user_id=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.groupInfo) setGroupInfo(data.groupInfo);
                    if (data.userAuth) setUserAuth(data.userAuth);
                    if (data.tagList) setTagList(data.tagList);

                    if (data.groupInfo?.group_imgpath) {
                        setGroupImage(`http://localhost:3000/${data.groupInfo.group_imgpath}`);
                        setGroupInfo(data.groupInfo);
                        setEditName(data.groupInfo.group_name || '');
                        setEditComment(data.groupInfo.group_comment || '');
                    }


                    if (Array.isArray(data.planRows)) {
                        const mapped = data.planRows.map((plan, idx) => {
                            const start = new Date(plan.start_date);
                            const end = new Date(plan.end_date);
                            console.log(`Event ${idx}:`, start, end, plan.plan_title);

                            return {
                                id: plan.plan_no,
                                title: plan.plan_title,
                                start: new Date(plan.start_date),
                                end: new Date(plan.end_date),
                                allDay: true
                            };
                        });
                        setEvents(mapped);
                    }
                });
        } catch (e) {
            console.error("토큰 디코딩 실패", e);
        }
    }, [groupNo]);

    useEffect(() => {
        if (groupInfo?.group_status) setNewGroupStatus(groupInfo.group_status);
    }, [groupInfo]);

    //인기피드 가져오기
    useEffect(() => {
        if (!groupNo) return;

        const token = localStorage.getItem('token');
        const userId = token ? jwtDecode(token).tokenId : null;

        fetch(`http://localhost:3000/feed/top5?group_no=${groupNo}&user_id=${userId || 0}`)
            .then(res => res.json())
            .then(data => {
                setTopFeeds(data);
            })
            .catch(err => console.error("인기 피드 가져오기 실패:", err));
    }, [groupNo]);


    /*const handleAddFeed = () => {
        const token = localStorage.getItem("token");
        if (!token) return alert("로그인이 필요합니다.");

        const decoded = jwtDecode(token);
        const userId = decoded.tokenId;

        if (!newFeed.title.trim() || !newFeed.contents.trim()) {
            alert("제목과 내용을 입력하세요.");
            return;
        }

        const formData = new FormData();
        formData.append("group_no", groupNo);
        formData.append("maker_id", userId);
        formData.append("feed_title", newFeed.title);
        formData.append("feed_contents", newFeed.contents);

        images.forEach((img, idx) => {
            formData.append("images", img); // 이미지 배열은 동일한 key로
        });

        fetch("http://localhost:3000/feed/add", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === "success") {
                    alert("피드가 등록되었습니다.");
                    setOpenFeedModal(false);
                    setNewFeed({ title: "", contents: "" });
                    setImages([]);
                    window.location.reload();
                } else {
                    alert("등록 실패");
                }
            })
            .catch(err => {
                console.error("등록 실패:", err);
                alert("오류 발생");
            });
    };*/


    const eventPropGetter = (event) => {
        //const color = eventColors[event.id % eventColors.length];
        const fallbackColor = '#cccccc';

        let color = fallbackColor;
        if (event.id !== undefined && event.id !== null) {
            const index = Number(event.id) % eventColors.length;
            if (!isNaN(index)) {
                color = eventColors[index];
            }
        }
        return {
            style: {
                backgroundColor: color,
                color: '#333',
                padding: '1px',
                borderRadius: '5px',
                fontSize: '12px',
                border: '1px solid #ccc'
            }
        };
    };

    //시간 포맷 변환
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const created = new Date(timestamp);
        const diff = now - created;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };

    const handleSelectSlot = ({ start, end }) => {
        setNewEvent({ title: "", start, end });
        setOpenModal(true);
    };

    //좋아요 누르기/취소하기
    const handleToggleLike = async (feedNo) => {
        const token = localStorage.getItem("token");
        if (!token) return alert("로그인이 필요합니다.");
        const userId = jwtDecode(token).tokenId;

        try {
            const res = await fetch("http://localhost:3000/feed/toggle-like", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feed_no: feedNo, user_id: userId })
            });
            const data = await res.json();
            if (data.message === "success") {
                // 좋아요 상태를 업데이트
                setTopFeeds(prev =>
                    prev.map(feed =>
                        feed.feed_no === feedNo
                            ? { ...feed, liked: !feed.liked, like_count: feed.liked ? feed.like_count - 1 : feed.like_count + 1 }
                            : feed
                    )
                );
            }
        } catch (err) {
            console.error("좋아요 실패:", err);
        }
    };

    const handleAddEvent = () => {
        const formatDate = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date - offset).toISOString().slice(0, 19).replace('T', ' ');
        };


        if (!newEvent.title) return;
        if (userAuth !== 'O' && userAuth !== 'M') {
            alert("일정 추가는 운영자만 가능합니다.");
            return;
        }

        fetch("http://localhost:3000/plan/add", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_no: groupNo,
                plan_title: newEvent.title,
                plan_contents: newEvent.content || '',
                start_date: formatDate(newEvent.start),
                end_date: formatDate(newEvent.end)
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    alert("일정 등록 완료");
                    setOpenModal(false);
                    fetchPlans();
                } else {
                    alert("등록 실패");
                }
            });
    };

    const fetchPlans = () => {
        fetch(`http://localhost:3000/plan/list?group_no=${groupNo}`)
            .then(res => res.json())
            .then(data => {
                const mapped = data.map((plan, idx) => {
                    return {
                        id: plan.plan_no,
                        title: plan.plan_title,
                        contents: plan.plan_contents,
                        start: new Date(plan.start_date),
                        end: new Date(plan.end_date),
                        allDay: true
                    };
                });
                setEvents([...mapped]);
            });
    };

    const handleSelectEvent = (event) => {  // 플랜 추가/ 수정 
        if (userAuth === 'O') {
            setEditEvent(event);
            setOpenModal(true);
        } else {
            setSelectedEvent(event); // 그냥 보기 모달
            setOpenViewModal(true);
        }
    };

    const fetchMemberList = () => { // 멤버리스트 가져오기
        fetch(`http://localhost:3000/group/members?group_no=${groupNo}`)
            .then(res => res.json())
            .then(data => setMemberList(data));
    };

    const handleToggleMemberMenu = () => {  // 그룹원 보기 
        if (!memberMenuOpen) {
            // 열려고 할 때만 fetch
            fetchMemberList();
        }
        console.log(memberList);
        setMemberMenuOpen(prev => !prev);
    };

    const openChatWith = (targetUserId) => {
        // 채팅방 생성 또는 이동 로직
        console.log("채팅 시작:", targetUserId);
    };

    const removeFromGroup = (targetUserId) => {
        if (window.confirm("정말로 이 그룹원를 강퇴하시겠습니까?")) {
            fetch("http://localhost:3000/group/kick", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_no: groupNo, target_user_id: targetUserId })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message === "success") {
                        alert("강퇴되었습니다.");
                        // 리스트 갱신
                        if (memberMenuOpen) fetchMemberList();
                    }
                });
        }
    };

    //가입요청
    const handleJoinRequest = async () => {
        const token = localStorage.getItem("token");
        if (!token) return alert("로그인이 필요합니다.");
        const { tokenId } = jwtDecode(token);

        const res = await fetch("http://localhost:3000/notification/join-request", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_no: groupNo,
                user_id: tokenId
            })
        });
        const data = await res.json();

        if (data.message === 'success') {
            alert("가입 요청이 전송되었습니다.");
        } else {
            alert("요청 실패: " + data.message);
        }
    };


    // 그룹원 권한 변경
    const changeUserRole = async (targetUserId, newRole) => {
        try {
            const res = await fetch("http://localhost:3000/group/change-role", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_no: groupNo,
                    user_id: targetUserId,
                    group_auth: newRole  // "M" 또는 "N"
                })
            });

            const data = await res.json();
            if (data.message === "success") {
                alert("권한이 변경되었습니다.");
                fetchMemberList(); // 변경 후 목록 갱신
            } else {
                alert("변경 실패: " + data.message);
            }
        } catch (err) {
            console.error("권한 변경 오류:", err);
            alert("오류 발생");
        }
    };


    return (
        <Box sx={{ backgroundColor: '#FFFFFF', minHeight: '100vh', py: 1 }}>
            <Box sx={{ maxWidth: 800, mx: 'auto', backgroundColor: '#F0F8FF', p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="center" gap={2} mb={3}>
                    <Button variant={tab === 'info' ? "contained" : "outlined"} onClick={() => setTab('info')}>그룹 소개</Button>
                    <Button variant={tab === 'calendar' ? "contained" : "outlined"} onClick={() => setTab('calendar')}>그룹 일정</Button>
                    <Button variant={tab === 'feed' ? "contained" : "outlined"} onClick={() => setTab('feed')}>그룹 피드</Button>
                </Box>

                {tab === 'info' && groupInfo && (
                    <>
                        {/* 그룹 이미지 + 설정 버튼 */}
                        <Box display="flex" justifyContent="center" mb={2}>
                            <Box sx={{ position: 'relative', width: 100, height: 100 }}>
                                <Avatar
                                    src={groupImage || "http://localhost:3000/uploads/default_group.png"}
                                    sx={{ width: '100%', height: '100%', border: '2px solid #ccc' }}
                                />
                                {(userAuth === 'O' || userAuth === 'M') && (
                                    <IconButton
                                        onClick={() => setEditImageOpen(true)}
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            transform: 'translate(25%, 25%)',
                                            backgroundColor: 'white',
                                            boxShadow: 1,
                                            border: '1px solid #ccc',
                                            width: 32,
                                            height: 32,
                                            '&:hover': { backgroundColor: '#f5f5f5' }
                                        }}
                                    >
                                        <SettingsIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        {/* 그룹명 및 소개 */}
                        <Box textAlign="center" mb={3}>
                            {editMode ? (
                                <>
                                    <TextField
                                        fullWidth
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        label="그룹명"
                                        sx={{ mb: 1 }}
                                    />
                                    <TextField
                                        fullWidth
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        label="소개 내용"
                                        multiline
                                        rows={2}
                                    />
                                </>
                            ) : (
                                <>
                                    <Typography variant="h5" fontWeight="bold">{groupInfo.group_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {groupInfo.group_comment || "그룹 소개 문구가 없습니다."}
                                    </Typography>
                                </>
                            )}
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                            <GroupIcon sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2">{groupInfo.member_count ?? 0}</Typography>
                        </Box>
                        {/* 수정 버튼 */}
                        {userAuth === 'O' && (
                            <Box display="flex" justifyContent="center" mb={2}>
                                <Button
                                    variant={editMode ? "outlined" : "contained"}
                                    onClick={() => {
                                        if (editMode) {
                                            fetch('http://localhost:3000/group/updateText', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    group_no: groupNo,
                                                    group_name: editName,
                                                    group_comment: editComment
                                                })
                                            })
                                                .then(res => res.json())
                                                .then(data => {
                                                    if (data.message === 'success') {
                                                        alert("그룹 정보가 수정되었습니다.");
                                                        setGroupInfo(prev => ({
                                                            ...prev,
                                                            group_name: editName,
                                                            group_comment: editComment
                                                        }));
                                                        setEditMode(false);
                                                    } else {
                                                        alert("수정 실패");
                                                    }
                                                });
                                        } else {
                                            setEditMode(true);
                                        }
                                    }}
                                >
                                    {editMode ? "저장" : "그룹 정보 수정"}
                                </Button>
                            </Box>

                        )}

                        {/* 그룹 정보 요약 */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>그룹 정보</Typography>
                            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                                <Typography variant="body2">
                                    <strong>내 정보:</strong>{" "}
                                    {(() => {
                                        try {
                                            const token = localStorage.getItem("token");
                                            if (!token) return "이름 없음";
                                            const decoded = jwtDecode(token);
                                            return decoded.tokenName || "이름 없음";
                                        } catch (e) {
                                            return "이름 없음";
                                        }
                                    })()} (
                                    {userAuth === 'O' ? '관리자' : userAuth === 'M' ? '매니저' : userAuth === 'N' ? '일반 사용자' : '권한 없음'})
                                </Typography>
                                <Typography variant="body2">
                                    <strong>개설자:</strong> {groupInfo.user_name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>그룹 상태:</strong> {groupInfo.group_status === 'PUBLIC' ? '공개' : '비공개'}
                                </Typography>
                            </Box>
                        </Box>


                        {/* 태그 */}
                        {tagList.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2"># 태그</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {tagList.map((tag, idx) => (
                                        <Box key={idx} sx={{ backgroundColor: '#eee', px: 1, py: 0.5, borderRadius: 1 }}>
                                            #{tag}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {userAuth === null && groupInfo.group_status === 'PUBLIC' && (
                            <Box mt={3} textAlign="center">
                                <Button variant="contained" onClick={handleJoinRequest}>
                                    그룹 가입 요청
                                </Button>
                            </Box>
                        )}
                        {userAuth === 'O' && (
                            <FormControl fullWidth sx={{ mt: 3 }}>
                                <InputLabel id="group-status-label">공개 여부</InputLabel>
                                <Select
                                    labelId="group-status-label"
                                    value={newGroupStatus}
                                    label="공개 여부"
                                    onChange={(e) => {
                                        const selectedValue = e.target.value;
                                        if (groupInfo?.group_status !== selectedValue) {
                                            setNewGroupStatus(selectedValue);      // 상태 변경
                                            setShowStatusConfirm(true);            // 확인 모달 띄움
                                        }
                                    }}
                                >
                                    <MenuItem value="PUBLIC">공개</MenuItem>
                                    <MenuItem value="PRIVATE">비공개</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {(userAuth === 'O' || userAuth === 'M') && (
                            <Box mt={4} textAlign="center">
                                <Button variant="outlined" onClick={() => setInviteOpen(true)}>
                                    그룹 초대
                                </Button>
                            </Box>
                        )}

                        {/* 인기 피드 TOP 5 */}
                        <Box sx={{ mt: 6, px: 2, py: 3, backgroundColor: '#fdfdfd', borderRadius: 2, boxShadow: '0 0 6px rgba(0,0,0,0.05)' }}>
                            <Typography variant="h6" gutterBottom>🔥 인기 피드 Top 5</Typography>
                            {topFeeds.length === 0 && (
                                <Typography color="text.secondary">아직 인기 피드가 없습니다.</Typography>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {topFeeds.map(feed => (
                                    <Box
                                        key={feed.feed_no}
                                        className="feed-card"
                                        sx={{
                                            width: '85%',
                                            maxWidth: 550,
                                            margin: '20px auto',
                                            border: '1px solid #ddd',
                                            overflow: 'hidden',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'

                                        }}
                                        onClick={() => {
                                            setSelectedFeed(feed);
                                            setModalOpen(true);
                                        }}
                                        onClose={() => {
                                            setModalOpen(false);
                                            setSelectedFeed(null);
                                        }}

                                    >
                                        {/* 상단: 프로필 정보 */}
                                        <Box className="feed-header">
                                            <img
                                                src={`http://localhost:3000/${feed.user_imgpath}`}
                                                className="profile-image"
                                                alt="프로필"
                                            />
                                            <div className="user-info">
                                                <span className="username">{feed.user_name}</span>
                                                <span className="feed-time">{formatTimeAgo(feed.feed_cdate)}</span>
                                            </div>
                                        </Box>

                                        {/* 대표 이미지 */}
                                        {feed.image_paths.length > 0 && (
                                            <div className="feed-image-wrapper">
                                                {feed.image_paths[0].match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video
                                                        src={`http://localhost:3000/${feed.image_paths[0]}`}
                                                        className="feed-image"
                                                        controls
                                                        muted
                                                    />
                                                ) : (
                                                    <img
                                                        src={`http://localhost:3000/${feed.image_paths[0]}`}
                                                        className="feed-image"
                                                        alt="피드 이미지"
                                                    />
                                                )}
                                                {feed.image_paths.length > 1 && (
                                                    <div className="image-count-overlay">+{feed.image_paths.length - 1}</div>
                                                )}
                                            </div>
                                        )}

                                        {/* 하단: 좋아요 및 댓글 */}
                                        <div className="feed-stats">
                                            <div className="icon-group">
                                                <div className="ripple-container" onClick={() => handleToggleLike(feed.feed_no)}>
                                                    <img
                                                        src={feed.liked ? "/img/selectedHeart.png" : "/img/heart.png"}
                                                        alt="좋아요"
                                                        className="icon-image"
                                                    />
                                                </div>
                                                <span className="count">{feed.like_count}</span>
                                            </div>
                                            <div className="icon-group">
                                                <img src="/img/chat.png" alt="댓글" className="icon-image" />
                                                <span className="count">{feed.comment_count}</span>
                                            </div>
                                        </div>
                                    </Box>
                                ))}
                            </Box>
                        </Box>


                    </>
                )}





                {tab === 'calendar' && (
                    <>
                        <Typography variant="h6" gutterBottom>그룹 일정</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Calendar

                            selectable
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            views={['month']}
                            style={{ height: 500, backgroundColor: "#FFFFFF" }}
                            messages={{
                                today: '오늘', previous: '이전 달', next: '다음 달',
                                month: '월', week: '주', day: '일', agenda: '일정 보기'
                            }}
                            formats={{
                                dateFormat: "d",
                                dayFormat: "M월 d일",
                                dayHeaderFormat: "M월 d일 (eee)",
                                monthHeaderFormat: "yyyy년 M월",
                                agendaHeaderFormat: ({ start, end }, _, local) =>
                                    `${local.format(start, "yyyy년 M월 d일")} ~ ${local.format(end, "yyyy년 M월 d일")}`,
                                weekRangeFormat: ({ start, end }, _, local) =>
                                    `${local.format(start, 'M월 d일')} ~ ${local.format(end, 'M월 d일')}`,
                                dayRangeHeaderFormat: ({ start, end }, _, local) =>
                                    `${local.format(start, 'M월 d일')} ~ ${local.format(end, 'M월 d일')}`
                            }}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            eventPropGetter={eventPropGetter}
                        />
                    </>
                )}

                {tab === 'feed' && (
                    <>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" gutterBottom>그룹 피드</Typography>
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        if (userAuth === "MEMBER") {
                                            alert("권한이 없습니다.");
                                        } else {
                                            setOpenFeedModal(true);
                                        }
                                    }}
                                >
                                    + 피드 추가
                                </Button>
                                <Button
                                    variant="outlined"
                                    color={myFeedMode ? "secondary" : "inherit"}
                                    onClick={() => setMyFeedMode(prev => !prev)}
                                >
                                    {myFeedMode ? "전체 피드 보기" : "내 피드 보기"}
                                </Button>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />
                        <Feed groupNo={groupNo} userId={myFeedMode ? jwtDecode(localStorage.getItem("token")).tokenId : null} />

                    </>
                )}
                <NewFeed
                    open={openFeedModal}
                    onClose={() => setOpenFeedModal(false)}
                    groupNo={groupNo}
                    onPostSuccess={() => {
                        setOpenFeedModal(false);
                        window.location.reload();
                    }}
                />

            </Box>

            {/* 상세 보기 모달 */}
            <Dialog open={openViewModal} onClose={() => setOpenViewModal(false)}>
                <DialogTitle>일정 상세</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="h6">{selectedEvent?.title}</Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        {selectedEvent?.content || "내용 없음"}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpenViewModal(false);

                    }}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 일정 추가 모달 */}
            <Dialog open={openModal} onClose={() => {
                setOpenModal(false);
                setNewEvent({ title: "", start: null, end: null });
                setEditEvent(null);
            }}>
                <DialogTitle>{editEvent ? "일정 수정" : "일정 추가"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="일정 제목"
                        fullWidth
                        value={editEvent ? editEvent.title : newEvent.title}
                        onChange={(e) => {
                            if (editEvent) {
                                setEditEvent(prev => ({ ...prev, title: e.target.value }));
                            } else {
                                setNewEvent(prev => ({ ...prev, title: e.target.value }));
                            }
                        }}
                    />
                    <TextField
                        margin="dense"
                        label="일정 내용"
                        fullWidth
                        multiline
                        rows={4}
                        value={editEvent?.content || newEvent.content || ""}
                        onChange={(e) => {
                            if (editEvent) {
                                setEditEvent(prev => ({ ...prev, content: e.target.value }));
                            } else {
                                setNewEvent(prev => ({ ...prev, content: e.target.value }));
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    {editEvent && (
                        <Button
                            onClick={() => {
                                fetch(`http://localhost:3000/plan/delete`, {
                                    method: "POST",
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ plan_no: editEvent.id })
                                })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.message === "success") {
                                            alert("삭제 완료");
                                            setOpenModal(false);
                                            setEditEvent(null);
                                            fetchPlans();
                                        } else {
                                            alert("삭제 실패");
                                        }
                                    });
                            }}
                            color="error"
                        >
                            삭제하기
                        </Button>
                    )}

                    <Button onClick={() => {
                        setOpenModal(false);
                        setEditEvent(null);
                    }}>취소</Button>

                    <Button
                        variant="contained"
                        onClick={() => {
                            const formatDate = (date) => {
                                const offset = date.getTimezoneOffset() * 60000;
                                return new Date(date - offset).toISOString().slice(0, 19).replace('T', ' ');
                            };

                            if (editEvent) {
                                // 수정 요청
                                fetch("http://localhost:3000/plan/edit", {
                                    method: "POST",
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        plan_no: editEvent.id,
                                        plan_title: editEvent.title,
                                        plan_contents: editEvent.content || "",
                                        start_date: formatDate(editEvent.start),
                                        end_date: formatDate(editEvent.end)
                                    })
                                })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.message === "success") {
                                            alert("수정 완료");
                                            setOpenModal(false);
                                            setEditEvent(null);
                                            fetchPlans();
                                        } else {
                                            alert("수정 실패");
                                        }
                                    });
                            } else {
                                // 새 일정 등록
                                handleAddEvent();
                            }
                        }}
                    >
                        저장
                    </Button>
                </DialogActions>
            </Dialog>


            <GroupMenu
                isRightMenuCollapsed={isRightMenuCollapsed}
                setIsRightMenuCollapsed={setIsRightMenuCollapsed}
                menuExpanded={menuExpanded}
                setMenuExpanded={setMenuExpanded}
                memberMenuOpen={memberMenuOpen}
                handleToggleMemberMenu={handleToggleMemberMenu}
                memberList={memberList}
                userAuth={userAuth}
                currentUserId={currentUserId}
                openChatWith={openChatWith}
                removeFromGroup={removeFromGroup}
                changeUserRole={changeUserRole}
            />

            <InviteModal
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                groupNo={groupNo}
            />





            <Dialog open={showStatusConfirm} onClose={() => setShowStatusConfirm(false)}>
                <DialogTitle>공개 상태 변경</DialogTitle>
                <DialogContent>
                    <Typography>정말로 그룹의 공개 상태를 변경하시겠습니까?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowStatusConfirm(false)}>취소</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            try {
                                const res = await fetch("http://localhost:3000/group/updateStatus", {
                                    method: "POST",
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        group_no: groupNo,
                                        group_status: newGroupStatus
                                    })
                                });
                                const data = await res.json();
                                if (data.message === "success") {
                                    alert("그룹 공개 여부가 변경되었습니다.");
                                    setGroupInfo(prev => ({ ...prev, group_status: newGroupStatus }));
                                } else {
                                    alert("변경 실패: " + data.message);
                                }
                            } catch (err) {
                                console.error("공개 상태 변경 실패:", err);
                            } finally {
                                setShowStatusConfirm(false);
                            }
                        }}
                    >
                        예
                    </Button>
                </DialogActions>
            </Dialog>




            {/* 그룹 프로필 이미지 수정용 모달 */}
            <Dialog open={editImageOpen} onClose={() => setEditImageOpen(false)}>
                <DialogTitle>그룹 이미지 변경</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setSelectedImage(file);
                                    setPreviewImage(URL.createObjectURL(file));
                                }
                            }}
                        />

                        {previewImage && (
                            <Box mt={2} textAlign="center">
                                <Typography variant="subtitle2" gutterBottom>미리보기</Typography>
                                <Box
                                    component="img"
                                    src={previewImage}
                                    alt="미리보기"
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        border: '2px solid #ccc',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditImageOpen(false);
                        setPreviewImage(null);
                        setSelectedImage(null);
                    }}>
                        취소
                    </Button>

                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!selectedImage) return alert("이미지를 선택하세요.");

                            const formData = new FormData();
                            formData.append("group_no", groupNo);
                            formData.append("group_img", selectedImage);

                            const res = await fetch("http://localhost:3000/group/updateImage", {
                                method: "POST",
                                body: formData
                            });

                            const data = await res.json();
                            if (data.message === "success") {
                                alert("이미지가 변경되었습니다.");
                                setGroupImage(`http://localhost:3000/${data.group_imgpath}`);
                                setEditImageOpen(false);
                                setPreviewImage(null);
                                setSelectedImage(null);
                            } else {
                                alert("변경 실패");
                            }
                        }}
                    >
                        변경하기
                    </Button>
                </DialogActions>
            </Dialog>


            {modalOpen && selectedFeed && (
                <FeedDetailModal
                    feed={selectedFeed}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedFeed(null);
                    }}
                    comments={[]} // 추후 구현 가능
                    newComment={""}
                    setNewComment={() => { }}
                    handleSubmitComment={() => { }}
                    replyTarget={null}
                    setReplyTarget={() => { }}
                    replyContent={""}
                    setReplyContent={() => { }}
                    submitReply={() => { }}
                    toggleCommentLike={() => { }}
                />
            )}

        </Box >

    );
}

export default GroupDetail;
