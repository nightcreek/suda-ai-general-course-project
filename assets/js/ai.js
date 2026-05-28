let userApiKey = '';
let apiModel = DEFAULT_API_MODEL;
let apiProvider = DEFAULT_API_PROVIDER;
let apiEndpoint = DEFAULT_API_ENDPOINT;
function initSharedApiForChat() {
  const session = loadSharedApiSession();
  userApiKey = session.key;
  apiModel = session.model;
  apiProvider = session.provider;
  apiEndpoint = session.endpoint;
  const modelInput = document.getElementById('api-model-input');
  if (modelInput) modelInput.value = apiModel;
  setText('api-key-status', userApiKey ? `API Key：${maskApiKeyForDisplay(userApiKey)}｜平台：${getProviderLabel(apiProvider)}｜模型：${apiModel}` : 'API Key：未设置');
  const homeLink = document.getElementById('ai-home-api-link');
  if (homeLink) homeLink.classList.toggle('hidden', !!userApiKey);
}
function clearApiKeySessionFromChat() {
  clearSharedApiSession();
  userApiKey = '';
  apiModel = DEFAULT_API_MODEL;
  apiProvider = DEFAULT_API_PROVIDER;
  apiEndpoint = DEFAULT_API_ENDPOINT;
  setText('api-key-status', 'API Key：未设置');
  const homeLink = document.getElementById('ai-home-api-link');
  if (homeLink) homeLink.classList.remove('hidden');
  appendMessage('chat-container', 'API Key 会话已清除。', 'assistant');
}
let uploadedFileText = '';
let uploadedFileName = '';
function saveApiKeyFromModal() {
  const keyInput = document.getElementById('api-key-input');
  const modelInput = document.getElementById('api-model-input');
  if (!keyInput || !modelInput) { alert('请回首页设置 API Key。'); return; }
  const key = keyInput.value.trim();
  const model = modelInput.value.trim();
  if (!key) { alert('请先输入 API Key。'); return; }
  userApiKey = key;
  apiModel = model || DEFAULT_API_MODEL;
  saveSharedApiSession(userApiKey, apiModel, apiProvider, apiEndpoint);
  keyInput.value = '';
  setText('api-key-status', `API Key：${maskApiKeyForDisplay(userApiKey)}｜平台：${getProviderLabel(apiProvider)}｜模型：${apiModel}`);
  closeModal('apiKeyModal');
}
function bindFileInput() {
  const input = document.getElementById('file-input');
  if (!input) return;
  input.addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;
    uploadedFileName = file.name;
    const reader = new FileReader();
    reader.onload = e => {
      uploadedFileText = String(e.target.result || '').slice(0, 120000);
      setText('file-status', `已上传：${uploadedFileName}`);
      const preview = document.getElementById('file-preview');
      if (preview) {
        preview.classList.remove('hidden');
        preview.textContent = `文件名：${uploadedFileName}\n字符数：${uploadedFileText.length}\n\n${uploadedFileText.slice(0, 900)}`;
      }
    };
    reader.readAsText(file, 'UTF-8');
  });
}
function clearUploadedFile() {
  uploadedFileText = ''; uploadedFileName = '';
  const input = document.getElementById('file-input'); if (input) input.value = '';
  setText('file-status','未上传文件');
  const preview = document.getElementById('file-preview'); if (preview) { preview.classList.add('hidden'); preview.textContent=''; }
}
function buildContextForAI(question) {
  const p = loadProfile();
  return `你是面向大一学生的智能学习伙伴。你的任务是结合学生画像、预测结果、用户上传文件和用户问题，给出可执行的学习建议或作业讲解。

【回答规则】
1. 先给结论，再给分析步骤。
2. 如果用户问作业题，先解释思路，不要只给最终答案。
3. 如果上传文件中包含相关信息，必须引用文件内容进行分析；如果文件无关或未上传，要明确说明。
4. 如果学生画像显示风险，例如学习时长偏低、出勤偏低、睡眠异常或前次成绩较低，需要给出具体干预建议。
5. 不要使用 Markdown 表格，避免过长空话。
6. 不要声称你访问了服务器或长期保存了用户文件；文件仅作为本次浏览器上下文。

【学生画像与预测】
${buildProfileText(p)}

【上传文件】
文件名：${uploadedFileName || '无'}
内容：
${uploadedFileText || '未上传文件'}

【用户问题】
${question}

请用中文回答。`;
}

async function askLLM(question, containerId='chat-container') {
  if (!userApiKey) { appendMessage(containerId, '请先回首页设置 API Key。', 'assistant'); return; }
  const thinking = document.createElement('div');
  thinking.className = 'message assistant';
  thinking.textContent = '正在调用大语言模型...';
  const box = document.getElementById(containerId); box.appendChild(thinking); box.scrollTop = box.scrollHeight;
  try {
    renderRichTextElement(thinking, await callSharedLLM({ user: buildContextForAI(question), temperature: 0.3 }), { math: false });
  } catch (err) {
    renderRichTextElement(thinking, `调用失败：${err.message}`, { math: false });
  }
}
function bindChat() {
  initSharedApiForChat();
  bindFileInput();
  const send = document.getElementById('send-chat');
  const input = document.getElementById('chat-input');
  if (send && input) {
    send.addEventListener('click', () => {
      const q = input.value.trim();
      if (!q) return;
      appendMessage('chat-container', q, 'user');
      input.value = '';
      askLLM(q, 'chat-container');
    });
  }
}
