console.log('script.js loaded');
function normalizeRole(role) {
  if (!role || typeof role !== 'string') return role;
  if (role === '관리자') return 'admin';
  if (role === '지휘자') return 'commander';
  if (role === '간부') return 'officer';
  if (role === '용사' || role === '일반사용자' || role === '일반 사용자') return 'user';
  return role;
}

function normalizeUser(user) {
  return {
    ...user,
    role: normalizeRole(user.role)
  };
}

function loadStateArray(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object');
    return [];
  } catch (error) {
    console.warn(`Failed to parse localStorage[${key}]:`, error);
    return [];
  }
}

const DEFAULT_ADMIN = {
  milNumber: 'admin',
  name: '관리자',
  birthDate: '1990-01-01',
  unitCode: '본부',
  role: 'admin',
  enlistDate: '',
  dischargeDate: '',
  password: 'admin1234'
};

function canManageNotices() {
  return ['admin', 'commander'].includes(normalizeRole(state.user?.role));
}

const state = {
  user: null,
  selectedMenu: null,
  adminEditing: null,
  users: loadStateArray('users').map(normalizeUser),
  commanderRequests: loadStateArray('commanderRequests'),
  requests: loadStateArray('leaveRequests'),
  letters: loadStateArray('letters'),
  suggestions: loadStateArray('suggestions'),
  notices: loadStateArray('notices'),
  barberBookings: loadStateArray('barberBookings'),
  letterCommentEditingIndex: null
};

function ensureDefaultAdmin() {
  const hasAdmin = state.users.some((user) => normalizeRole(user.role) === 'admin' && user.password);
  if (!hasAdmin) {
    const existingAdmin = state.users.find((user) => normalizeRole(user.role) === 'admin');
    if (existingAdmin) {
      if (!existingAdmin.password || existingAdmin.password === 'admin123') {
        existingAdmin.password = DEFAULT_ADMIN.password;
      }
      existingAdmin.name = existingAdmin.name || DEFAULT_ADMIN.name;
      existingAdmin.birthDate = existingAdmin.birthDate || DEFAULT_ADMIN.birthDate;
      existingAdmin.unitCode = existingAdmin.unitCode || DEFAULT_ADMIN.unitCode;
    } else {
      state.users.push({ ...DEFAULT_ADMIN });
    }
    saveState();
  }
}

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
  localStorage.setItem('commanderRequests', JSON.stringify(state.commanderRequests));
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
      const roleLabel = state.user.role === 'admin' ? '관리자' : state.user.role === 'commander' ? '지휘자' : state.user.role === 'officer' ? '간부' : '용사';
      userGreeting.textContent = `${state.user.name || ''} ${roleLabel}님`;
    }
    if (userInfoText) {
      userInfoText.textContent = `${state.user.milNumber} · ${state.user.unitCode}`;
    }
    if (adminCard) {
      adminCard.classList.toggle('hidden', !['admin', 'commander'].includes(state.user.role));
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
  const currentRole = normalizeRole(state.user?.role);

  if (['user', 'officer', 'commander', 'admin'].includes(currentRole)) {
    const leaveRegions = {
      서울: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
      경기: ['수원시', '성남시', '고양시', '용인시', '화성시', '안산시', '안양시', '부천시', '광명시', '평택시', '의정부시', '남양주시', '군포시', '시흥시', '김포시', '파주시', '이천시', '오산시', '하남시', '구리시', '양평군', '양주시', '포천시', '동두천시', '가평군', '연천군', '과천시', '의왕시'],
      인천: ['연수구', '남동구', '부평구', '계양구', '서구', '중구', '동구', '미추홀구', '강화군', '옹진군'],
      세종: ['조치원읍', '연기면', '연동면', '부강면', '금남면', '장군면', '전의면', '전동면', '소정면', '한솔동', '도담동', '해밀동', '새롬동', '아름동', '종촌동', '고운동', '보람동', '대평동', '다정동'],
      대전: ['유성구', '서구', '중구', '동구', '대덕구'],
      대구: ['수성구', '달서구', '중구', '동구', '북구', '남구'],
      부산: ['해운대구', '수영구', '동래구', '부산진구', '사상구', '금정구', '남구', '북구', '강서구', '연제구', '사하구', '기장군'],
      광주: ['북구', '동구', '서구', '남구', '광산구'],
      울산: ['남구', '동구', '중구', '북구', '울주군'],
      강원: ['춘천시', '강릉시', '원주시', '속초시', '동해시', '태백시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
      충남: ['천안시', '아산시', '공주시', '보령시', '서산시', '논산시', '계룡시', '당진시', '홍성군', '예산군', '태안군', '청양군', '부여군'],
      충북: ['청주시', '충주시', '제천시', '음성군', '진천군', '괴산군', '단양군', '보은군', '옥천군', '영동군', '증평군'],
      전남: ['여수시', '목포시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
      전북: ['전주시', '군산시', '익산시', '정읍시', '김제시', '남원시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
      경남: ['창원시', '진주시', '김해시', '양산시', '거제시', '통영시', '사천시', '밀양시', '거창군', '합천군', '창녕군', '고성군', '남해군', '하동군', '함안군', '함양군', '산청군'],
      경북: ['포항시', '구미시', '경주시', '김천시', '안동시', '영주시', '상주시', '문경시', '예천군', '봉화군', '울진군', '울릉군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '군위군'],
      제주: ['제주시', '서귀포시']
    };

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
            ${Object.keys(leaveRegions).map((region) => `<option value="${region}">${region}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="inline-row">
        <label>하위 지역
          <select id="leaveSubregion"></select>
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

    const leaveRegionSelect = document.getElementById('leaveRegion');
    const leaveSubregionSelect = document.getElementById('leaveSubregion');
    const updateSubregionOptions = () => {
      const selectedRegion = leaveRegionSelect.value;
      const subregions = leaveRegions[selectedRegion] || [];
      leaveSubregionSelect.innerHTML = subregions.map((subregion) => `<option value="${subregion}">${subregion}</option>`).join('');
    };
    leaveRegionSelect.addEventListener('change', updateSubregionOptions);
    updateSubregionOptions();
  }

  const approvalList = createElement('div', 'card');
  approvalList.innerHTML = '<h3>출타 신청 현황</h3>';
  const list = createElement('div');
  const visibleRequests = currentRole === 'commander' || currentRole === 'admin'
    ? state.requests
    : state.requests.filter((item) => item.author === state.user.milNumber);

  if (!visibleRequests.length) {
    list.innerHTML = '<div>확인 가능한 신청 내역이 없습니다.</div>';
  } else {
    visibleRequests.forEach((item) => {
      const row = createElement('div', 'list-box');
      const requestIndex = state.requests.findIndex((request) => request === item);
      const subregionText = item.subregion ? ` / ${item.subregion}` : '';
      const statusClass = item.status === '승인'
        ? 'status status-complete'
        : item.status === '반려' || item.status === '취소'
          ? 'status status-pending'
          : 'status';
      const commentText = item.comment ? `<br/><strong>댓글:</strong> ${item.comment}` : '';
      const canCancel = item.status === '승인대기' && (currentRole === 'commander' || currentRole === 'admin' || item.author === state.user.milNumber);
      const isCancelled = item.status === '취소';
      const rowClass = isCancelled ? 'leave-cancelled' : '';
      row.innerHTML = `<div class="${rowClass}"><strong>${item.type}</strong> · ${item.startDate} ~ ${item.endDate}<br/>${item.region}${subregionText} · ${item.reason}<br/>작성자: ${item.author}${commentText}<br/><span class="${statusClass}">${item.status}</span></div>`;
      if (!isCancelled && (currentRole === 'commander' || currentRole === 'admin') && item.status === '승인대기') {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-leave" data-index="${requestIndex}">승인</button><button class="ghost-btn danger-btn reject-leave" data-index="${requestIndex}">반려</button></div>`;
      }
      if (!isCancelled && canCancel) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn danger-btn cancel-leave" data-index="${requestIndex}">취소</button></div>`;
      }
      if (currentRole === 'commander' || currentRole === 'admin') {
        if (!item.comment) {
          row.innerHTML += `<label>관리자 댓글<br/><textarea id="leaveComment-${requestIndex}" class="comment-textarea" placeholder="댓글을 입력해 주세요."></textarea></label><button class="ghost-btn save-leave-comment" data-index="${requestIndex}">댓글 저장</button>`;
        }
      }
      list.appendChild(row);
    });
  }
  approvalList.appendChild(list);
  detailContent.appendChild(approvalList);

  if (['user', 'officer', 'commander', 'admin'].includes(currentRole)) {
    document.getElementById('requestLeaveBtn').addEventListener('click', () => {
      const type = document.getElementById('leaveType').value;
      const region = document.getElementById('leaveRegion').value;
      const subregion = document.getElementById('leaveSubregion')?.value || '';
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const reason = document.getElementById('leaveReason').value;
      if (!startDate || !endDate || !reason) {
        alert('필수 항목을 모두 입력해 주세요.');
        return;
      }

      state.requests.push({ type, region, subregion, startDate, endDate, reason, status: '승인대기', author: state.user.milNumber });
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
      state.requests[index].status = '반려';
      saveState();
      renderLeaveDetail();
    });
  });

  document.querySelectorAll('.cancel-leave').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.requests[index].status = '취소';
      saveState();
      renderLeaveDetail();
    });
  });

  document.querySelectorAll('.save-leave-comment').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const commentTextarea = document.getElementById(`leaveComment-${index}`);
      if (!commentTextarea) return;
      state.requests[index].comment = commentTextarea.value.trim();
      saveState();
      renderLeaveDetail();
      alert('댓글이 저장되었습니다.');
    });
  });
}

function renderLetterDetail() {
  detailTitle.textContent = '대장과의 대화';
  detailContent.innerHTML = '';
  const currentRole = normalizeRole(state.user?.role);
  detailContent.innerHTML = `
    <label>비밀글 작성
      <textarea id="letterText" placeholder="대장에게 남길 내용을 입력해 주세요."></textarea>
    </label>
    <button id="submitLetterBtn" class="primary-btn">보내기</button>
  `;

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>대장과의 대화 목록</h3>';
  const visibleLetters = state.letters.slice();

  if (!visibleLetters.length) {
    list.innerHTML += '<div>확인 가능한 대화가 없습니다.</div>';
  } else {
    visibleLetters.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      const statusText = item.status || '검토중';
      const statusClass = statusText === '검토중' ? 'status status-pending' : statusText === '처리완료' ? 'status status-complete' : 'status';
      const canViewLetterContent = ['commander', 'admin'].includes(currentRole) || item.author === state.user?.milNumber;
      const contentText = canViewLetterContent ? item.text : '내용은 확인할 수 없습니다.';
      const badgeText = `작성자${item.author === state.user?.milNumber ? ' 본인' : ''}${['commander', 'admin'].includes(currentRole) ? ' · 지휘관 확인 가능' : ''}`;
      const comments = Array.isArray(item.comments) ? item.comments : [];
      const commentList = canViewLetterContent && comments.length
        ? comments.map((comment) => `<div class="list-box"><strong>댓글</strong><br/>${comment}</div>`).join('')
        : '';
      const isCommentEditing = ['commander', 'admin'].includes(currentRole) && state.letterCommentEditingIndex === index;
      const commentInputHtml = ['commander', 'admin'].includes(currentRole) && (comments.length === 0 || isCommentEditing)
        ? `<label>지휘자 댓글<br/><textarea id="letterComment-${index}" class="comment-textarea" placeholder="댓글을 입력해 주세요."></textarea></label><button class="ghost-btn save-letter-comment" data-index="${index}">댓글 저장</button>`
        : '';
      const addButtonHtml = ['commander', 'admin'].includes(currentRole) && comments.length > 0 && !isCommentEditing
        ? `<div class="action-row"><button class="ghost-btn add-letter-comment" data-index="${index}">댓글 추가</button></div>`
        : '';
      row.innerHTML = `<strong>${item.author}</strong><br/>${contentText}<br/><span class="${statusClass}">${statusText}</span><br/><span class="badge">${badgeText}</span>${commentList}${commentInputHtml}${addButtonHtml}`;
      if (['commander', 'admin'].includes(currentRole)) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn review-letter" data-index="${index}">검토중</button><button class="ghost-btn primary-btn complete-letter" data-index="${index}">처리완료</button></div>`;
      }
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
    state.letters.push({ author: state.user.milNumber, text, status: '검토중' });
    saveState();
    renderLetterDetail();
    alert('비밀글이 전송되었습니다.');
  });

  document.querySelectorAll('.review-letter').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.letters[index].status = '검토중';
      saveState();
      renderLetterDetail();
    });
  });

  document.querySelectorAll('.complete-letter').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.letters[index].status = '처리완료';
      saveState();
      renderLetterDetail();
    });
  });

  document.querySelectorAll('.add-letter-comment').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.letterCommentEditingIndex = index;
      renderLetterDetail();
    });
  });

  document.querySelectorAll('.save-letter-comment').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const commentTextarea = document.getElementById(`letterComment-${index}`);
      if (!commentTextarea) return;
      const comment = commentTextarea.value.trim();
      if (!comment) {
        alert('댓글 내용을 입력해 주세요.');
        return;
      }
      if (!Array.isArray(state.letters[index].comments)) {
        state.letters[index].comments = [];
      }
      state.letters[index].comments.push(comment);
      state.letterCommentEditingIndex = null;
      saveState();
      renderLetterDetail();
      alert('댓글이 저장되었습니다.');
    });
  });
}

function renderBarberDetail() {
  detailTitle.textContent = '이발소 신청';
  detailContent.innerHTML = '';
  const currentRole = normalizeRole(state.user?.role);
  const canSubmitBarber = ['user', 'officer', 'commander', 'admin'].includes(currentRole);
  if (canSubmitBarber) {
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
  const visibleBookings = state.barberBookings.slice();

  if (!visibleBookings.length) {
    list.innerHTML += '<div>확인 가능한 예약 내역이 없습니다.</div>';
  } else {
    visibleBookings.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      const bookingStatus = item.status === '승인' ? '신청완료' : item.status === '거절' ? '재신청요망' : item.status || '신청대기';
      const statusClass = item.status === '승인'
        ? 'status status-complete'
        : item.status === '거절'
          ? 'status status-pending'
          : 'status';
      const commentText = item.comment ? `<br/><strong>댓글:</strong> ${item.comment}` : '';
      row.innerHTML = `<strong>${item.date}</strong><br/>${item.note}<br/>${item.author ? '작성자: ' + item.author + '<br/>' : ''}${commentText}<br/><span class="${statusClass}">${bookingStatus}</span>`;
      if ((state.user.role === 'commander' || state.user.role === 'admin') && (item.status === '승인대기' || !item.status || item.status)) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-barber" data-index="${index}">신청완료</button><button class="ghost-btn danger-btn reject-barber" data-index="${index}">재신청요망</button></div>`;
        if (!item.comment) {
          row.innerHTML += `<label>관리자 댓글<br/><textarea id="barberComment-${index}" class="comment-textarea" placeholder="댓글을 입력해 주세요."></textarea></label><button class="ghost-btn save-barber-comment" data-index="${index}">댓글 저장</button>`;
        }
      }
      list.appendChild(row);
    });
  }
  detailContent.appendChild(list);

  if (canSubmitBarber) {
    document.getElementById('barberBookBtn')?.addEventListener('click', () => {
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
  document.querySelectorAll('.save-barber-comment').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const commentTextarea = document.getElementById(`barberComment-${index}`);
      if (!commentTextarea) return;
      state.barberBookings[index].comment = commentTextarea.value.trim();
      saveState();
      renderBarberDetail();
      alert('댓글이 저장되었습니다.');
    });
  });
}

function renderSuggestionDetail() {
  detailTitle.textContent = '건의사항';
  detailContent.innerHTML = '';
  const currentRole = normalizeRole(state.user?.role);
  const canSubmitSuggestion = ['user', 'officer', 'commander', 'admin'].includes(currentRole);
  if (canSubmitSuggestion) {
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
  const visibleSuggestions = state.suggestions.slice();

  if (!visibleSuggestions.length) {
    list.innerHTML += '<div>확인 가능한 건의사항이 없습니다.</div>';
  } else {
    visibleSuggestions.forEach((item, index) => {
      const row = createElement('div', 'list-box');
      const statusClass = item.status === '미승인'
        ? 'status status-pending'
        : item.status === '조치완료'
          ? 'status status-complete'
          : 'status';
      const commentList = Array.isArray(item.comments) && item.comments.length
        ? item.comments.map((comment) => `<div class="list-box"><strong>댓글</strong><br/>${comment}</div>`).join('')
        : '';
      const isAdmin = ['commander', 'admin'].includes(currentRole);
      const commentInputHtml = isAdmin && (!Array.isArray(item.comments) || item.comments.length === 0)
        ? `<label>관리자 댓글<br/><textarea id="suggestionComment-${index}" class="comment-textarea" placeholder="댓글을 입력해 주세요."></textarea></label><button class="ghost-btn save-suggestion-comment" data-index="${index}">댓글 저장</button>`
        : '';
      row.innerHTML = `<strong>${item.title}</strong><br/>${item.text}<br/>${item.author ? '작성자: ' + item.author + '<br/>' : ''}<span class="${statusClass}">${item.status || '검토중'}</span>${commentList}${commentInputHtml}`;
      if (isAdmin && (item.status === '검토중' || !item.status)) {
        row.innerHTML += `<div class="action-row"><button class="ghost-btn approve-suggestion" data-index="${index}">조치완료</button><button class="ghost-btn danger-btn reject-suggestion" data-index="${index}">미승인</button></div>`;
      }
      list.appendChild(row);
    });
  }
  detailContent.appendChild(list);

  if (['user', 'officer', 'commander', 'admin'].includes(state.user.role)) {
    document.getElementById('submitSuggestionBtn')?.addEventListener('click', () => {
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
      state.suggestions[index].status = '조치완료';
      saveState();
      renderSuggestionDetail();
    });
  });
  document.querySelectorAll('.reject-suggestion').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      state.suggestions[index].status = '미승인';
      saveState();
      renderSuggestionDetail();
    });
  });
  document.querySelectorAll('.save-suggestion-comment').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const commentTextarea = document.getElementById(`suggestionComment-${index}`);
      if (!commentTextarea) return;
      const comment = commentTextarea.value.trim();
      if (!comment) {
        alert('댓글 내용을 입력해 주세요.');
        return;
      }
      if (!Array.isArray(state.suggestions[index].comments)) {
        state.suggestions[index].comments = [];
      }
      state.suggestions[index].comments.push(comment);
      saveState();
      renderSuggestionDetail();
      alert('댓글이 저장되었습니다.');
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
        <option value="user">용사</option>
        <option value="officer">간부</option>
        <option value="commander">지휘자</option>
        <option value="admin">관리자</option>
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

  const requestSection = createElement('div', 'card');
  if (['admin', 'commander'].includes(state.user.role)) {
    requestSection.innerHTML = '<h3>지휘자 교체 요청</h3>';
    const requestList = createElement('div');
    if (state.commanderRequests.length === 0) {
      requestList.innerHTML = '<div>현재 대기 중인 지휘자 교체 요청이 없습니다.</div>';
    } else {
      state.commanderRequests.forEach((request, index) => {
        const row = createElement('div', 'list-box');
        row.innerHTML = `<strong>${request.name}</strong> · ${request.milNumber}<br/>${request.unitCode} · ${request.birthDate}<br/>상태: ${request.status}`;
        if (request.status === '승인대기') {
          row.innerHTML += `<div class="action-row"><button class="ghost-btn primary-btn approve-commander" data-index="${index}">승인</button></div>`;
        }
        requestList.appendChild(row);
      });
    }
    requestSection.appendChild(requestList);
    detailContent.appendChild(requestSection);
  }

  const list = createElement('div', 'card');
  list.innerHTML = '<h3>등록된 가입자</h3>';
  const table = createElement('div', 'list-box');
  table.innerHTML = state.users.length ? state.users.map((user) => {
    const active = user.role === 'user' && user.dischargeDate && new Date().toISOString().slice(0, 10) >= user.dischargeDate ? ' (접속불가)' : '';
    const withdrawn = user.password ? '' : ' (탈퇴/비활성)';
    return `<div class="admin-user-row"><div><strong>${user.milNumber}</strong> · ${user.role}${active}${withdrawn}<br/>${user.name || ''} · ${user.unitCode} · ${user.birthDate}${user.enlistDate ? '<br/>입대: ' + user.enlistDate : ''}${user.dischargeDate ? ' · 전역: ' + user.dischargeDate : ''}</div><div class="admin-user-actions"><button class="ghost-btn edit-user" data-mil="${user.milNumber}">수정</button><button class="ghost-btn danger-btn delete-user" data-mil="${user.milNumber}">삭제</button></div></div>`;
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

  document.querySelectorAll('.approve-commander').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const request = state.commanderRequests[index];
      if (!request) return;

      const currentCommander = state.users.find((user) => normalizeRole(user.role) === 'commander' && user.password);
      if (currentCommander) {
        currentCommander.password = null;
        currentCommander.role = 'user';
      }

      const existingRequestUser = state.users.find((user) => user.milNumber === request.milNumber);
      if (existingRequestUser) {
        existingRequestUser.name = request.name;
        existingRequestUser.birthDate = request.birthDate;
        existingRequestUser.unitCode = request.unitCode;
        existingRequestUser.role = 'commander';
        existingRequestUser.enlistDate = request.enlistDate;
        existingRequestUser.dischargeDate = request.dischargeDate;
        existingRequestUser.password = request.password;
      } else {
        state.users.push({
          milNumber: request.milNumber,
          name: request.name,
          birthDate: request.birthDate,
          unitCode: request.unitCode,
          role: 'commander',
          enlistDate: request.enlistDate,
          dischargeDate: request.dischargeDate,
          password: request.password
        });
      }

      request.status = '승인';
      saveState();

      const isApprovingSelf = state.user && currentCommander && state.user.milNumber === currentCommander.milNumber;
      if (isApprovingSelf) {
        alert('새 지휘자가 승인되었습니다. 이전 지휘자는 탈퇴 처리되었습니다. 다시 로그인해 주세요.');
        state.user = null;
        setAuthState();
        showScreen(authScreen);
        return;
      }

      alert('지휘자 교체 요청이 승인되었습니다.');
      renderAdminDetail();
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

const registerForm = document.getElementById('registerForm');
const registerSubmitButton = registerForm?.querySelector('button[type="submit"]');

if (!registerForm) {
  console.error('registerForm element not found');
} else {
  console.log('registerForm handler attached');
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const milNumber = document.getElementById('milNumber').value.trim();
      const birthDate = document.getElementById('birthDate').value;
      const unitCode = document.getElementById('unitCode').value.trim();
      const password = document.getElementById('registerPassword').value;
      const role = document.getElementById('roleSelect').value;
      const enlistDate = document.getElementById('enlistDate').value;
      const dischargeDate = document.getElementById('dischargeDate').value;

      const registerName = document.getElementById('registerName').value.trim();

    if (!milNumber) {
      alert('군번을 입력해 주세요.');
      return;
    }
    if (!registerName) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (!birthDate) {
      alert('생년월일을 선택해 주세요.');
      return;
    }
    if (!unitCode) {
      alert('부대 코드를 입력해 주세요.');
      return;
    }
    if (!password) {
      alert('패스워드를 입력해 주세요.');
      return;
    }
    if (password.length < 4) {
      alert('패스워드는 최소 4자리 이상이어야 합니다.');
      return;
    }

    if (role === 'user' && (!enlistDate || !dischargeDate)) {
      if (!enlistDate && !dischargeDate) {
        alert('입대일과 전역예정일을 모두 입력해 주세요.');
      } else if (!enlistDate) {
        alert('입대일을 입력해 주세요.');
      } else {
        alert('전역예정일을 입력해 주세요.');
      }
      return;
    }

    const matchingDb = state.users.find((user) =>
      user.milNumber === milNumber &&
      user.name === registerName &&
      user.birthDate === birthDate &&
      normalizeRole(user.role) === normalizeRole(role) &&
      !user.password
    );

    const existingDbEntry = state.users.find((user) =>
      user.milNumber === milNumber &&
      user.name === registerName &&
      user.birthDate === birthDate &&
      !user.password
    );

    if (existingDbEntry && !matchingDb) {
      alert(`관리자 DB에 등록된 직책은 '${existingDbEntry.role}'입니다. 신청 화면의 직책과 일치시켜 주세요.`);
      return;
    }

    const existingCommander = state.users.find((user) => normalizeRole(user.role) === 'commander' && user.password);
    if (role === 'commander' && existingCommander) {
      if (!matchingDb) {
        alert('지휘자 교체 요청은 관리자 DB에 등록된 군번, 이름, 생년월일, 직책 정보가 모두 일치해야 합니다. 관리자에게 확인해 주세요.');
        return;
      }

      const duplicateRequest = state.commanderRequests.find((request) => request.milNumber === milNumber && request.status === '승인대기');
      if (duplicateRequest) {
        alert('이미 지휘자 교체 요청이 접수되어 있습니다.');
        return;
      }

      state.commanderRequests.push({
        milNumber,
        name: registerName,
        birthDate,
        unitCode,
        role,
        enlistDate: enlistDate || '',
        dischargeDate: dischargeDate || '',
        password,
        status: '승인대기'
      });

      saveState();
      event.target.reset();
      updateMilitaryDateFields();
      alert('지휘자 교체 요청이 접수되었습니다. 이전 지휘자의 승인을 기다려 주세요.');
      showScreen(authScreen);
      document.getElementById('loginMilNumber').focus();
      return;
    }

    const isFirstAdminSignup = role === 'admin' && !state.users.some((user) => user.role === 'admin' && user.password);

    if (!matchingDb && !isFirstAdminSignup) {
      alert('관리자가 사전에 등록한 가입자 DB 정보와 일치하지 않습니다. 관리자에게 등록 정보를 확인해 주세요.');
      return;
    }

    if (matchingDb) {
      matchingDb.unitCode = unitCode;
      matchingDb.password = password;
      matchingDb.role = role;
      matchingDb.enlistDate = enlistDate;
      matchingDb.dischargeDate = dischargeDate;
    } else {
      state.users.push({
        milNumber,
        name: registerName,
        birthDate,
        unitCode,
        role,
        enlistDate: enlistDate || '',
        dischargeDate: dischargeDate || '',
        password
      });
    }

    saveState();
    event.target.reset();
    updateMilitaryDateFields();
    alert('가입이 완료되었습니다. 로그인 창에서 로그인해 주세요.');
    showScreen(authScreen);
    document.getElementById('loginMilNumber').focus();
  } catch (error) {
    console.error('Registration error:', error);
    alert('가입 처리 중 오류가 발생했습니다. 입력값을 확인하거나 콘솔을 확인해 주세요.');
  }
  });
}

if (registerSubmitButton) {
  registerSubmitButton.addEventListener('click', () => console.log('register button clicked'));
}

const loginForm = document.getElementById('loginForm');
if (!loginForm) {
  console.error('loginForm element not found');
} else {
  console.log('loginForm handler attached');
}

const loginSubmitButton = loginForm?.querySelector('button[type="submit"]');
if (loginSubmitButton) {
  console.log('login submit button found');
  loginSubmitButton.addEventListener('click', () => console.log('login button clicked'));
} else {
  console.warn('login submit button not found');
}

function handleLoginSubmit(event) {
  if (event) event.preventDefault();
  console.log('login submit triggered');
  const milNumber = document.getElementById('loginMilNumber').value.trim();
  const password = document.getElementById('loginPassword').value;
  const adminLogin = milNumber === DEFAULT_ADMIN.milNumber && password === DEFAULT_ADMIN.password;
  let found = state.users.find((user) => user.milNumber === milNumber);

  if (!found && adminLogin) {
    found = { ...DEFAULT_ADMIN };
    state.users.push(found);
    saveState();
  }

  if (!found) {
    alert('가입된 계정이 없습니다.');
    return;
  }

  if (!found.password || found.password !== password) {
    if (adminLogin) {
      found.password = DEFAULT_ADMIN.password;
      found.role = 'admin';
      found.name = found.name || DEFAULT_ADMIN.name;
      found.birthDate = found.birthDate || DEFAULT_ADMIN.birthDate;
      found.unitCode = found.unitCode || DEFAULT_ADMIN.unitCode;
      saveState();
    } else {
      alert('패스워드가 일치하지 않습니다.');
      return;
    }
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
}

document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);

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

ensureDefaultAdmin();
setAuthState();
