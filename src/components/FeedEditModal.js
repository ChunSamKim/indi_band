import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

function FeedEditModal({ feed, thumbsSwiper, setThumbsSwiper, onClose, onUpdated }) {
  const [editTitle, setEditTitle] = useState(feed.feed_title);
  const [editContents, setEditContents] = useState(feed.feed_contents);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    return () => {
      newImages.forEach(file => URL.revokeObjectURL(file));
    };
  }, [newImages]);

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

  const handleSave = () => {
    const formData = new FormData();
    formData.append("feed_no", feed.feed_no);
    formData.append("feed_title", editTitle);
    formData.append("feed_contents", editContents);

    removedImageIds.forEach(path => {
      formData.append("removed_image_paths[]", path);
    });

    newImages.forEach(file => {
      formData.append("new_images", file);
    });

    fetch("http://localhost:3000/feed/edit", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.message === "success") {
          alert("수정 완료");
          onUpdated({
            ...feed,
            feed_title: editTitle,
            feed_contents: editContents,
            image_paths: data.updated_image_paths || feed.image_paths
          });
        } else {
          alert("수정 실패");
        }
      });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="feed-header">
          <img
            src={`http://localhost:3000/${feed.user_imgpath}`}
            className="profile-image"
            alt="프로필"
          />
          <div className="user-info">
            <span className="username">{feed.user_name}</span>
            <span className="feed-time">{timeAgo(feed.feed_cdate)}</span>
          </div>
        </div>

        <Swiper
          key={thumbsSwiper?.el}
          modules={[Navigation, Thumbs]}
          thumbs={thumbsSwiper && !thumbsSwiper.destroyed ? { swiper: thumbsSwiper } : undefined}
          slidesPerView={1}
          spaceBetween={10}
          className="modal-swiper"
        >
          {feed.image_paths.map((path, idx) => (
            <SwiperSlide key={idx}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '260px',
                 height: '430px',  
                backgroundColor: '#f5f5f5'
              }}>
                {/\.(mp4|webm|ogg)$/i.test(path) ? (
                  <video
                    src={`http://localhost:3000/${path}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={`http://localhost:3000/${path}`}
                    className="modal-image"
                    alt={`img-${idx}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          slidesPerView={3}
          spaceBetween={10}
          className="thumb-swiper"
        >
          {feed.image_paths.map((path, idx) => {
            const activeImageCount = feed.image_paths.length - removedImageIds.length;
            const thisImageRemoved = removedImageIds.includes(path);

            return (
              <SwiperSlide key={`thumb-${idx}`} style={{ position: 'relative' }}>
                <img
                  src={`http://localhost:3000/${path}`}
                  className="thumb-image"
                  alt={`thumb-${idx}`}
                  style={{ opacity: thisImageRemoved ? 0.3 : 1 }}
                />
                {!thisImageRemoved && activeImageCount > 1 && (
                  <button
                    onClick={() => setRemovedImageIds(prev => [...prev, path])}
                    style={{
                      position: 'absolute', top: 5, right: 5,
                      background: 'rgba(255, 0, 0, 0.8)', color: 'white',
                      border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                      fontSize: '14px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0
                    }}
                  >×</button>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div style={{ marginTop: '10px' }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              setNewImages(prev => [...prev, ...files]);
            }}
          />
        </div>

        {newImages.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>추가된 새 이미지 미리보기</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {newImages.map((file, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`new-img-${idx}`}
                    style={{
                      width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc'
                    }}
                  />
                  <button
                    onClick={() => {
                      setNewImages(prev => prev.filter((_, i) => i !== idx));
                    }}
                    style={{
                      position: 'absolute', top: 5, right: 5,
                      background: 'rgba(255, 0, 0, 0.8)', color: 'white',
                      border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                      fontSize: '14px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="feed-content">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="제목"
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <textarea
            value={editContents}
            onChange={(e) => setEditContents(e.target.value)}
            placeholder="내용"
            rows={4}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ textAlign: 'right', marginTop: '10px' }}>
          <button onClick={onClose}>취소</button>
          <button onClick={handleSave} style={{ marginLeft: '10px' }}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default FeedEditModal;
