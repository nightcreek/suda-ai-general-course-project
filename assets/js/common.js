const DEFAULT_API_PROVIDER = 'deepseek';
const DEFAULT_API_MODEL = 'deepseek-chat';
const DEFAULT_API_ENDPOINT = 'https://api.deepseek.com/chat/completions';

const SHARED_API_KEY_STORAGE = 'suda_ai_shared_api_key';
const SHARED_API_MODEL_STORAGE = 'suda_ai_shared_api_model';
const SHARED_API_PROVIDER_STORAGE = 'suda_ai_shared_api_provider';
const SHARED_API_ENDPOINT_STORAGE = 'suda_ai_shared_api_endpoint';

const AI_PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    note: 'DeepSeek 官方 OpenAI-compatible Chat Completions 接口。'
  },
  dashscope: {
    label: '通义千问 / 阿里云百炼',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-plus',
    note: 'DashScope / 阿里云百炼 OpenAI 兼容模式。'
  },
  doubao: {
    label: '豆包 / 火山方舟',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    defaultModel: '',
    note: '火山方舟 OpenAI-compatible 接口。模型名通常填写控制台中的 Endpoint ID 或模型 ID。'
  },
  kimi: {
    label: 'Kimi / Moonshot',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    note: 'Moonshot / Kimi OpenAI-compatible Chat Completions 接口。'
  },
  zhipu: {
    label: '智谱 GLM / BigModel',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
    note: '智谱 OpenAI 兼容接口。不同账号可用模型名以控制台为准。'
  },
  siliconflow: {
    label: 'SiliconFlow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    note: 'SiliconFlow OpenAI-compatible 接口。模型名需按平台模型列表填写。'
  },
  minimax: {
    label: 'MiniMax',
    endpoint: 'https://api.minimax.io/v1/chat/completions',
    defaultModel: 'MiniMax-M2',
    note: 'MiniMax OpenAI-compatible 接口。'
  },
  openrouter: {
    label: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'deepseek/deepseek-chat-v3.1',
    note: 'OpenRouter 可统一接入多家模型，模型名按 OpenRouter 模型 ID 填写。'
  },
  openai: {
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    note: 'OpenAI Chat Completions 接口。'
  },
  custom: {
    label: '自定义 OpenAI-compatible',
    endpoint: '',
    defaultModel: '',
    note: '填写完整 Chat Completions 地址，例如 https://example.com/v1/chat/completions。'
  }
};

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
  if (role === 'assistant') {
    renderRichTextElement(msg, text, { math: false });
  } else {
    msg.textContent = text;
  }
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

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function normalizeLineBreaks(value) {
  return String(value || '').replace(/\\n/g, '\n');
}
function renderFallbackMarkdown(value) {
  const safe = escapeHTML(normalizeLineBreaks(value));
  return safe
    .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
function normalizeLatexSource(tex) {
  return String(tex || '')
    .replace(/\\\\/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceLatexCommandsForFallback(tex) {
  let t = normalizeLatexSource(tex);
  const simpleCommands = {
    '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan', '\\cot': 'cot', '\\sec': 'sec', '\\csc': 'csc',
    '\\ln': 'ln', '\\log': 'log', '\\exp': 'exp', '\\sqrt': '√', '\\pi': 'π', '\\theta': 'θ',
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\lambda': 'λ', '\\mu': 'μ', '\\sigma': 'σ', '\\omega': 'ω', '\\infty': '∞',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\cdot': '·', '\\times': '×',
    '\\to': '→', '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\subseteq': '⊆',
    '\\cup': '∪', '\\cap': '∩', '\\int': '∫', '\\sum': '∑', '\\forall': '∀', '\\exists': '∃'
  };
  // Fractions: repeat to handle nested/simple occurrences.
  for (let i = 0; i < 4; i++) {
    t = t.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span>$1</span><span>$2</span></span>');
  }
  t = t.replace(/\\mathbb\{R\}/g, 'ℝ')
       .replace(/\\mathbb\{Z\}/g, 'ℤ')
       .replace(/\\mathbb\{Q\}/g, 'ℚ')
       .replace(/\\mathbb\{N\}/g, 'ℕ')
       .replace(/\\mathbb\{C\}/g, 'ℂ')
       .replace(/\\text\{([^{}]+)\}/g, '$1')
       .replace(/\\left|\\right/g, '');
  Object.entries(simpleCommands).forEach(([k, v]) => { t = t.split(k).join(v); });
  // Convert common superscript/subscript braces into readable HTML.
  t = t.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>')
       .replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>')
       .replace(/\^([A-Za-z0-9+-])/g, '<sup>$1</sup>')
       .replace(/_([A-Za-z0-9+-])/g, '<sub>$1</sub>')
       .replace(/\\,/g, ' ')
       .replace(/\\;/g, ' ')
       .replace(/\\!/g, '')
       .replace(/\\ /g, ' ')
       .replace(/\\/g, '');
  return t;
}

function renderLatexToHTML(tex, displayMode = false) {
  const source = normalizeLatexSource(tex);
  if (window.katex && typeof window.katex.renderToString === 'function') {
    try {
      return window.katex.renderToString(source, { displayMode, throwOnError: false, strict: false });
    } catch (err) {
      // Fall through to local fallback below.
    }
  }
  const fallback = replaceLatexCommandsForFallback(escapeHTML(source));
  return `<span class="latex-fallback ${displayMode ? 'display' : 'inline'}">${fallback}</span>`;
}

function extractMathPlaceholders(rawText) {
  const source = normalizeLineBreaks(rawText || '');
  const tokens = [];
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;
  const text = source.replace(regex, (token) => {
    let tex = token;
    let displayMode = false;
    if (token.startsWith('$$') && token.endsWith('$$')) {
      tex = token.slice(2, -2); displayMode = true;
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      tex = token.slice(2, -2); displayMode = true;
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      tex = token.slice(2, -2); displayMode = false;
    } else if (token.startsWith('$') && token.endsWith('$')) {
      tex = token.slice(1, -1); displayMode = false;
    }
    const key = `@@MATH_${tokens.length}@@`;
    tokens.push({ key, tex, displayMode });
    return key;
  });
  return { text, tokens };
}

function restoreMathPlaceholders(html, tokens) {
  let output = html;
  tokens.forEach(({ key, tex, displayMode }) => {
    const rendered = renderLatexToHTML(tex, displayMode);
    output = output.split(key).join(rendered);
  });
  return output;
}

function renderRichTextElement(el, rawText, options = {}) {
  if (!el) return;
  const withMath = options.math !== false;
  const extracted = withMath ? extractMathPlaceholders(rawText || '') : { text: normalizeLineBreaks(rawText || ''), tokens: [] };
  let html = '';
  if (window.marked && typeof window.marked.parse === 'function') {
    try {
      html = window.marked.parse(extracted.text, { breaks: true, gfm: true });
    } catch (err) {
      html = renderFallbackMarkdown(extracted.text);
    }
  } else {
    html = renderFallbackMarkdown(extracted.text);
  }
  if (withMath && extracted.tokens.length) {
    html = restoreMathPlaceholders(html, extracted.tokens);
  }
  el.innerHTML = html;
  el.classList.add('rich-text');
}

function renderRichText(id, rawText, options = {}) {
  const el = document.getElementById(id);
  renderRichTextElement(el, rawText, options);
}

function normalizeEndpoint(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) return '';
  return value.replace(/\/+$/, '');
}
function getProviderConfig(provider) {
  return AI_PROVIDERS[provider] || AI_PROVIDERS[DEFAULT_API_PROVIDER];
}
function getProviderLabel(provider) {
  return getProviderConfig(provider).label || provider || '未知平台';
}
function saveSharedApiSession(key, model, provider = DEFAULT_API_PROVIDER, endpoint = '') {
  const cfg = getProviderConfig(provider);
  const finalEndpoint = normalizeEndpoint(endpoint || cfg.endpoint);
  sessionStorage.setItem(SHARED_API_KEY_STORAGE, key);
  sessionStorage.setItem(SHARED_API_MODEL_STORAGE, model || cfg.defaultModel || DEFAULT_API_MODEL);
  sessionStorage.setItem(SHARED_API_PROVIDER_STORAGE, provider || DEFAULT_API_PROVIDER);
  sessionStorage.setItem(SHARED_API_ENDPOINT_STORAGE, finalEndpoint || DEFAULT_API_ENDPOINT);
}
function loadSharedApiSession() {
  const provider = sessionStorage.getItem(SHARED_API_PROVIDER_STORAGE) || DEFAULT_API_PROVIDER;
  const cfg = getProviderConfig(provider);
  return {
    key: sessionStorage.getItem(SHARED_API_KEY_STORAGE) || '',
    model: sessionStorage.getItem(SHARED_API_MODEL_STORAGE) || cfg.defaultModel || DEFAULT_API_MODEL,
    provider,
    endpoint: sessionStorage.getItem(SHARED_API_ENDPOINT_STORAGE) || cfg.endpoint || DEFAULT_API_ENDPOINT
  };
}
function clearSharedApiSession() {
  sessionStorage.removeItem(SHARED_API_KEY_STORAGE);
  sessionStorage.removeItem(SHARED_API_MODEL_STORAGE);
  sessionStorage.removeItem(SHARED_API_PROVIDER_STORAGE);
  sessionStorage.removeItem(SHARED_API_ENDPOINT_STORAGE);
}
function maskApiKeyForDisplay(key) {
  if (!key) return '未设置';
  if (key.length <= 10) return '已设置';
  return key.slice(0, 6) + '...' + key.slice(-4);
}
function refreshApiStatus(statusId) {
  const session = loadSharedApiSession();
  setText(
    statusId,
    session.key
      ? `API Key：${maskApiKeyForDisplay(session.key)}｜平台：${getProviderLabel(session.provider)}｜模型：${session.model}`
      : 'API Key：未设置'
  );
}
function initProviderSelect(providerSelectId) {
  const select = document.getElementById(providerSelectId);
  if (!select) return;
  const session = loadSharedApiSession();
  select.innerHTML = Object.entries(AI_PROVIDERS).map(([key, cfg]) => `<option value="${key}">${cfg.label}</option>`).join('');
  select.value = session.provider || DEFAULT_API_PROVIDER;
}
function syncProviderFields(providerSelectId, endpointInputId, modelInputId, noteId) {
  const providerSelect = document.getElementById(providerSelectId);
  const endpointInput = document.getElementById(endpointInputId);
  const modelInput = document.getElementById(modelInputId);
  const note = document.getElementById(noteId);
  const provider = providerSelect ? providerSelect.value : DEFAULT_API_PROVIDER;
  const cfg = getProviderConfig(provider);
  const session = loadSharedApiSession();
  const isSameProvider = session.provider === provider;

  if (endpointInput) {
    endpointInput.value = isSameProvider ? (session.endpoint || cfg.endpoint || '') : (cfg.endpoint || '');
    endpointInput.placeholder = provider === 'custom' ? 'https://example.com/v1/chat/completions' : (cfg.endpoint || '');
    endpointInput.readOnly = provider !== 'custom';
    endpointInput.classList.toggle('readonly', provider !== 'custom');
  }
  if (modelInput) {
    modelInput.value = isSameProvider ? (session.model || cfg.defaultModel || '') : (cfg.defaultModel || '');
    modelInput.placeholder = cfg.defaultModel || '填写该平台支持的模型名称';
  }
  if (note) note.textContent = cfg.note || '';
}
function initApiSettingsUI(providerSelectId, keyInputId, modelInputId, endpointInputId, noteId) {
  initProviderSelect(providerSelectId);
  syncProviderFields(providerSelectId, endpointInputId, modelInputId, noteId);
  const providerSelect = document.getElementById(providerSelectId);
  if (providerSelect) {
    providerSelect.addEventListener('change', () => syncProviderFields(providerSelectId, endpointInputId, modelInputId, noteId));
  }
}
function initApiModelInput(modelInputId) {
  const session = loadSharedApiSession();
  const input = document.getElementById(modelInputId);
  if (input) input.value = session.model || DEFAULT_API_MODEL;
}
function saveSharedApiFromInputs(keyInputId, modelInputId, statusId, modalId, providerSelectId, endpointInputId) {
  const keyInput = document.getElementById(keyInputId);
  const modelInput = document.getElementById(modelInputId);
  const providerSelect = providerSelectId ? document.getElementById(providerSelectId) : null;
  const endpointInput = endpointInputId ? document.getElementById(endpointInputId) : null;
  const provider = providerSelect ? providerSelect.value : DEFAULT_API_PROVIDER;
  const cfg = getProviderConfig(provider);
  const key = keyInput ? keyInput.value.trim() : '';
  const model = modelInput ? modelInput.value.trim() : cfg.defaultModel || DEFAULT_API_MODEL;
  const endpoint = endpointInput ? normalizeEndpoint(endpointInput.value) : cfg.endpoint;
  if (!key) { alert('请先输入 API Key。'); return false; }
  if (!model) { alert('请填写模型名称。'); return false; }
  if (!endpoint) { alert('请填写接口地址。'); return false; }
  saveSharedApiSession(key, model, provider, endpoint);
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
  if (!session.endpoint) throw new Error('请先设置接口地址。');
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  let response;
  try {
    response = await fetch(session.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.key}` },
      body: JSON.stringify({ model: session.model || DEFAULT_API_MODEL, messages, temperature })
    });
  } catch (err) {
    const raw = err && err.message ? err.message : String(err);
    if (raw.includes('Load failed') || raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
      throw new Error('浏览器请求失败。可能原因：该平台不允许 GitHub Pages 这类前端页面直接跨域调用、接口地址错误，或当前网络无法访问。建议改用 OpenRouter 或支持浏览器前端调用的 OpenAI-compatible 网关。');
    }
    throw err;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
  return data.choices?.[0]?.message?.content || data.output_text || '模型未返回有效内容。';
}
