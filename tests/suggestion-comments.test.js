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
    this.className = '';
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
state.suggestions = [{ title: '식당 개선', text: '급식 개선 요청', author: 'u2', status: '검토중' }];
vm.runInContext('renderSuggestionDetail()', context);

const visibleRows = elements.detailContent.querySelectorAll('.list-box');
assert.ok(visibleRows.length >= 1, '모든 사용자가 건의사항 목록을 볼 수 있어야 합니다.');
assert.ok(elements.detailContent.innerHTML.includes('식당 개선'), '다른 사람의 건의사항도 목록에 보이도록 해야 합니다.');

state.user = { milNumber: 'a1', role: 'admin' };
state.suggestions = [{ title: '식당 개선', text: '급식 개선 요청', author: 'u2', status: '검토중', comments: ['기존 답변'] }];
vm.runInContext('renderSuggestionDetail()', context);
const commentInput = document.getElementById('suggestionComment-0');
assert.ok(commentInput, '관리자는 기존 댓글이 있어도 댓글 입력창을 볼 수 있어야 합니다.');
commentInput.value = '관리자 답변';
const saveButton = document.querySelectorAll('.save-suggestion-comment')[0];
saveButton.dispatchEvent('click');

assert.ok(state.suggestions[0].comments && state.suggestions[0].comments.includes('관리자 답변'), '관리자 댓글이 저장되어야 합니다.');
console.log('suggestion comment test passed');
