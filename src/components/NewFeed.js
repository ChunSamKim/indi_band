import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

function NewFeed({ open, onClose, groupNo, onPostSuccess }) {
  const [files, setFiles] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const mainSwiperRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...selected]);
  };

  const handleSubmit = async () => {
    if (!title || !contents || files.length === 0) {
      return alert("제목, 내용, 파일을 모두 입력해주세요.");
    }

    const token = localStorage.getItem("token");
    const userId = JSON.parse(atob(token.split('.')[1])).tokenId;

    const formData = new FormData();
    formData.append("group_no", groupNo);
    formData.append("maker_id", userId);
    formData.append("feed_title", title);
    formData.append("feed_contents", contents);
    files.forEach(({ file }) => formData.append("images", file));

    try {
      const res = await fetch("http://localhost:3000/feed/add", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.message === "success") {
        alert("등록 완료");
        setFiles([]);
        setTitle('');
        setContents('');
        onPostSuccess();
      } else {
        alert("등록 실패");
      }
    } catch (err) {
      alert("서버 오류");
      console.error(err);
    }
  };

  return (
    open && (
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '640px', maxHeight: '90vh', background: 'white',
          borderRadius: '10px', padding: '20px', overflowY: 'auto'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>새 피드 등록</h2>

          {/* 메인 Swiper */}
          <div style={{
            width: '100%', height: '260px', backgroundColor: '#eee',
            borderRadius: '10px', overflow: 'hidden', marginBottom: '20px'
          }}>
            {files.length > 0 ? (
              <Swiper
                modules={[Navigation, Thumbs]}
                navigation
                thumbs={thumbsSwiper && !thumbsSwiper.destroyed ? { swiper: thumbsSwiper } : undefined}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                onSwiper={(swiper) => (mainSwiperRef.current = swiper)}
                initialSlide={activeIndex}
                slidesPerView={1}
                spaceBetween={10}
                style={{ height: '100%' }}
              >
                {files.map((item, idx) => (
                  <SwiperSlide key={idx}>
                    {item.file.type.startsWith('video') ? (
                      <video
                        src={item.preview}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={item.preview}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        alt={`preview-${idx}`}
                      />
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: '#888'
              }}>미리보기 영역</div>
            )}
          </div>

          {/* 썸네일 Swiper */}
          {files.length > 0 && (
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              overflowX: 'auto',
              marginBottom: '12px'
            }}>
              <div style={{ minWidth: 'fit-content' }}>
                <Swiper
                  modules={[Thumbs]}
                  onSwiper={setThumbsSwiper}
                  slidesPerView="auto"
                  spaceBetween={10}
                  centeredSlides={false}
                  style={{ width: '100%' }}
                >
                  {files.map((item, idx) => (
                    <SwiperSlide
                      key={idx}
                      style={{
                        width: '60px',
                        height: '60px',
                        position: 'relative',
                        flexShrink: 0
                      }}
                    >
                      {item.file.type.startsWith('video') ? (
                        <video
                          src={item.preview}
                          onClick={() => {
                            setActiveIndex(idx);
                            mainSwiperRef.current?.slideTo(idx);
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            backgroundColor: '#f0f0f0',
                            border: activeIndex === idx ? '2px solid #1976d2' : '2px solid transparent',
                            boxSizing: 'border-box',
                            cursor: 'pointer'
                          }}
                          muted
                        />
                      ) : (
                        <img
                          src={item.preview}
                          onClick={() => {
                            setActiveIndex(idx);
                            mainSwiperRef.current?.slideTo(idx);
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            backgroundColor: '#f0f0f0',
                            border: activeIndex === idx ? '2px solid #1976d2' : '2px solid transparent',
                            boxSizing: 'border-box',
                            cursor: 'pointer'
                          }}
                          alt={`thumb-${idx}`}
                        />
                      )}
                      <button
                        onClick={() => {
                          URL.revokeObjectURL(item.preview);

                          setFiles(prev => {
                            const updated = prev.filter((_, i) => i !== idx);
                            const newIndex = Math.max(0, updated.length - 1);

                            
                            setTimeout(() => {
                              setActiveIndex(newIndex);
                              mainSwiperRef.current?.slideTo(newIndex);
                            }, 0);

                            return updated;
                          });
                        }}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(255,0,0,0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          fontSize: '10px',
                          lineHeight: '12px',
                          textAlign: 'center',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >×</button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}

          {/* 파일 추가 버튼 (input 숨기고 label 사용) */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="file"
              id="fileInput"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              파일 추가
            </label>
          </div>

          {/* 제목/내용 입력 */}
          {files.length > 0 && (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                style={{
                  width: '100%', padding: '10px', marginBottom: '10px',
                  border: '1px solid #ccc', borderRadius: '6px'
                }}
              />
              <textarea
                value={contents}
                onChange={(e) => setContents(e.target.value)}
                placeholder="내용"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  resize: 'none'
                }}
              />
            </>
          )}

          {/* 등록/취소 버튼 */}
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button onClick={onClose} style={{
              marginRight: '10px',
              padding: '8px 16px',
              border: '1px solid #aaa',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>취소</button>
            <button onClick={handleSubmit} style={{
              backgroundColor: '#1976d2',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>등록</button>
          </div>
        </div>
      </div>
    )
  );
}

export default NewFeed;
