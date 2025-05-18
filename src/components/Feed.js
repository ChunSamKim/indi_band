// Feed.js
import { useEffect, useRef, useState } from "react";
import '../css/Feed.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { jwtDecode } from 'jwt-decode';
import FeedDetailModal from './FeedDetailModal';
import FeedEditModal from './FeedEditModal';
import heartImg from '../img/heart.png';
import selectedHeartImg from '../img/selectedHeart.png';
import chatImg from '../img/chat.png';

function Feed({ groupNo, userId }) {
  const [feeds, setFeeds] = useState([]);
  const [page, setPage] = useState(0);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editFeed, setEditFeed] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const loader = useRef(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const isMyFeed = (feed) => feed.maker_id === currentUserId;

  useEffect(() => {
    setFeeds([]);
    setPage(0);
  }, [groupNo, userId]);

  useEffect(() => {
    if (!groupNo) return;
    const token = localStorage.getItem('token');
    const decoded = jwtDecode(token);
    const currentUserId = decoded.tokenId;
    setCurrentUserId(currentUserId);

    let url = `http://localhost:3000/feed/list?group_no=${groupNo}&offset=${page * 10}&limit=10`;
    if (userId) url += `&user_id=${currentUserId}&only_mine=true`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const withLikeFlag = data.map(feed => ({ ...feed, liked: !!feed.liked }));
        setFeeds(prev => [...prev, ...withLikeFlag]);
      });
  }, [page, groupNo, userId]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setPage(prev => prev + 1);
    }, { threshold: 1 });

    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, []);

  const closeModal = () => {
    setSelectedFeed(null);
    setThumbsSwiper(null);
    setComments([]);
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

  const timeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const handleLike = (feedNo) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    const userId = jwtDecode(token).tokenId;

    const container = document.getElementById(`heart-wrap-${feedNo}`);
    if (container) {
      const ripple = document.createElement("div");
      ripple.className = "ripple-effect";
      container.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }

    setFeeds(prev =>
      prev.map(feed => {
        if (feed.feed_no === feedNo) {
          const updatedLiked = !feed.liked;
          fetch(`http://localhost:3000/feed/${updatedLiked ? "like" : "unlike"}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, feed_no: feedNo })
          });
          if (selectedFeed?.feed_no === feedNo) {
            setSelectedFeed(prev => ({
              ...prev,
              like_count: prev.like_count + (updatedLiked ? 1 : -1),
              liked: updatedLiked
            }));
          }
          return {
            ...feed,
            like_count: feed.like_count + (updatedLiked ? 1 : -1),
            liked: updatedLiked
          };
        }
        return feed;
      })
    );
  };

  const fetchComments = (feedNo) => {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).tokenId;

    fetch(`http://localhost:3000/feed/comments?feed_no=${feedNo}&user_id=${userId}`)
      .then(res => res.json())
      .then(data => setComments(data));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    const userId = jwtDecode(token).tokenId;

    fetch(`http://localhost:3000/feed/comment`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feed_no: selectedFeed.feed_no,
        comment_contents: newComment,
        user_id: userId
      })
    }).then(() => {
      setNewComment("");
      fetchComments(selectedFeed.feed_no);
    });
  };

  const submitReply = (parentCommentNo) => {
    const token = localStorage.getItem('token');
    const userId = jwtDecode(token).tokenId;

    if (!replyContent.trim()) return;

    fetch("http://localhost:3000/feed/comment", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feed_no: selectedFeed.feed_no,
        user_id: userId,
        comment_contents: replyContent,
        parent_comment_no: parentCommentNo
      })
    }).then(() => {
      setReplyContent("");
      setReplyTarget(null);
      fetchComments(selectedFeed.feed_no);
    });
  };

  const openModal = (feed) => {
    setSelectedFeed(feed);
    fetchComments(feed.feed_no);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {feeds.map(feed => (
        <div key={feed.feed_no} className="feed-card">
          <div className="feed-header">
            <img src={`http://localhost:3000/${feed.user_imgpath}`} alt="프로필" className="profile-image" />
            <div className="user-info">
              <span className="username">{feed.user_name}</span>
              <span className="feed-time">{timeAgo(feed.feed_cdate)}</span>
            </div>
            {isMyFeed(feed) && (
              <span
                className="edit-button"
                onClick={() => {
                  setEditFeed(feed);
                  setEditModalOpen(true);
                }}
              >
                수정하기
              </span>
            )}
          </div>

          <div className="feed-image-wrapper" onClick={() => openModal(feed)}>
            {feed.image_paths.length > 0 && (
              feed.image_paths[0].match(/\.(mp4|webm|ogg)$/i) ? (
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
                  alt="피드"
                />
              )
            )}
            {feed.image_paths.length > 1 && (
              <div className="image-count-overlay">+{feed.image_paths.length - 1}</div>
            )}
          </div>

          <div className="feed-stats">
            <div className="icon-group">
              <div id={`heart-wrap-${feed.feed_no}`} className="ripple-container">
                <img
                  src={feed.liked ? selectedHeartImg : heartImg}
                  alt="좋아요"
                  className="icon-image"
                  onClick={() => handleLike(feed.feed_no)}
                />
              </div>
              <span className="count">{feed.like_count}</span>
            </div>
            <div className="icon-group">
              <img src={chatImg} alt="댓글" className="icon-image" />
              <span className="count">{feed.comment_count}</span>
            </div>
          </div>
        </div>
      ))}

      <div ref={loader} style={{ height: "50px" }}></div>

      {selectedFeed && (
        <FeedDetailModal
          feed={selectedFeed}
          onClose={closeModal}
          comments={comments}
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

      {editModalOpen && editFeed && (
        <FeedEditModal
          feed={editFeed}
          onClose={() => {
            setEditModalOpen(false);
            setEditFeed(null);
          }}
          setFeeds={setFeeds}
        />
      )}
    </div>
  );
}

export default Feed;
