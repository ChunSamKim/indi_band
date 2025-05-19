import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardMedia, CardContent,
  Grid, IconButton
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { jwtDecode } from 'jwt-decode';
import FeedDetailModal from './FeedDetailModal';
import FeedEditModal from './FeedEditModal';

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const userId = jwtDecode(token).tokenId;

    fetch(`http://localhost:3000/feed/my-posts?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  const fetchComments = (feed_no) => {
    const token = localStorage.getItem("token");
    const userId = jwtDecode(token).tokenId;

    fetch(`http://localhost:3000/feed/comments?feed_no=${feed_no}&user_id=${userId}`)
      .then(res => res.json())
      .then(data => setComments(data));
  };

  const handleOpenModal = (post) => {
    setSelectedPost(post);
    fetchComments(post.feed_no);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setThumbsSwiper(null);
    setComments([]);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    const userId = jwtDecode(token).tokenId;

    fetch("http://localhost:3000/feed/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feed_no: selectedPost.feed_no,
        comment_contents: newComment,
        user_id: userId
      })
    }).then(() => {
      setNewComment('');
      fetchComments(selectedPost.feed_no);
    });
  };

  const submitReply = (parentCommentNo) => {
    const token = localStorage.getItem("token");
    const userId = jwtDecode(token).tokenId;

    if (!replyContent.trim()) return;

    fetch("http://localhost:3000/feed/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feed_no: selectedPost.feed_no,
        user_id: userId,
        comment_contents: replyContent,
        parent_comment_no: parentCommentNo
      })
    }).then(() => {
      setReplyContent('');
      setReplyTarget(null);
      fetchComments(selectedPost.feed_no);
    });
  };

  const toggleCommentLike = (commentNo) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const userId = jwtDecode(token).tokenId;

    fetch("http://localhost:3000/feed/comment/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_no: commentNo, user_id: userId }),
    }).then(() => {
      setComments(prev =>
        prev.map(comment => {
          if (comment.comment_no === commentNo) {
            const updatedLiked = !comment.liked;
            return {
              ...comment,
              liked: updatedLiked,
              like_count: comment.like_count + (updatedLiked ? 1 : -1)
            };
          }
          return { ...comment };
        })
      );
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>내가 쓴 글</Typography>
      <Grid container spacing={2}>
        {posts.map(post => (
          <Grid item xs={12} sm={6} md={4} key={post.feed_no}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <div onClick={() => handleOpenModal(post)} style={{ cursor: 'pointer' }}>
                {post.image_paths.length > 0 && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={`http://localhost:3000/${post.image_paths[0]}`}
                    alt="피드 이미지"
                  />
                )}
                <CardContent>
                  <Typography variant="h6" noWrap>{post.feed_title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ❤️ {post.like_count} | 💬 {post.comment_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.feed_cdate).toLocaleString()}
                  </Typography>
                </CardContent>
              </div>
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => {
                  setEditPost(post);
                  setEditModalOpen(true);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 상세 보기 모달 */}
      {selectedPost && (
        <FeedDetailModal
          feed={selectedPost}
          onClose={handleCloseModal}
          thumbsSwiper={thumbsSwiper}
          setThumbsSwiper={setThumbsSwiper}
          comments={comments}
          fetchComments={fetchComments}
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmitComment={handleSubmitComment}
          replyTarget={replyTarget}
          setReplyTarget={setReplyTarget}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          submitReply={submitReply}
          toggleCommentLike={toggleCommentLike}
        />
      )}
      

      {/* 수정 모달 */}
      {editModalOpen && editPost && (
        
        <FeedEditModal
          feed={editPost}
          thumbsSwiper={thumbsSwiper}
          setThumbsSwiper={setThumbsSwiper}
          onClose={() => {
            setEditModalOpen(false);
            setEditPost(null);
          }}
          onUpdated={(updatedFeed) => {
            setPosts(prev =>
              prev.map(post =>
                post.feed_no === updatedFeed.feed_no ? updatedFeed : post
              )
            );
            setEditModalOpen(false);
            setEditPost(null);
          }}
        />
      )}



    </Box>
  );
}

export default MyPosts;
