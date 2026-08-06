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
    this.innerHTML = '';
    this.id = '';
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

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
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
      return elements[id] || null;
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelectorAll() {
      return [];
    },
    body: new FakeElement('body')
  };

  const baseElement = new FakeElement('div');
  baseElement.querySelector = () => null;
  baseElement.querySelectorAll = () => [];
  elements.registerForm.querySelector = () => null;
  elements.loginForm.querySelector = () => null;

  return { document, elements };
}

const { document, elements } = createDocument();
const localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); }
};

const alerts = [];
const context = {
  console,
  document,
  localStorage,
  window: {},
  alert: (msg) => alerts.push(msg),
  confirm: () => true,
  setTimeout,
  clearTimeout,
  URL: { createObjectURL: () => 'blob:test' },
  Blob: class Blob {},
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
vm.runInContext('renderBarberDetail()', context);

const button = elements.barberBookBtn;
const dateInput = elements.barberDate;
const noteInput = elements.barberNote;
dateInput.value = '2026-08-10';
noteInput.value = '정리 부탁';
button.dispatchEvent('click');

assert.ok(state.barberBookings.length === 1, '이발소 신청이 저장되어야 합니다.');
console.log('barber booking test passed');
