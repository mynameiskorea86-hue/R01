// LocalStorage 키 정의
const STORAGE_KEYS = {
  USERS: 'app_users',
  SESSION: 'app_session',
  LETTERS: 'app_letters',
  LEAVES: 'app_leaves',
  BARBER: 'app_barber',
  SUGGESTIONS: 'app_suggestions',
  NOTICES: 'app_notices'
};

// 오늘 날짜 구하기 (YYYY-MM-DD 형식)
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 기본 데이터 및 테스트 계정 초기화
function initDefaultData() {
  let savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  
  const defaultAdmin = {
    milNumber: 'admin',
    name: '최고관리자',
    unitCode: '5기갑 방공대',
    role: 'admin',
    password: 'admin1234'
  };

  const defaultCommander = {
    milNumber: 'commander',
    name: '방공대장',
    unitCode: '5기갑 방공대',
    role: 'commander',
    password: 'commander1234'
  };

  if (!savedUsers.some(u => u.milNumber === 'admin')) savedUsers.push(defaultAdmin);
  if (!savedUsers.some(u => u.milNumber === 'commander')) savedUsers.push(defaultCommander);

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(savedUsers));
  return savedUsers;
}

let users = initDefaultData();
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)) || null;

// 각 기능별 저장 데이터 로드
let letters = JSON.parse(localStorage.getItem(STORAGE_KEYS.LETTERS)) || [];
let leaves = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVES)) || [];
let barberBookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BARBER)) || [];
let suggestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) || [];
let notices = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTICES)) || [
  { id: 1, title: '5기갑 방공대 커뮤니티 앱 정식 오픈 안내', content: '부대 소통 활성화를 위한 앱이 오픈되었습니다.', date: '2026-08-01' }
];

// 관리자 권한 확인 헬퍼 함수 (admin 또는 officer/commander 중 관리자 권한 부여 여부에 따라 체크)
function isManager() {
  if (!currentUser) return false;
  // 최고관리자('admin') 또는 역할이 관리자인 경우
  return currentUser.role === 'admin';
}

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

  // 회원가입 내 직책 선택 요소 제어
  const roleSelect = document.getElementById('roleSelect');
  const registerSoldierDatesGroup = document.getElementById('registerSoldierDatesGroup');

  if (roleSelect && registerSoldierDatesGroup) {
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'user') {
        registerSoldierDatesGroup.style.display = 'flex';
      } else {
        registerSoldierDatesGroup.style.display = 'none';
      }
    });
  }

  // 화면 전환 제어
  function showScreen(targetScreen) {
    [authScreen, homeScreen, detailScreen].forEach(s => {
      if (s) {
        s.style.display = 'none';
        s.classList.remove('active');
      }
    });

    if (targetScreen) {
      targetScreen.style.display = 'block';
      targetScreen.classList.add('active');
    }
  }

  // 앱 UI 업데이트
  function updateUI() {
    if (currentUser) {
      let roleName = '용사';
      if (currentUser.role === 'officer') roleName = '간부';
      if (currentUser.role === 'commander') roleName = '지휘자';
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

      showScreen(homeScreen);
    } else {
      if (logoutBtn) logoutBtn.classList.add('hidden');
      showScreen(authScreen);
    }
  }

  showRegisterBtn?.addEventListener('click', () => {
    registerCard.classList.toggle('hidden');
  });

  // 회원가입 처리
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const milNumber = document.getElementById('milNumber').value.trim();
    const name = document.getElementById('registerName').value.trim();
    const unitCode = document.getElementById('unitCode').value.trim();
    const role = document.getElementById('roleSelect').value;
    const password = document.getElementById('registerPassword').value;

    if (users.find(u => u.milNumber === milNumber)) {
      alert('이미 가입된 군번/아이디입니다.');
      return;
    }

    const newUser = { milNumber, name, unitCode, role, password };

    if (role === 'user') {
      const enlistDateInput = document.getElementById('registerEnlistDate');
      const dischargeDateInput = document.getElementById('registerDischargeDate');
      
      if (enlistDateInput) newUser.enlistDate = enlistDateInput.value;
      if (dischargeDateInput) newUser.dischargeDate = dischargeDateInput.value;
    }

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    alert('회원가입이 완료되었습니다.');
    registerCard.classList.add('hidden');
    registerForm.reset();

    if (registerSoldierDatesGroup) registerSoldierDatesGroup.style.display = 'flex';
  });

  // 로그인
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const milNumber = document.getElementById('loginMilNumber').value.trim();
    const password = document.getElementById('loginPassword').value;

    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    const user = users.find(u => u.milNumber === milNumber && u.password === password);
    
    if (user) {
      currentUser = user;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
      updateUI();
    } else {
      alert('군번(아이디) 또는 비밀번호가 올바르지 않습니다.');
    }
  });

  // 로그아웃
  logoutBtn?.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    updateUI();
  });

  // 메인 이동
  backToHomeBtn?.addEventListener('click', () => {
    showScreen(homeScreen);
  });

  // 메뉴 라우팅
  document.querySelectorAll('.menu-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const menu = btn.dataset.menu;
      if (menu === 'leave') openLeavePage();
      else if (menu === 'letter') openLetterBoard();
      else if (menu === 'barber') openBarberPage();
      else if (menu === 'suggestion') openSuggestionPage();
      else if (menu === 'notice') openNoticePage();
      else if (menu === 'admin') openAdminPage();
    });
  });

  // 1. 출타신청
  function openLeavePage() {
    document.getElementById('detailTitle').textContent = '방공대 출타신청';
    const detailContent = document.getElementById('detailContent');
    const today = getTodayString();

    detailContent.innerHTML = `
      <form id="leaveForm" style="display:flex; flex-direction:column; gap:10px;">
        <label>출타 유형
          <select id="leaveType" style="width:100%; padding:8px;" required>
            <option value="휴가">휴가</option>
            <option value="외박">외박</option>
            <option value="외출">외출</option>
          </select>
        </label>
        <label>시작일 <input type="date" id="leaveStart" min="${today}" style="width:100%; padding:8px;" required /></label>
        <label>종료일 <input type="date" id="leaveEnd" min="${today}" style="width:100%; padding:8px;" required /></label>
        <label>사유 <input type="text" id="leaveReason" placeholder="출타 사유 입력" style="width:100%; padding:8px;" required /></label>
        <button type="submit" class="primary-btn">신청하기</button>
      </form>
      <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
      <h3>${isManager() ? '전체 출타 신청 현황 (관리자)' : '내 신청 현황'}</h3>
      <div id="leaveList"></div>
    `;

    renderLeaveList();

    const startInput = document.getElementById('leaveStart');
    const endInput = document.getElementById('leaveEnd');

    startInput.addEventListener('change', () => {
      endInput.min = startInput.value;
      if (endInput.value && endInput.value < startInput.value) {
        endInput.value = startInput.value;
      }
    });

    document.getElementById('leaveForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newLeave = {
        id: Date.now(),
        milNumber: currentUser.milNumber,
        name: currentUser.name,
        type: document.getElementById('leaveType').value,
        start: startInput.value,
        end: endInput.value,
        reason: document.getElementById('leaveReason').value,
        status: '대기중'
      };
      leaves.unshift(newLeave);
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
      alert('출타 신청이 완료되었습니다.');
      renderLeaveList();
    });

    showScreen(detailScreen);
  }

  function renderLeaveList() {
    const leaveList = document.getElementById('leaveList');
    // 관리자면 전체 목록, 일반 용사면 본인 목록만 표시
    const targetLeaves = isManager() ? leaves : leaves.filter(l => l.milNumber === currentUser.milNumber);

    if (targetLeaves.length === 0) {
      leaveList.innerHTML = `<p style="font-size:12px; color:#888;">신청 내역이 없습니다.</p>`;
      return;
    }

    leaveList.innerHTML = targetLeaves.map(l => `
      <div style="border:1px solid #ddd; padding:10px; border-radius:6px; margin-bottom:8px; background:#fff; display:flex; justify-content:space-between; align-items:center;">
        <div>
          ${isManager() ? `<strong>[신청자: ${l.name} (${l.milNumber})]</strong><br/>` : ''}
          <strong>[${l.type}]</strong> ${l.start} ~ ${l.end}<br/>
          <span style="font-size:12px; color:#555;">사유: ${l.reason}</span><br/>
          <span style="font-size:12px; color:#007bff;">상태: ${l.status}</span>
        </div>
        ${isManager() ? `<button class="delete-leave-btn" data-id="${l.id}" style="padding:6px 10px; font-size:11px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer;">삭제</button>` : ''}
      </div>
    `).join('');

    // 관리자 삭제 이벤트 바인딩
    if (isManager()) {
      document.querySelectorAll('.delete-leave-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          if (confirm('해당 출타 신청 내역을 삭제하시겠습니까?')) {
            leaves = leaves.filter(l => l.id !== id);
            localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
            renderLeaveList();
          }
        });
      });
    }
  }

  // 2. 대장과의 대화
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
        const canAccess = currentUser.milNumber === post.authorMilNumber || currentUser.role === 'commander' || isManager();
        const isMyPost = currentUser.milNumber === post.authorMilNumber;
        const authorDisplay = isMyPost ? '본인' : '익명 (***)';

        html += `
          <div class="letter-card" style="border:1px solid #eee; padding:12px; border-radius:8px; margin-bottom:10px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="margin:0; font-size:16px;">${canAccess ? '🔓 ' : '🔒 '}${post.title}</h4>
              ${isManager() ? `<button class="delete-letter-btn" data-id="${post.id}" style="padding:4px 8px; font-size:11px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer;">삭제</button>` : ''}
            </div>
            <p style="font-size:12px; color:#666; margin:6px 0;">작성자: ${authorDisplay} | 작성일: ${post.createdAt}</p>
            
            ${canAccess ? `
              <div style="margin-top:10px; padding:10px; background:#f9f9f9; border-radius:6px; font-size:14px;">
                ${post.content.replace(/\n/g, '<br>')}
              </div>
              
              <div style="margin-top:10px; border-top:1px dashed #ddd; padding-top:8px;">
                <h5 style="margin:0 0 6px 0;">답변 / 댓글</h5>
                ${renderComments(post.comments)}
                
                ${(currentUser.role === 'commander' || isManager() || isMyPost) ? `
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

    if (isManager()) {
      document.querySelectorAll('.delete-letter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          if (confirm('해당 마음의 편지 글을 삭제하시겠습니까?')) {
            letters = letters.filter(l => l.id !== id);
            localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
            renderLetterList();
          }
        });
      });
    }
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

    const today = getTodayString();
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
      const today = getTodayString();
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

  // 3. 이발소
  function openBarberPage() {
    document.getElementById('detailTitle').textContent = '이발소 예약 신청';
    const detailContent = document.getElementById('detailContent');
    const today = getTodayString();

    detailContent.innerHTML = `
      <form id="barberForm" style="display:flex; flex-direction:column; gap:10px;">
        <label>예약 희망일 <input type="date" id="barberDate" min="${today}" style="width:100%; padding:8px;" required /></label>
        <button type="submit" class="primary-btn">예약하기</button>
      </form>
      <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
      <h3>${isManager() ? '전체 이발소 예약 현황 (관리자)' : '내 예약 내역'}</h3>
      <div id="barberList"></div>
    `;

    renderBarberList();

    document.getElementById('barberForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newBooking = {
        id: Date.now(),
        milNumber: currentUser.milNumber,
        name: currentUser.name,
        date: document.getElementById('barberDate').value
      };

      barberBookings.unshift(newBooking);
      localStorage.setItem(STORAGE_KEYS.BARBER, JSON.stringify(barberBookings));
      alert('이발소 예약이 완료되었습니다.');
      renderBarberList();
    });

    showScreen(detailScreen);
  }

  function renderBarberList() {
    const list = document.getElementById('barberList');
    const targetBookings = isManager() ? barberBookings : barberBookings.filter(b => b.milNumber === currentUser.milNumber);

    if (targetBookings.length === 0) {
      list.innerHTML = `<p style="font-size:12px; color:#888;">예약 내역이 없습니다.</p>`;
      return;
    }

    list.innerHTML = targetBookings.map(b => `
      <div style="border:1px solid #ddd; padding:10px; border-radius:6px; margin-bottom:8px; background:#fff; display:flex; justify-content:space-between; align-items:center;">
        <div>
          ${isManager() ? `<strong>[예약자: ${b.name} (${b.milNumber})]</strong><br/>` : ''}
          📅 <strong>${b.date}</strong> - 예약완료
        </div>
        ${isManager() ? `<button class="delete-barber-btn" data-id="${b.id}" style="padding:6px 10px; font-size:11px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer;">삭제</button>` : ''}
      </div>
    `).join('');

    if (isManager()) {
      document.querySelectorAll('.delete-barber-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          if (confirm('해당 이발소 예약을 삭제하시겠습니까?')) {
            barberBookings = barberBookings.filter(b => b.id !== id);
            localStorage.setItem(STORAGE_KEYS.BARBER, JSON.stringify(barberBookings));
            renderBarberList();
          }
        });
      });
    }
  }

  // 4. 건의사항
  function openSuggestionPage() {
    document.getElementById('detailTitle').textContent = '건의사항';
    const detailContent = document.getElementById('detailContent');

    detailContent.innerHTML = `
      <form id="suggestionForm" style="display:flex; flex-direction:column; gap:10px;">
        <input type="text" id="suggestionTitle" placeholder="제목" style="padding:8px;" required />
        <textarea id="suggestionContent" placeholder="건의할 내용을 입력해 주세요" style="height:80px; padding:8px;" required></textarea>
        <button type="submit" class="primary-btn">건의하기</button>
      </form>
      <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
      <h3>등록된 건의사항 목록</h3>
      <div id="suggestionList"></div>
    `;

    renderSuggestionList();

    document.getElementById('suggestionForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newSugg = {
        id: Date.now(),
        title: document.getElementById('suggestionTitle').value.trim(),
        content: document.getElementById('suggestionContent').value.trim(),
        authorName: currentUser.name,
        date: getTodayString()
      };

      suggestions.unshift(newSugg);
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
      alert('건의사항이 등록되었습니다.');
      renderSuggestionList();
    });

    showScreen(detailScreen);
  }

  function renderSuggestionList() {
    const list = document.getElementById('suggestionList');
    if (suggestions.length === 0) {
      list.innerHTML = `<p style="font-size:12px; color:#888;">등록된 건의사항이 없습니다.</p>`;
      return;
    }

    list.innerHTML = suggestions.map(s => `
      <div style="border:1px solid #ddd; padding:10px; border-radius:6px; margin-bottom:8px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0 0 4px 0;">${s.title}</h4>
          ${isManager() ? `<button class="delete-suggestion-btn" data-id="${s.id}" style="padding:4px 8px; font-size:11px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer;">삭제</button>` : ''}
        </div>
        <p style="font-size:12px; color:#666; margin:0 0 6px 0;">작성자: ${s.authorName} | ${s.date}</p>
        <p style="font-size:13px; margin:0;">${s.content}</p>
      </div>
    `).join('');

    if (isManager()) {
      document.querySelectorAll('.delete-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          if (confirm('해당 건의사항을 삭제하시겠습니까?')) {
            suggestions = suggestions.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
            renderSuggestionList();
          }
        });
      });
    }
  }

  // 5. 공지사항
  function openNoticePage() {
    document.getElementById('detailTitle').textContent = '공지사항';
    const detailContent = document.getElementById('detailContent');

    let html = '';
    
    // 관리자일 경우 공지사항 작성 폼 추가
    if (isManager()) {
      html += `
        <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #e0e0e0;">
          <h3 style="margin-top:0; font-size:14px;">📢 새 공지사항 등록</h3>
          <form id="noticeForm" style="display:flex; flex-direction:column; gap:8px;">
            <input type="text" id="noticeTitle" placeholder="공지 제목" style="padding:6px;" required />
            <textarea id="noticeContent" placeholder="공지 내용을 입력하세요" style="height:60px; padding:6px;" required></textarea>
            <button type="submit" class="primary-btn" style="font-size:12px; padding:6px;">공지 등록</button>
          </form>
        </div>
        <hr style="margin:15px 0; border:none; border-top:1px solid #eee;" />
      `;
    }

    if (notices.length === 0) {
      html += `<p style="text-align:center; color:#888;">등록된 공지사항이 없습니다.</p>`;
    } else {
      html += notices.map(n => `
        <div style="border:1px solid #ddd; padding:12px; border-radius:6px; margin-bottom:10px; background:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0 0 6px 0; font-size:15px; color:#0056b3;">📢 ${n.title}</h4>
            ${isManager() ? `<button class="delete-notice-btn" data-id="${n.id}" style="padding:4px 8px; font-size:11px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer;">삭제</button>` : ''}
          </div>
          <p style="font-size:11px; color:#888; margin:0 0 8px 0;">등록일: ${n.date}</p>
          <div style="font-size:13px; color:#333;">${n.content}</div>
        </div>
      `).join('');
    }

    detailContent.innerHTML = html;

    // 관리자 공지 등록 이벤트 바인딩
    if (isManager()) {
      document.getElementById('noticeForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();

        const newNotice = {
          id: Date.now(),
          title,
          content,
          date: getTodayString()
        };

        notices.unshift(newNotice);
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
        alert('공지사항이 등록되었습니다.');
        openNoticePage();
      });

      document.querySelectorAll('.delete-notice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          if (confirm('해당 공지사항을 삭제하시겠습니까?')) {
            notices = notices.filter(n => n.id !== id);
            localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
            openNoticePage();
          }
        });
      });
    }

    showScreen(detailScreen);
  }

  // 6. 관리자 DB
  function openAdminPage() {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('관리자만 접근 가능한 페이지입니다.');
      showScreen(homeScreen);
      return;
    }

    document.getElementById('detailTitle').textContent = '관리자 DB 제어';
    const detailContent = document.getElementById('detailContent');

    detailContent.innerHTML = `
      <div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #e0e0e0;">
        <h3 style="margin-top:0;">➕ 신규 인원 DB 입력</h3>
        <form id="adminAddUserForm" style="display:flex; flex-direction:column; gap:8px;">
          <label style="font-size:12px;">직책 선택
            <select id="dbRole" style="width:100%; padding:6px;" required>
              <option value="user">용사</option>
              <option value="officer">간부</option>
              <option value="commander">지휘자</option>
              <option value="admin">관리자</option>
            </select>
          </label>
          <label style="font-size:12px;">군번(아이디)
            <input type="text" id="dbMilNumber" placeholder="예: 21-123456" style="width:100%; padding:6px; box-sizing:border-box;" required />
          </label>
          <label style="font-size:12px;">이름
            <input type="text" id="dbName" placeholder="예: 홍길동" style="width:100%; padding:6px; box-sizing:border-box;" required />
          </label>
          <label style="font-size:12px;">부대 코드
            <input type="text" id="dbUnitCode" placeholder="예: 5기갑 방공대" style="width:100%; padding:6px; box-sizing:border-box;" required />
          </label>
          
          <div id="soldierDatesGroup" style="display:flex; flex-direction:column; gap:8px;">
            <label style="font-size:12px;">입대일
              <input type="date" id="dbEnlistDate" style="width:100%; padding:6px; box-sizing:border-box;" />
            </label>
            <label style="font-size:12px;">전역예정일
              <input type="date" id="dbDischargeDate" style="width:100%; padding:6px; box-sizing:border-box;" />
            </label>
          </div>

          <label style="font-size:12px;">비밀번호
            <input type="password" id="dbPassword" placeholder="초기 비밀번호" style="width:100%; padding:6px; box-sizing:border-box;" required />
          </label>

          <button type="submit" class="primary-btn" style="margin-top:5px;">DB 등록하기</button>
        </form>
      </div>

      <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
      <h3>전체 등록 인원 목록 (<span id="userCount">${users.length}</span>명)</h3>
      <div id="adminUserList" style="max-height:300px; overflow-y:auto;"></div>
    `;

    const dbRoleSelect = document.getElementById('dbRole');
    const soldierDatesGroup = document.getElementById('soldierDatesGroup');

    dbRoleSelect.addEventListener('change', () => {
      if (dbRoleSelect.value === 'user') {
        soldierDatesGroup.style.display = 'flex';
      } else {
        soldierDatesGroup.style.display = 'none';
      }
    });

    document.getElementById('adminAddUserForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const role = dbRoleSelect.value;
      const milNumber = document.getElementById('dbMilNumber').value.trim();
      const name = document.getElementById('dbName').value.trim();
      const unitCode = document.getElementById('dbUnitCode').value.trim();
      const password = document.getElementById('dbPassword').value;

      if (users.find(u => u.milNumber === milNumber)) {
        alert('이미 등록된 군번입니다.');
        return;
      }

      const newUser = { milNumber, name, unitCode, role, password };

      if (role === 'user') {
        newUser.enlistDate = document.getElementById('dbEnlistDate').value;
        newUser.dischargeDate = document.getElementById('dbDischargeDate').value;
      }

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      alert(`${name} (${milNumber}) 님이 DB에 등록되었습니다.`);

      document.getElementById('adminAddUserForm').reset();
      soldierDatesGroup.style.display = 'flex';
      renderAdminUserList();
    });

    renderAdminUserList();
    showScreen(detailScreen);
  }

  function renderAdminUserList() {
    const listContainer = document.getElementById('adminUserList');
    document.getElementById('userCount').textContent = users.length;

    listContainer.innerHTML = users.map(u => {
      let roleLabel = '용사';
      if (u.role === 'officer') roleLabel = '간부';
      if (u.role === 'commander') roleLabel = '지휘자';
      if (u.role === 'admin') roleLabel = '관리자';

      return `
        <div style="border-bottom:1px solid #eee; padding:10px 0; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${u.name}</strong> (${u.milNumber}) - <span style="color:#007bff; font-weight:bold;">${roleLabel}</span><br/>
            <span style="color:#666;">부대코드: ${u.unitCode}</span>
            ${u.role === 'user' && u.enlistDate ? `<br/><span style="color:#888;">입대: ${u.enlistDate} / 전역: ${u.dischargeDate || '-'}</span>` : ''}
          </div>
          <div style="display:flex; gap:4px;">
            <button class="edit-user-btn ghost-btn" data-mil="${u.milNumber}" style="padding:4px 8px; font-size:11px;">수정</button>
            ${u.milNumber !== 'admin' ? `<button class="delete-user-btn primary-btn" data-mil="${u.milNumber}" style="padding:4px 8px; font-size:11px; background-color:#dc3545;">삭제</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const milNumber = e.target.dataset.mil;
        editUserDB(milNumber);
      });
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const milNumber = e.target.dataset.mil;
        deleteUserDB(milNumber);
      });
    });
  }

  function editUserDB(milNumber) {
    const targetUser = users.users ? users.users.find(u => u.milNumber === milNumber) : users.find(u => u.milNumber === milNumber);
    if (!targetUser) return;

    const newName = prompt('수정할 이름을 입력하세요:', targetUser.name);
    if (newName === null) return;

    const newUnitCode = prompt('수정할 부대 코드를 입력하세요:', targetUser.unitCode);
    if (newUnitCode === null) return;

    const newPassword = prompt('수정할 비밀번호를 입력하세요:', targetUser.password);
    if (newPassword === null) return;

    targetUser.name = newName.trim() || targetUser.name;
    targetUser.unitCode = newUnitCode.trim() || targetUser.unitCode;
    targetUser.password = newPassword || targetUser.password;

    if (targetUser.role === 'user') {
      const newEnlist = prompt('수정할 입대일을 입력하세요 (YYYY-MM-DD):', targetUser.enlistDate || '');
      if (newEnlist !== null) targetUser.enlistDate = newEnlist;

      const newDischarge = prompt('수정할 전역예정일을 입력하세요 (YYYY-MM-DD):', targetUser.dischargeDate || '');
      if (newDischarge !== null) targetUser.dischargeDate = newDischarge;
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    alert(`${targetUser.milNumber} 번 인원의 정보가 수정되었습니다.`);
    renderAdminUserList();
  }

  function deleteUserDB(milNumber) {
    if (confirm(`군번 [${milNumber}] 인원을 정말 삭제하시겠습니까?`)) {
      users = users.filter(u => u.milNumber !== milNumber);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      alert('인원이 DB에서 삭제되었습니다.');
      renderAdminUserList();
    }
  }

  updateUI();
});
