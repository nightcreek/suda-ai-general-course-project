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

const SHARED_API_KEY_STORAGE = "suda_ai_shared_api_key";
const SHARED_API_MODEL_STORAGE = "suda_ai_shared_api_model";
function saveSharedApiSession(key, model) {
  sessionStorage.setItem(SHARED_API_KEY_STORAGE, key);
  sessionStorage.setItem(SHARED_API_MODEL_STORAGE, model || "gpt-4o-mini");
}
function loadSharedApiSession() {
  return {
    key: sessionStorage.getItem(SHARED_API_KEY_STORAGE) || "",
    model: sessionStorage.getItem(SHARED_API_MODEL_STORAGE) || "gpt-4o-mini"
  };
}
function clearSharedApiSession() {
  sessionStorage.removeItem(SHARED_API_KEY_STORAGE);
  sessionStorage.removeItem(SHARED_API_MODEL_STORAGE);
}
function maskApiKeyForDisplay(key) {
  if (!key) return "未设置";
  if (key.length <= 10) return "已设置";
  return key.slice(0, 6) + "..." + key.slice(-4);
}
