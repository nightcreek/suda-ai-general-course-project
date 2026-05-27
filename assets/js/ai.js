let userApiKey = '';
let apiModel = 'gpt-4o-mini';
let uploadedFileText = '';
let uploadedFileName = '';
function saveApiKeyFromModal() {
  const key = document.getElementById('api-key-input').value.trim();
  const model = document.getElementById('api-model-input').value.trim();
  if (!key) { alert('请先输入 API Key。'); return; }
  userApiKey = key;
  apiModel = model || 'gpt-4o-mini';
  document.getElementById('api-key-input').value = '';
  setText('api-key-status', `API Key：已设置｜${apiModel}`);
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
  return `你是面向大一学生的智能学习伙伴。请结合学生画像、预测结果和用户上传文件回答问题。\n\n【学生画像与预测】\n${buildProfileText(p)}\n\n【上传文件】\n文件名：${uploadedFileName || '无'}\n内容：\n${uploadedFileText || '未上传文件'}\n\n【用户问题】\n${question}\n\n请用中文回答，先给结论，再给具体步骤或学习建议。`;
}
async function askLLM(question, containerId='chat-container') {
  if (!userApiKey) { appendMessage(containerId, '请先输入 API Key。', 'assistant'); return; }
  const thinking = document.createElement('div');
  thinking.className = 'message assistant';
  thinking.textContent = '正在调用大语言模型...';
  const box = document.getElementById(containerId); box.appendChild(thinking); box.scrollTop = box.scrollHeight;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userApiKey}` },
      body: JSON.stringify({
        model: apiModel,
        messages: [{ role: 'user', content: buildContextForAI(question) }],
        temperature: 0.3
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    thinking.textContent = data.choices?.[0]?.message?.content || '模型未返回有效内容。';
  } catch (err) {
    thinking.textContent = `调用失败：${err.message}`;
  }
}
function bindChat() {
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
