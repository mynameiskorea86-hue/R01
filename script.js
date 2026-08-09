// LocalStorage 키 정의
const STORAGE_KEYS = {
  USERS: 'app_users',
  SESSION: 'app_session',
  LETTERS: 'app_letters'
};

// 기본 관리자 및 테스트 계정 초기화 함수
function initDefaultData() {
  let savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  
  const defaultAdmin = {
    milNumber: 'admin',
    name: '최고관리자',
    birthDate: '1990-01-01',
    unitCode: '5기갑 방공대',
    role: 'admin',
    password: 'admin1234'
  };

  const defaultCommander = {
    milNumber: 'commander',
    name: '방공대장',
    birthDate: '1985-01-01',
    unitCode: '5기갑 방공대',
    role: 'commander',
    password: 'commander1234'
  };

  if (!savedUsers.some(u => u.milNumber === 'admin')) {
    savedUsers.push(defaultAdmin);
  }
  if (!savedUsers.some(u => u.milNumber === 'commander')) {
    savedUsers.push(defaultCommander);
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(savedUsers));
  return savedUsers;
}

// 데이터 로드
let users = initDefaultData();
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)) || null;
let letters = JSON.parse(localStorage.getItem(STORAGE_KEYS.LETTERS)) || [
  {
    id: 1,
    title: '부대 생활 관련 문의드립니다.',
    content: '건의사항 및 소통을 위한 마음의 편지 내용입니다.',
    authorMilNumber: '21-123456',
    authorName: '홍길동',
    createdAt: '2026-08-08',
    comments: [
      { id: 101, author: '지휘관', role: 'commander', content: '확인하였습니다. 조치 예정입니다.', createdAt: '2026-08-08' }
    ]
  }
];

// DOM 요소 획득 및 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
  const authScreen = document.getElementById('authScreen');
  const homeScreen = document.getElementById('homeScreen');
  const detailScreen = document.getElementById('detailScreen');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerCard = document.getElementById('registerCard');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const adminCard = document.getElementById('adminCard');

  // 💡 [화면 전환 함수] style.display로 확실하게 제어 (겹침 방지)
  function showScreen(targetScreen) {
    // 모든 화면 숨김
    [authScreen, homeScreen, detailScreen].forEach(s => {
      if (s) {
        s.style.display = 'none';
        s.classList.remove('active');
      }
    });

    // 지정된 화면만 노출
    if (targetScreen) {
      targetScreen.style.display = 'block';
      targetScreen.classList.add('active');
    }
  }

  // 앱 UI 로그인 상태 업데이트
  function updateUI() {
    if (currentUser) {
      let roleName = '용사';
      if (currentUser.role === 'commander') roleName = '지휘관';
      if (currentUser.role === 'admin') roleName = '관리자';

      document.getElementById('userGreeting').textContent = `${currentUser.name} (${roleName})님 환영합니다`;
      document.getElementById('userInfoText').textContent = `${currentUser.milNumber} · ${currentUser.unitCode}`;
      
      if (logoutBtn) logoutBtn.classList.remove('hidden');

      if (adminCard) {
        if (currentUser.role === 'admin') {
          adminCard.classList.remove('hidden');
        } else {
          adminCard.classList.add('hidden');
        }
      }

      // 로그인 상태이면 메인 화면만 보이기
      showScreen(homeScreen);
    } else {
      if (logoutBtn) logoutBtn.classList.add('hidden');
      
      // 로그아웃 상태이면 로그인 화면만 보이기
      showScreen(authScreen);
    }
  }

  // 회원가입 창 토글
  showRegisterBtn?.addEventListener('click', () => {
    registerCard.classList.toggle('hidden');
  });

  // 회원가입 처리
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const milNumber = document.getElementById('milNumber').value.trim();
    const name = document.getElementById('registerName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const unitCode = document.getElementById('unitCode').value.trim();
    const role = document.getElementById('roleSelect').value;
    const password = document.getElementById('registerPassword').value;

    if (users.find(u => u.milNumber === milNumber)) {
      alert('이미 가입된 군번/아이디입니다.');
      return;
    }

    const newUser = { milNumber, name, birthDate, unitCode, role, password };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    registerCard.classList.add('hidden');
    registerForm.reset();
  });

  // 로그인 처리
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const milNumber = document.getElementById('loginMilNumber').value.trim();
    const password = document.getElementById('loginPassword').value;

    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];

    const user = users.find(u => u.milNumber === milNumber && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
      updateUI(); // UI 및 화면 전환 업데이트
    } else {
      alert('군번(아이디) 또는 비밀번호가 올바르지 않습니다.');
    }
  });

  // 로그아웃 처리
  logoutBtn?.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    updateUI();
  });

  // 메인으로 돌아가기
  backToHomeBtn?.addEventListener('click', () => {
    showScreen(homeScreen);
  });

  // 메뉴 버튼 이벤트
  document.querySelectorAll('.menu-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const menu = btn.dataset.menu;
      if (menu === 'letter') {
        openLetterBoard();
      } else {
        document.getElementById('detailTitle').textContent = btn.querySelector('h3').textContent;
        document.getElementById('detailContent').innerHTML = `<p style="padding:20px; text-align:center;">준비 중인 기능입니다.</p>`;
        showScreen(detailScreen);
      }
    });
  });

  // ==========================================
  // 💬 대장과의 대화 (마음의 편지)
  // ==========================================

  function openLetterBoard() {
    document.getElementById('detailTitle').textContent = '대장과의 대화 (마음의 편지)';
    renderLetterList();
    showScreen(detailScreen);
  }

  function renderLetterList() {
    const detailContent = document.getElementById('detailContent');

    let html = `
      <div style="margin-bottom: 20px;">
        <button id="writeLetterBtn" class="primary-btn" style="width:100%; margin-bottom:15px;">✍️ 작성하기</button>
        <div id="letterWriteForm" class="hidden" style="background:#f5f5f5; padding:15px; border-radius:8px; margin-bottom:15px;">
          <input type="text" id="letterTitle" placeholder="제목을 입력하세요" style="width:100%; padding:8px; margin-bottom:10px; box-sizing:border-box;" required />
          <textarea id="letterText" placeholder="내용을 입력하세요..." style="width:100%; height:80px; padding:8px; margin-bottom:10px; box-sizing:border-box;" required></textarea>
          <button id="submitLetterBtn" class="primary-btn" style="width:100%;">등록</button>
        </div>
      </div>
      <div class="letter-list">
    `;

    if (letters.length === 0) {
      html += `<p style="text-align:center; color:#888;">등록된 편지가 없습니다.</p>`;
    } else {
      letters.forEach((post) => {
        // 열람 권한: 작성 본인 또는 지휘관(commander)만 가능
        const canAccess = currentUser.milNumber === post.authorMilNumber || currentUser.role === 'commander';
        const isMyPost = currentUser.milNumber === post.authorMilNumber;

        // 아이디 익명화
        const authorDisplay = isMyPost ? '본인' : '익명 (***)';

        html += `
          <div class="letter-card" style="border:1px solid #eee; padding:12px; border-radius:8px; margin-bottom:10px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="margin:0; font-size:16px;">${canAccess ? '🔓 ' : '🔒 '}${post.title}</h4>
            </div>
            <p style="font-size:12px; color:#666; margin:6px 0;">작성자: ${authorDisplay} | 작성일: ${post.createdAt}</p>
            
            ${canAccess ? `
              <div style="margin-top:10px; padding:10px; background:#f9f9f9; border-radius:6px; font-size:14px;">
                ${post.content.replace(/\n/g, '<br>')}
              </div>
              
              <div style="margin-top:10px; border-top:1px dashed #ddd; padding-top:8px;">
                <h5 style="margin:0 0 6px 0;">답변 / 댓글</h5>
                ${renderComments(post.comments)}
                
                ${(currentUser.role === 'commander' || isMyPost) ? `
                  <div style="display:flex; gap:5px; margin-top:8px;">
                    <input type="text" id="commentInput-${post.id}" placeholder="댓글을 입력하세요" style="flex:1; padding:6px; font-size:12px;" />
                    <button class="add-comment-btn primary-btn" data-post-id="${post.id}" style="padding:6px 12px; font-size:12px;">등록</button>
                  </div>
                ` : ''}
              </div>
            ` : `
              <p style="font-size:12px; color:#d9534f; margin-top:8px;">🔒 비밀글입니다. 작성자와 지휘관만 열람할 수 있습니다.</p>
            `}
          </div>
        `;
      });
    }

    html += `</div>`;
    detailContent.innerHTML = html;

    document.getElementById('writeLetterBtn')?.addEventListener('click', () => {
      document.getElementById('letterWriteForm').classList.toggle('hidden');
    });

    document.getElementById('submitLetterBtn')?.addEventListener('click', createLetter);

    document.querySelectorAll('.add-comment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = parseInt(e.target.dataset.postId);
        addComment(postId);
      });
    });
  }

  function renderComments(comments = []) {
    if (comments.length === 0) {
      return `<p style="font-size:11px; color:#999; margin:4px 0;">등록된 답변이 없습니다.</p>`;
    }
    return comments.map(c => `
      <div style="font-size:12px; background:#fff; padding:6px; border-radius:4px; margin-bottom:4px; border:1px solid #f0f0f0;">
        <strong>[${c.role === 'commander' ? '지휘관' : '작성자'}]</strong>: ${c.content}
        <span style="font-size:10px; color:#aaa; margin-left:6px;">${c.createdAt}</span>
      </div>
    `).join('');
  }

  function createLetter() {
    const title = document.getElementById('letterTitle').value.trim();
    const content = document.getElementById('letterText').value.trim();

    if (!title || !content) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newLetter = {
      id: Date.now(),
      title,
      content,
      authorMilNumber: currentUser.milNumber,
      authorName: currentUser.name,
      createdAt: today,
      comments: []
    };

    letters.unshift(newLetter);
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
    renderLetterList();
  }

  function addComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const content = input.value.trim();

    if (!content) {
      alert('댓글 내용을 입력하세요.');
      return;
    }

    const post = letters.find(l => l.id === postId);
    if (post) {
      const today = new Date().toISOString().split('T')[0];
      post.comments.push({
        id: Date.now(),
        author: currentUser.name,
        role: currentUser.role,
        content,
        createdAt: today
      });

      localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
      renderLetterList();
    }
  }

  // 앱 실행 시 초기 화면 정리
  updateUI();
});
