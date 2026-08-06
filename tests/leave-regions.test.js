const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.dataset = {};
    this.classList = {
      add: () => {},
      remove: () => {},
      toggle: () => false
    };
    this.style = {};
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
    this.id = '';
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
    const tagRegex = /<([a-z0-9]+)([^>]*)>/gi;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(value))) {
      const [, tagName, attributes] = tagMatch;
      const child = new FakeElement(tagName);
      const idMatch = attributes.match(/\bid="([^"]+)"/i);
      const classMatch = attributes.match(/\bclass="([^"]+)"/i);
      const dataIndexMatch = attributes.match(/\bdata-index="([^"]+)"/i);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataIndexMatch) child.dataset.index = dataIndexMatch[1];
      this.appendChild(child);
    }
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    if (!selector) return [];
    const results = [];
    const matches = (node) => {
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return node.className && node.className.split(' ').includes(className);
      }
      return node.tagName.toLowerCase() === selector.toLowerCase();
    };
    const traverse = (node) => {
      for (const child of node.children || []) {
        if (matches(child)) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(type) {
    (this.listeners[type] || []).forEach((handler) => handler({ preventDefault() {} }));
  }
}

function createDocument() {
  const elements = {};
  const make = (id, tagName = 'div') => {
    const element = new FakeElement(tagName);
    element.id = id;
    elements[id] = element;
    return element;
  };

  make('authScreen');
  make('homeScreen');
  make('detailScreen');
  make('logoutBtn', 'button');
  make('detailTitle', 'h2');
  make('detailContent', 'div');
  make('userGreeting', 'p');
  make('userInfoText', 'p');
  make('registerCard', 'div');
  make('showRegisterBtn', 'button');
  make('registerForm', 'form');
  make('loginForm', 'form');
  make('loginMilNumber', 'input');
  make('loginPassword', 'input');
  make('barberDate', 'input');
  make('barberNote', 'textarea');
  make('barberBookBtn', 'button');
  make('roleSelect', 'select');
  make('enlistDate', 'input');
  make('dischargeDate', 'input');
  make('backToHomeBtn', 'button');

  const document = {
    getElementById(id) {
      if (elements[id]) return elements[id];
      const findById = (node) => {
        for (const child of node.children || []) {
          if (child.id === id) return child;
          const found = findById(child);
          if (found) return found;
        }
        return null;
      };
      for (const element of Object.values(elements)) {
        const found = findById(element);
        if (found) return found;
      }
      return null;
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelectorAll(selector) {
      return Object.values(elements).flatMap((element) => element.querySelectorAll(selector));
    },
    body: new FakeElement('body')
  };

  return { document, elements };
}

const { document, elements } = createDocument();
const localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); }
};

const context = {
  console,
  document,
  localStorage,
  window: {},
  alert: () => {},
  confirm: () => true,
  setTimeout,
  clearTimeout,
  URL: { createObjectURL: () => 'blob:test' },
  Blob: class Blob {}
};
context.global = context;
context.globalThis = context;

const scriptPath = path.join(__dirname, '..', 'script.js');
const script = fs.readFileSync(scriptPath, 'utf8');
vm.createContext(context);
vm.runInContext(script, context);

const state = vm.runInContext('state', context);
context.state = state;
state.user = { milNumber: 'u1', role: '용사' };
vm.runInContext('renderLeaveDetail()', context);

const rendered = elements.detailContent.children[0].innerHTML;
assert.ok(rendered.includes('value="세종"'), '세종 지역 옵션이 포함되어야 합니다.');
const regionSelect = document.getElementById('leaveRegion');
regionSelect.value = '세종';
regionSelect.dispatchEvent('change');
const subregionSelect = document.getElementById('leaveSubregion');
assert.ok(subregionSelect.innerHTML.includes('조치원읍'), '세종 하위 지역이 생성되어야 합니다.');

state.requests = [
  { type: '외박', region: '서울', subregion: '강남구', startDate: '2026-08-01', endDate: '2026-08-02', reason: '테스트1', status: '승인대기', author: 'u2' },
  { type: '외박', region: '서울', subregion: '강남구', startDate: '2026-08-03', endDate: '2026-08-04', reason: '테스트2', status: '승인대기', author: 'u1' }
];
state.user = { milNumber: 'u1', role: '용사' };
vm.runInContext('renderLeaveDetail()', context);
const cancelButtons = document.querySelectorAll('.cancel-leave');
assert.ok(cancelButtons.length > 0, '취소 버튼이 표시되어야 합니다.');
cancelButtons[0].dispatchEvent('click');
assert.strictEqual(state.requests[1].status, '취소', '내 신청은 취소 처리되어야 합니다.');
assert.strictEqual(state.requests[0].status, '승인대기', '다른 사용자의 신청은 변경되면 안 됩니다.');
console.log('leave region test passed');
