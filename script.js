function normalizeRole(role) {
  if (!role || typeof role !== 'string') return role;
  if (role === '관리자') return 'admin';
  if (role === '지휘자') return 'commander';
  if (role === '간부') return 'officer';
  if (role === '용사') return 'user';
  return role;
}

function normalizeUser(user) {
  return {
    ...user,
    role: normalizeRole(user.role)
  };
}

function canManageNotices() {
  return ['admin', 'commander'].includes(normalizeRole(state.user?.role));
}

const state = {
  user: null,
  selectedMenu: null,
  adminEditing: null,
  users: JSON.parse(localStorage.getItem('users') || '[]').map(normalizeUser),
  requests: JSON.parse(localStorage.getItem('leaveRequests') || '[]'),
  letters: JSON.parse(localStorage.getItem('letters') || '[]'),
  suggestions: JSON.parse(localStorage.getItem('suggestions') || '[]'),
  notices: JSON.parse(localStorage.getItem('notices') || '[]'),
  barberBookings: JSON.parse(localStorage.getItem('barberBookings') || '[]')
};

const authScreen = document.getElementById('authScreen');
const homeScreen = document.getElementById('homeScreen');
const detailScreen = document.getElementById('detailScreen');
const logoutBtn = document.getElementById('logoutBtn');
const detailTitle = document.getElementById('detailTitle');
const detailContent = document.getElementById('detailContent');
const userGreeting = document.getElementById('userGreeting');
const userInfoText = document.getElementById('userInfoText');
const registerCard = document.getElementById('registerCard');
const showRegisterBtn = document.getElementById('showRegisterBtn');

function showScreen(screen) {
  const screens = [authScreen, homeScreen, detailScreen];
  screens.forEach((item) => {
    item.classList.remove('active');
    item.classList.add('hidden');
    item.style.display = 'none';
  });
  screen.classList.add('active');
  screen.classList.remove('hidden');
  screen.style.display = 'flex';
}

function saveState() {
  localStorage.setItem('users', JSON.stringify(state.users));
  localStorage.setItem('leaveRequests', JSON.stringify(state.requests));
  localStorage.setItem('letters', JSON.stringify(state.letters));
  localStorage.setItem('suggestions', JSON.stringify(state.suggestions));
  localStorage.setItem('notices', JSON.stringify(state.notices));
  localStorage.setItem('barberBookings', JSON.stringify(state.barberBookings));
}

function hideRegisterCard() {
  if (registerCard) {
    registerCard.classList.add('hidden');
  }
}

function showRegisterCard() {
  if (registerCard) {
    registerCard.classList.remove('hidden');
  }
}

function setAuthState() {
  const adminCard = document.getElementById('adminCard');
  if (state.user) {
    state.user.role = normalizeRole(state.user.role);
    showScreen(homeScreen);
    logoutBtn.classList.remove('hidden');
    if (userGreeting) {
      userGreeting.textContent = `${state.user.role === 'admin' ? '관리자' : state.user.role === 'commander' ? '지휘자' : state.user.role === 'officer' ? '간부' : '용사'}님`;
    }
    if (userInfoText) {
      userInfoText.textContent = `${state.user.milNumber} · ${state.user.unitCode}`;
    }
    if (adminCard) {
      adminCard.classList.toggle('hidden', state.user.role !== 'admin');
    }
  } else {
    showScreen(authScreen);
    logoutBtn.classList.add('hidden');
    hideRegisterCard();
    if (userGreeting) {
      userGreeting.textContent = '';
    }
    if (userInfoText) {
      userInfoText.textContent = '';
    }
    if (adminCard) {
      adminCard.classList.add('hidden');
    }
  }
}

function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML !== undefined) el.innerHTML = innerHTML;
  return el;
}

function renderLeaveDetail() {
  detailTitle.textContent = '방공대 출타신청 종합';
  detailContent.innerHTML = '';

  if (['user', 'officer', 'commander', 'admin'].includes(state.user.role)) {
    const forms = createElement('div');
    forms.innerHTML = `
      <div class="inline-row">
        <label>신청 종류
          <select id="leaveType">
            <option value="휴가">휴가</option>
            <option value="외박">외박</option>
            <option value="외출">외출</option>
          </select>
        </label>
        <label>출타 지역
          <select id="leaveRegion">
            <option value="본부">본부</option>
            <option value="외곽">외곽</option>
            <option value="군사시설 외">군사시설 외</option>
          </select>
        </label>
      </div>
      <div class="inline-row">
        <label>시작일
          <input type="date" id="startDate" />
        </label>
        <label>종료일
          <input type="date" id="endDate" />
        </label>
      </div>
      <label>사용 내역
        <textarea id="leaveReason" placeholder="휴가 사용 내역을 입력해 주세요."></textarea>
      </label>
      <button id="requestLeaveBtn" class="primary-btn">신청하기</button>
    `;
    detailContent.appendChild(forms);
  }

  const approvalList = createElement('div', 'card');
  approvalList.innerHTML = '<h3>출타 신청 현황</h3>';
  const list = createElement('div');
  const visibleRequests = state.user.role === 'commander' || state.user.role === 'admin'
    ? state.requests
    : state.requests.filter((item) => item.author === state.user.milNumber);

  if (!visibleRequests.length) {
    list.innerHTML = '<div>확인 가능한 신청 내역이 없습니다.</div>';
  } else {
    visibleRequests.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      row.innerHTML = `<strong>${item.type}</strong> · ${item.startDate} ~ ${item.endDate}<br/>${item.region} · ${item.reason}<br/>작성자: ${item.author}<br/><span class="status">${item.status}</span>`;
      if ((state.user.role === 'commander' || state.user.role === 'admin') && item.status === '승인대기') {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-leave" data-index="${index}">승인</button><button class="ghost-btn danger-btn reject-leave" data-index="${index}">거절</button></div>`;
      }
      list.appendChild(row);
    });
  }
  approvalList.appendChild(list);
  detailContent.appendChild(approvalList);

  if (['user', 'officer', 'commander', 'admin'].includes(state.user.role)) {
    document.getElementById('requestLeaveBtn').addEventListener('click', () => {
      const type = document.getElementById('leaveType').value;
      const region = document.getElementById('leaveRegion').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const reason = document.getElementById('leaveReason').value;
      if (!startDate || !endDate || !reason) {
        alert('필수 항목을 모두 입력해 주세요.');
        return;
      }

      state.requests.push({ type, region, startDate, endDate, reason, status: '승인대기', author: state.user.milNumber });
      saveState();
      renderLeaveDetail();
      alert('신청이 접수되었습니다. 승인 대기 중입니다.');
    });
  }

  document.querySelectorAll('.approve-leave').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.requests[index].status = '승인';
      saveState();
      renderLeaveDetail();
    });
  });

  document.querySelectorAll('.reject-leave').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.requests[index].status = '거절';
      saveState();
      renderLeaveDetail();
    });
  });
}

function renderLetterDetail() {
  detailTitle.textContent = '대장과의 대화';
  detailContent.innerHTML = '';
  detailContent.innerHTML = `
    <label>비밀글 작성
      <textarea id="letterText" placeholder="대장에게 남길 내용을 입력해 주세요."></textarea>
    </label>
    <button id="submitLetterBtn" class="primary-btn">보내기</button>
  `;

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>대장과의 대화 목록</h3>';
  const visibleLetters = state.letters.filter((item) => {
    if (['commander', 'admin'].includes(state.user.role)) return true;
    return item.author === state.user.milNumber;
  });

  if (!visibleLetters.length) {
    list.innerHTML += '<div>확인 가능한 대화가 없습니다.</div>';
  } else {
    visibleLetters.forEach((item) => {
      const row = createElement('div', 'list-box');
      row.innerHTML = `<strong>${item.author}</strong><br/>${item.text}<br/><span class="badge">작성자${item.author === state.user.milNumber ? ' 본인' : ''}${state.user.role === 'commander' ? ' · 지휘관 확인 가능' : ''}</span>`;
      list.appendChild(row);
    });
  }
  detailContent.appendChild(list);

  document.getElementById('submitLetterBtn').addEventListener('click', () => {
    const text = document.getElementById('letterText').value;
    if (!text) {
      alert('내용을 입력해 주세요.');
      return;
    }
    state.letters.push({ author: state.user.milNumber, text });
    saveState();
    renderLetterDetail();
    alert('비밀글이 전송되었습니다.');
  });
}

function renderBarberDetail() {
  detailTitle.textContent = '이발소 신청';
  detailContent.innerHTML = '';
  if (['user', 'officer', 'commander', 'admin'].includes(state.user.role)) {
    detailContent.innerHTML = `
      <label>예약일
        <input type="date" id="barberDate" />
      </label>
      <label>요청사항
        <textarea id="barberNote" placeholder="두발 정리 요청 내용을 입력해 주세요."></textarea>
      </label>
      <button id="barberBookBtn" class="primary-btn">신청하기</button>
    `;
  }

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>예약 내역</h3>';
  const visibleBookings = state.user.role === 'commander' || state.user.role === 'admin'
    ? state.barberBookings
    : state.barberBookings.filter((item) => item.author === state.user.milNumber);

  if (!visibleBookings.length) {
    list.innerHTML += '<div>확인 가능한 예약 내역이 없습니다.</div>';
  } else {
    visibleBookings.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      row.innerHTML = `<strong>${item.date}</strong><br/>${item.note}<br/>${item.author ? '작성자: ' + item.author + '<br/>' : ''}<span class="status">${item.status || '승인대기'}</span>`;
      if ((state.user.role === 'commander' || state.user.role === 'admin') && (item.status === '승인대기' || !item.status)) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-barber" data-index="${index}">승인</button><button class="ghost-btn danger-btn reject-barber" data-index="${index}">거절</button></div>`;
      }
      list.appendChild(row);
    });
  }
  detailContent.appendChild(list);

  if (state.user.role === 'user' || state.user.role === 'officer') {
    document.getElementById('barberBookBtn').addEventListener('click', () => {
      const date = document.getElementById('barberDate').value;
      const note = document.getElementById('barberNote').value;
      if (!date || !note) {
        alert('예약일과 요청사항을 입력해 주세요.');
        return;
      }
      state.barberBookings.push({ date, note, author: state.user.milNumber, status: '승인대기' });
      saveState();
      renderBarberDetail();
      alert('이발소 신청이 접수되었습니다.');
    });
  }

  document.querySelectorAll('.approve-barber').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.barberBookings[index].status = '승인';
      saveState();
      renderBarberDetail();
    });
  });
  document.querySelectorAll('.reject-barber').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.barberBookings[index].status = '거절';
      saveState();
      renderBarberDetail();
    });
  });
}

function renderSuggestionDetail() {
  detailTitle.textContent = '건의사항';
  detailContent.innerHTML = '';
  if (['user', 'officer', 'commander', 'admin'].includes(state.user.role)) {
    detailContent.innerHTML = `
      <label>제목
        <input type="text" id="suggestionTitle" placeholder="예: 식당 개선 요청" />
      </label>
      <label>내용
        <textarea id="suggestionText" placeholder="고쳐주세요, 필요해요 등 내용을 적어주세요."></textarea>
      </label>
      <button id="submitSuggestionBtn" class="primary-btn">등록하기</button>
    `;
  }

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>건의사항 현황</h3>';
  const visibleSuggestions = state.user.role === 'commander' || state.user.role === 'admin'
    ? state.suggestions
    : state.suggestions.filter((item) => item.author === state.user.milNumber);

  if (!visibleSuggestions.length) {
    list.innerHTML += '<div>확인 가능한 건의사항이 없습니다.</div>';
  } else {
    visibleSuggestions.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      row.innerHTML = `<strong>${item.title}</strong><br/>${item.text}<br/>${item.author ? '작성자: ' + item.author + '<br/>' : ''}<span class="status">${item.status || '검토중'}</span>`;
      if ((state.user.role === 'commander' || state.user.role === 'admin') && (item.status === '검토중' || !item.status)) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-suggestion" data-index="${index}">승인</button><button class="ghost-btn danger-btn reject-suggestion" data-index="${index}">거절</button></div>`;
      }
      list.appendChild(row);
    });
  }
  detailContent.appendChild(list);

  if (state.user.role === 'user' || state.user.role === 'officer') {
    document.getElementById('submitSuggestionBtn').addEventListener('click', () => {
      const title = document.getElementById('suggestionTitle').value;
      const text = document.getElementById('suggestionText').value;
      if (!title || !text) {
        alert('제목과 내용을 입력해 주세요.');
        return;
      }
      state.suggestions.push({ title, text, author: state.user.milNumber, status: '검토중' });
      saveState();
      renderSuggestionDetail();
      alert('건의사항이 등록되었습니다.');
    });
  }

  document.querySelectorAll('.approve-suggestion').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.suggestions[index].status = '승인';
      saveState();
      renderSuggestionDetail();
    });
  });
  document.querySelectorAll('.reject-suggestion').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.suggestions[index].status = '거절';
      saveState();
      renderSuggestionDetail();
    });
  });
}

function renderNoticeDetail() {
  detailTitle.textContent = '공지사항';
  detailContent.innerHTML = '';

  if (canManageNotices()) {
    detailContent.innerHTML += `
      <label>공지 제목
        <input type="text" id="noticeTitle" placeholder="공지 제목을 입력해 주세요." />
      </label>
      <label>공지 내용
        <textarea id="noticeText" placeholder="공지 내용을 입력해 주세요."></textarea>
      </label>
      <button id="submitNoticeBtn" class="primary-btn">공지 등록</button>
    `;
  }

  const noticeList = createElement('div', 'card');
  noticeList.innerHTML = '<h3>부대 공지</h3>';
  const noticeItems = state.notices.length ? state.notices : [
    { title: '오늘 18:00까지 전투준비점검 실시', text: '', author: 'system' },
    { title: '휴가 신청은 24시간 전까지 접수 가능', text: '', author: 'system' },
    { title: '이발소 예약은 주말 운영 시간 외 신청 불가', text: '', author: 'system' }
  ];

  noticeItems.forEach((item, index) => {
    const row = createElement('div', 'list-box');
    row.innerHTML = `<strong>${item.title}</strong>${item.text ? '<br/>' + item.text : ''}${item.author ? '<br/><span class="badge">작성자: ' + item.author + '</span>' : ''}`;
    if (canManageNotices() && item.author !== 'system') {
      row.innerHTML += `<div class="action-row"><button class="ghost-btn danger-btn delete-notice" data-index="${index}">삭제</button></div>`;
    }
    noticeList.appendChild(row);
  });

  detailContent.appendChild(noticeList);

  if (canManageNotices()) {
    document.getElementById('submitNoticeBtn').addEventListener('click', () => {
      const title = document.getElementById('noticeTitle').value.trim();
      const text = document.getElementById('noticeText').value.trim();
      if (!title) {
        alert('공지 제목을 입력해 주세요.');
        return;
      }
      state.notices.push({ title, text, author: state.user.role });
      saveState();
      renderNoticeDetail();
      alert('공지사항이 등록되었습니다.');
    });
  }

  document.querySelectorAll('.delete-notice').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.notices.splice(index, 1);
      saveState();
      renderNoticeDetail();
    });
  });
}

function downloadUserDbTemplate() {
  const template = 'milNumber,name,birthDate,unitCode,role,enlistDate,dischargeDate\n';
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'user-db-template.csv';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderAdminDetail() {
  detailTitle.textContent = '관리자 가입자 DB';
  detailContent.innerHTML = `
    <label>군번
      <input type="text" id="adminMilNumber" placeholder="예: 21-123456" />
    </label>
    <label>이름
      <input type="text" id="adminName" placeholder="예: 홍길동" />
    </label>
    <label>생년월일
      <input type="date" id="adminBirthDate" />
    </label>
    <label>부대 코드
      <input type="text" id="adminUnitCode" placeholder="예: 1-1대대" />
    </label>
    <label>직책
      <select id="adminRole">
        <option value="user">일반 사용자</option>
        <option value="admin">관리자</option>
        <option value="commander">지휘자</option>
      </select>
    </label>
    <label>입대일
      <input type="date" id="adminEnlistDate" />
    </label>
    <label>전역예정일
      <input type="date" id="adminDischargeDate" />
    </label>
    <div class="admin-actions-row">
      <button id="addUserDbBtn" class="primary-btn">가입자 DB 추가</button>
      <button id="cancelAdminEditBtn" class="ghost-btn hidden">편집 취소</button>
    </div>
    <button id="downloadTemplateBtn" class="accent-btn">DB 양식 다운로드</button>
  `;

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>등록된 가입자</h3>';
  const table = createElement('div', 'list-box');
  table.innerHTML = state.users.length ? state.users.map((user) => {
    const active = user.role === 'user' && user.dischargeDate && new Date().toISOString().slice(0, 10) >= user.dischargeDate ? ' (접속불가)' : '';
    return `<div class="admin-user-row"><div><strong>${user.milNumber}</strong> · ${user.role}${active}<br/>${user.name || ''} · ${user.unitCode} · ${user.birthDate}${user.enlistDate ? '<br/>입대: ' + user.enlistDate : ''}${user.dischargeDate ? ' · 전역: ' + user.dischargeDate : ''}</div><div class="admin-user-actions"><button class="ghost-btn edit-user" data-mil="${user.milNumber}">수정</button><button class="ghost-btn danger-btn delete-user" data-mil="${user.milNumber}">삭제</button></div></div>`;
  }).join('<hr/>') : '<div>등록된 가입자가 없습니다.</div>';
  list.appendChild(table);
  detailContent.appendChild(list);

  const fillForm = (user) => {
    state.adminEditing = user.milNumber;
    document.getElementById('adminMilNumber').value = user.milNumber;
    document.getElementById('adminName').value = user.name || '';
    document.getElementById('adminBirthDate').value = user.birthDate;
    document.getElementById('adminUnitCode').value = user.unitCode;
    document.getElementById('adminRole').value = user.role;
    document.getElementById('adminEnlistDate').value = user.enlistDate || '';
    document.getElementById('adminDischargeDate').value = user.dischargeDate || '';
    document.getElementById('addUserDbBtn').textContent = '가입자 DB 수정';
    document.getElementById('cancelAdminEditBtn').classList.remove('hidden');
  };

  const resetForm = () => {
    state.adminEditing = null;
    document.getElementById('adminMilNumber').value = '';
    document.getElementById('adminName').value = '';
    document.getElementById('adminBirthDate').value = '';
    document.getElementById('adminUnitCode').value = '';
    document.getElementById('adminRole').value = 'user';
    document.getElementById('adminEnlistDate').value = '';
    document.getElementById('adminDischargeDate').value = '';
    document.getElementById('addUserDbBtn').textContent = '가입자 DB 추가';
    document.getElementById('cancelAdminEditBtn').classList.add('hidden');
  };

  document.querySelectorAll('.edit-user').forEach((button) => {
    button.addEventListener('click', () => {
      const milNumber = button.dataset.mil;
      const user = state.users.find((item) => item.milNumber === milNumber);
      if (user) {
        fillForm(user);
      }
    });
  });

  document.querySelectorAll('.delete-user').forEach((button) => {
    button.addEventListener('click', () => {
      const milNumber = button.dataset.mil;
      if (confirm('정말로 이 가입자를 삭제하시겠습니까?')) {
        state.users = state.users.filter((item) => item.milNumber !== milNumber);
        saveState();
        renderAdminDetail();
      }
    });
  });

  document.getElementById('addUserDbBtn').addEventListener('click', () => {
    const milNumber = document.getElementById('adminMilNumber').value.trim();
    const name = document.getElementById('adminName').value.trim();
    const birthDate = document.getElementById('adminBirthDate').value;
    const unitCode = document.getElementById('adminUnitCode').value.trim();
    const role = document.getElementById('adminRole').value;
    const enlistDate = document.getElementById('adminEnlistDate').value;
    const dischargeDate = document.getElementById('adminDischargeDate').value;
    if (!milNumber || !name || !birthDate || !unitCode) {
      alert('군번, 이름, 생년월일, 부대 코드는 필수입니다.');
      return;
    }

    if (state.adminEditing) {
      const existing = state.users.find((user) => user.milNumber === state.adminEditing);
      if (existing) {
        existing.milNumber = milNumber;
        existing.name = name;
        existing.birthDate = birthDate;
        existing.unitCode = unitCode;
        existing.role = role;
        existing.enlistDate = enlistDate;
        existing.dischargeDate = dischargeDate;
        state.adminEditing = null;
        resetForm();
        saveState();
        renderAdminDetail();
        alert('가입자 DB가 수정되었습니다.');
        return;
      }
    }

    if (state.users.some((user) => user.milNumber === milNumber && !user.password)) {
      alert('이미 DB에 등록된 군번입니다.');
      return;
    }

    state.users.push({ milNumber, name, birthDate, unitCode, role, enlistDate, dischargeDate, password: null });
    resetForm();
    saveState();
    renderAdminDetail();
    alert('가입자 DB가 추가되었습니다.');
  });

  document.getElementById('cancelAdminEditBtn').addEventListener('click', () => {
    resetForm();
  });

  document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
    downloadUserDbTemplate();
  });
}

function openMenu(menu) {
  state.selectedMenu = menu;
  showScreen(detailScreen);
  switch (menu) {
    case 'leave':
      renderLeaveDetail();
      break;
    case 'letter':
      renderLetterDetail();
      break;
    case 'barber':
      renderBarberDetail();
      break;
    case 'suggestion':
      renderSuggestionDetail();
      break;
    case 'notice':
      renderNoticeDetail();
      break;
    case 'admin':
      renderAdminDetail();
      break;
    default:
      break;
  }
}

document.querySelectorAll('.menu-card').forEach((btn) => {
  btn.addEventListener('click', () => openMenu(btn.dataset.menu));
});

logoutBtn.addEventListener('click', () => {
  state.user = null;
  setAuthState();
});

document.getElementById('backToHomeBtn').addEventListener('click', () => {
  showScreen(homeScreen);
});

document.getElementById('registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const milNumber = document.getElementById('milNumber').value.trim();
  const birthDate = document.getElementById('birthDate').value;
  const unitCode = document.getElementById('unitCode').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('roleSelect').value;
  const enlistDate = document.getElementById('enlistDate').value;
  const dischargeDate = document.getElementById('dischargeDate').value;

  const registerName = document.getElementById('registerName').value.trim();

  if (!milNumber || !registerName || !birthDate || !unitCode || !password) {
    alert('군번, 이름, 생년월일, 부대 코드, 패스워드는 필수입니다.');
    return;
  }
  if (password.length < 4) {
    alert('패스워드는 최소 4자리 이상이어야 합니다.');
    return;
  }

  const matchingDb = state.users.find((user) =>
    user.milNumber === milNumber &&
    user.name === registerName &&
    user.birthDate === birthDate &&
    !user.password
  );
  if (!matchingDb) {
    alert('관리자가 미리 등록한 DB와 일치하는 정보가 필요합니다.');
    return;
  }

  if (role === 'user' && (!enlistDate || !dischargeDate)) {
    alert('용사는 입대일과 전역예정일을 반드시 입력해야 합니다.');
    return;
  }

  matchingDb.unitCode = unitCode;
  matchingDb.password = password;
  matchingDb.role = role;
  matchingDb.enlistDate = enlistDate;
  matchingDb.dischargeDate = dischargeDate;
  saveState();
  event.target.reset();
  updateMilitaryDateFields();
  alert('가입이 완료되었습니다. 로그인 창에서 로그인해 주세요.');
  showScreen(authScreen);
  document.getElementById('loginMilNumber').focus();
});

document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const milNumber = document.getElementById('loginMilNumber').value.trim();
  const password = document.getElementById('loginPassword').value;
  const found = state.users.find((user) => user.milNumber === milNumber);

  if (!found) {
    alert('가입된 계정이 없습니다.');
    return;
  }
  if (!found.password || found.password !== password) {
    alert('패스워드가 일치하지 않습니다.');
    return;
  }
  if (found.role === 'user' && found.dischargeDate && new Date().toISOString().slice(0, 10) >= found.dischargeDate) {
    alert('전역일자가 지나 접속할 수 없습니다.');
    return;
  }

  state.user = found;
  setAuthState();
  showScreen(homeScreen);
  homeScreen.scrollTop = 0;
  logoutBtn.classList.remove('hidden');
  alert('로그인 되었습니다.');
});

document.getElementById('showRegisterBtn').addEventListener('click', () => {
  showRegisterCard();
  document.getElementById('milNumber').focus();
});

const roleSelect = document.getElementById('roleSelect');
const enlistDateInput = document.getElementById('enlistDate');
const dischargeDateInput = document.getElementById('dischargeDate');

function updateMilitaryDateFields() {
  const isSoldier = roleSelect.value === 'user';
  enlistDateInput.disabled = !isSoldier;
  dischargeDateInput.disabled = !isSoldier;
  if (!isSoldier) {
    enlistDateInput.value = '';
    dischargeDateInput.value = '';
  }
}

roleSelect.addEventListener('change', updateMilitaryDateFields);
updateMilitaryDateFields();

setAuthState();
