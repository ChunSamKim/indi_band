import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import heartImg from '../img/heart.png';
import selectedHeartImg from '../img/selectedHeart.png';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

function FeedDetailModal({
  feed,
  onClose,
  comments,
  newComment,
  setNewComment,
  handleSubmitComment,
  replyTarget,
  setReplyTarget,
  replyContent,
  setReplyContent,
  submitReply,
  toggleCommentLike
}) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          width: '43%',
          height: '56%',
          background: 'white',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        {/* 왼쪽 이미지, 피드 내용 */}
        <div style={{ flex: 1.1, padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <img
              src={`http://localhost:3000/${feed.user_imgpath}`}
              alt="프로필"
              style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }}
            />
            <span style={{ fontWeight: 'bold' }}>{feed.user_name}</span>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '260px',
              overflow: 'hidden',
              margin: '0 auto',
              position: 'relative',
              backgroundColor: '#777777'
            }}
          >
            <Swiper
              modules={[Navigation]}
              slidesPerView={1}
              spaceBetween={10}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              style={{ maxHeight: '260px' }}
            >
              {feed.image_paths.map((path, idx) => (
                <SwiperSlide key={idx}>
                  {/\.(mp4|webm|ogg)$/i.test(path) ? (
                    <video
                      src={`http://localhost:3000/${path}`}
                      style={{
                        width: '100%',
                        maxHeight: '260px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                      controls
                      muted
                    />
                  ) : (
                    <img
                      src={`http://localhost:3000/${path}`}
                      alt={`img-${idx}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '260px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>

            {/* 인디케이터 */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
              zIndex: 10
            }}>
              {feed.image_paths.map((_, idx) => (
                <span
                  key={idx}
                  style={{
                    width: activeIndex === idx ? 10 : 8,
                    height: activeIndex === idx ? 10 : 8,
                    borderRadius: '50%',
                    background: activeIndex === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                    boxShadow: activeIndex === idx ? '0 0 2px black' : 'none',
                    transition: 'all 0.2s'
                  }}
                ></span>
              ))}
            </div>
          </div>

          {/* 본문 영역 */}
          <div style={{
            marginTop: '15px',
            backgroundColor: '#f9f9f9',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
            height: '150px',
            justifyContent: 'flex-start'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>{feed.feed_title}</h4>
            <p style={{
              margin: 0,
              alignSelf: 'flex-start',
              paddingTop: '15px',
              fontSize: '14px',
              color: '#333'
            }}>
              {feed.feed_contents}
            </p>
          </div>
        </div>

        {/* 오른쪽 댓글 */}
        <div style={{
          flex: 0.8,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #ccc',
          padding: '20px 20px 0 20px'
        }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {comments.filter((c) => c.parent_comment_no === null).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>
                아직 댓글이 없습니다
              </p>
            ) : (
              comments
                .filter((c) => c.parent_comment_no === null)
                .map((comment) => (
                  <div key={comment.comment_no} style={{
                    marginBottom: '15px',
                    background: '#f0f8ff',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #d0e0ff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <img
                        src={`http://localhost:3000/${comment.user_imgpath}`}
                        alt=""
                        style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }}
                      />
                      <div>
                        <strong>{comment.writer_name}</strong>
                        <p>{comment.comment_contents}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12 }}>{timeAgo(comment.comment_cdate)}</span>
                          <span
                            style={{ fontSize: 12, color: 'blue', cursor: 'pointer' }}
                            onClick={() => setReplyTarget(comment.comment_no)}
                          >
                            답글 달기
                          </span>
                          <div
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => toggleCommentLike(comment.comment_no)}
                          >
                            <img
                              src={comment.liked ? selectedHeartImg : heartImg}
                              style={{ width: 16, height: 16, marginRight: 4 }}
                              alt="like"
                            />
                            <span style={{ fontSize: 12 }}>{comment.like_count}</span>
                          </div>
                        </div>

                        {/* 대댓글 */}
                        {comments
                          .filter((r) => r.parent_comment_no === comment.comment_no)
                          .map((reply) => (
                            <div key={reply.comment_no} style={{ marginTop: 10, paddingLeft: 20, borderLeft: '2px solid #eee' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <img
                                  src={`http://localhost:3000/${reply.user_imgpath}`}
                                  alt=""
                                  style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }}
                                />
                                <div>
                                  <strong>{reply.writer_name}</strong>
                                  <p>{reply.comment_contents}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12 }}>{timeAgo(reply.comment_cdate)}</span>
                                    <div
                                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                      onClick={() => toggleCommentLike(reply.comment_no)}
                                    >
                                      <img
                                        src={reply.liked ? selectedHeartImg : heartImg}
                                        style={{ width: 16, height: 16, marginRight: 4 }}
                                        alt="like"
                                      />
                                      <span style={{ fontSize: 12 }}>{reply.like_count}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        {replyTarget === comment.comment_no && (
                          <div style={{ marginTop: 10 }}>
                            <input
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="대댓글 입력"
                              style={{ width: '80%', padding: '4px 8px' }}
                            />
                            <button onClick={() => submitReply(comment.comment_no)}>등록</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* 댓글 입력창 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 0 0 0',
            marginTop: 'auto',
            borderTop: '1px solid #ddd',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              style={{
                flex: 8,
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSubmitComment}
              style={{
                flex: 2,
                padding: '10px 0',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedDetailModal;
