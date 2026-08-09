// script.js - 대장과의 대화 렌더링 예시 로직
function renderLetterDetail(post, currentUser) {
  // 열람 권한 검증: 본인, 지휘자(commander), 관리자(admin)
  const canAccess = 
    currentUser.milNumber === post.authorMilNumber || 
    currentUser.role === 'commander' || 
    currentUser.role === 'admin';

  // 작성자 표시 마스킹 (군번 및 이름 가리기)
  const maskedAuthor = '익명 (***)';

  if (!canAccess) {
    return `
      <div class="letter-item locked">
        <h3>🔒 ${post.title}</h3>
        <p class="author-info">작성자: ${maskedAuthor} | ${post.createdAt}</p>
        <p class="lock-message">🔒 비밀글입니다. 작성자, 지휘자 및 관리자만 열람할 수 있습니다.</p>
      </div>
    `;
  }

  // 권한이 있는 경우: 내용 공개 및 댓글 작성 폼 제공
  const canReply = currentUser.role === 'commander' || currentUser.role === 'admin' || currentUser.milNumber === post.authorMilNumber;

  return `
    <div class="letter-item open">
      <h3>${post.title}</h3>
      <p class="author-info">작성자: ${currentUser.milNumber === post.authorMilNumber ? '본인' : maskedAuthor} | ${post.createdAt}</p>
      <div class="post-content">${post.content}</div>
      
      <!-- 댓글 목록 영역 -->
      <div class="comments-section">
        <h4>답변 및 댓글</h4>
        ${renderComments(post.comments)}
        
        ${canReply ? `
          <form class="comment-form" data-post-id="${post.id}">
            <textarea placeholder="답변 또는 댓글을 입력하세요..." required></textarea>
            <button type="submit" class="primary-btn">등록</button>
          </form>
        ` : ''}
      </div>
    </div>
  `;
}
