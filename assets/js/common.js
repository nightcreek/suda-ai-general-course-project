const DEFAULT_API_MODEL = 'gpt-4o-mini';
const SHARED_API_KEY_STORAGE = 'suda_ai_shared_api_key';
const SHARED_API_MODEL_STORAGE = 'suda_ai_shared_api_model';

function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('active'); }
function togglePanel(group, panelId) {
  document.querySelectorAll(`[data-panel-group="${group}"]`).forEach(p => p.classList.remove('active'));
  document.querySelectorAll(`[data-action-group="${group}"]`).forEach(a => a.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  const action = document.querySelector(`[data-opens="${panelId}"]`);
  if (action) action.classList.add('active');
}
function appendMessage(containerId, text, role='assistant') {
  const box = document.getElementById(containerId);
  if (!box) return;
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.textContent = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}
function renderMainNav(active) {
  const items = [
    ['index.html','首页'],
    ['student-profile.html','学生画像'],
    ['learning-plan.html','学习计划'],
    ['ai-chat.html','文件问答'],
    ['math-geogebra.html','数形结合'],
    ['model-description.html','模型说明']
  ];
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  nav.innerHTML = items.map(([href,label]) => `<a class="nav-pill ${active===href?'active':''}" href="${href}">${label}</a>`).join('');
}
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }

function saveSharedApiSession(key, model) {
  sessionStorage.setItem(SHARED_API_KEY_STORAGE, key);
  sessionStorage.setItem(SHARED_API_MODEL_STORAGE, model || DEFAULT_API_MODEL);
}
function loadSharedApiSession() {
  return {
    key: sessionStorage.getItem(SHARED_API_KEY_STORAGE) || '',
    model: sessionStorage.getItem(SHARED_API_MODEL_STORAGE) || DEFAULT_API_MODEL
  };
}
function clearSharedApiSession() {
  sessionStorage.removeItem(SHARED_API_KEY_STORAGE);
  sessionStorage.removeItem(SHARED_API_MODEL_STORAGE);
}
function maskApiKeyForDisplay(key) {
  if (!key) return '未设置';
  if (key.length <= 10) return '已设置';
  return key.slice(0, 6) + '...' + key.slice(-4);
}
function refreshApiStatus(statusId) {
  const session = loadSharedApiSession();
  setText(statusId, session.key ? `API Key：${maskApiKeyForDisplay(session.key)}｜模型：${session.model}` : 'API Key：未设置');
}
function initApiModelInput(modelInputId) {
  const session = loadSharedApiSession();
  const input = document.getElementById(modelInputId);
  if (input) input.value = session.model || DEFAULT_API_MODEL;
}
function saveSharedApiFromInputs(keyInputId, modelInputId, statusId, modalId) {
  const keyInput = document.getElementById(keyInputId);
  const modelInput = document.getElementById(modelInputId);
  const key = keyInput ? keyInput.value.trim() : '';
  const model = modelInput ? modelInput.value.trim() : DEFAULT_API_MODEL;
  if (!key) { alert('请先输入 API Key。'); return false; }
  saveSharedApiSession(key, model || DEFAULT_API_MODEL);
  if (keyInput) keyInput.value = '';
  refreshApiStatus(statusId);
  if (modalId) closeModal(modalId);
  return true;
}
function clearSharedApiForPage(statusId, messageId, messageText) {
  clearSharedApiSession();
  refreshApiStatus(statusId);
  if (messageId) setText(messageId, messageText || 'API Key 会话已清除。');
}
async function callSharedLLM({ system = '', user = '', temperature = 0.3 }) {
  const session = loadSharedApiSession();
  if (!session.key) throw new Error('请先回首页设置 API Key。');
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.key}` },
    body: JSON.stringify({ model: session.model || DEFAULT_API_MODEL, messages, temperature })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
  return data.choices?.[0]?.message?.content || '模型未返回有效内容。';
}
