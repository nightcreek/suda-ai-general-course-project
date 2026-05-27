let mathApiKey = '';
let mathModel = DEFAULT_API_MODEL;
function initSharedApiForMath() {
  const session = loadSharedApiSession();
  mathApiKey = session.key;
  mathModel = session.model;
  const modelInput = document.getElementById('math-api-model-input');
  if (modelInput) modelInput.value = mathModel;
  setText('math-api-status', mathApiKey ? `API Key：${maskApiKeyForDisplay(mathApiKey)}｜模型：${mathModel}` : 'API Key：未设置');
  const homeLink = document.getElementById('math-home-api-link');
  if (homeLink) homeLink.classList.toggle('hidden', !!mathApiKey);
}
function clearApiKeySessionFromMath() {
  clearSharedApiSession();
  mathApiKey = '';
  mathModel = DEFAULT_API_MODEL;
  setText('math-api-status', 'API Key：未设置');
  const homeLink = document.getElementById('math-home-api-link');
  if (homeLink) homeLink.classList.remove('hidden');
  setText('math-status', '当前状态：API Key 会话已清除。');
}
let graphingApi = null;
let graphingInjected = false;
function saveMathApiKey() {
  const keyInput = document.getElementById('math-api-key-input');
  const modelInput = document.getElementById('math-api-model-input');
  if (!keyInput || !modelInput) { alert('请回首页设置 API Key。'); return; }
  const key = keyInput.value.trim();
  const model = modelInput.value.trim();
  if (!key) { alert('请先输入 API Key。'); return; }
  mathApiKey = key;
  mathModel = model || DEFAULT_API_MODEL;
  saveSharedApiSession(mathApiKey, mathModel);
  keyInput.value = '';
  setText('math-api-status', `API Key：${maskApiKeyForDisplay(mathApiKey)}｜模型：${mathModel}`);
  closeModal('mathApiModal');
}
function injectGraphingIfNeeded() {
  const pane = document.getElementById('ggb-pane');
  if (!pane) return;
  pane.classList.add('active');
  if (graphingInjected) return;
  if (typeof GGBApplet === 'undefined') {
    pane.innerHTML = '<div class="result-box">GeoGebra 脚本未加载。请检查网络，或打开独立图形计算器。</div>';
    return;
  }
  pane.innerHTML = '';
  const width = Math.max(640, Math.floor(pane.getBoundingClientRect().width || 760));
  const applet = new GGBApplet({
    id: 'ggbGraphing', appName: 'graphing', width, height: 480,
    showToolBar: false, showAlgebraInput: false, showMenuBar: false,
    showAlgebraView: false, enableShiftDragZoom: true, useBrowserForJS: true,
    appletOnLoad: function(api) {
      graphingApi = api;
      try { api.setPerspective('G'); api.setCoordSystem(-10, 10, -6, 6); } catch(e) {}
    }
  }, true);
  applet.inject('ggb-pane');
  graphingInjected = true;
}
function parseCommands(reply) {
  const start = '[GGB_COMMANDS_START]';
  const end = '[GGB_COMMANDS_END]';
  if (!reply.includes(start) || !reply.includes(end)) return { text: reply, commands: [] };
  const text = reply.split(start)[0].trim();
  const raw = reply.split(start)[1].split(end)[0].trim();
  return { text, commands: raw.split(';').map(s => s.trim()).filter(Boolean) };
}
async function executeMathQuestion() {
  const prompt = document.getElementById('math-prompt').value.trim();
  if (!prompt) { alert('请先输入数学题目。'); return; }
  if (!mathApiKey) { setText('math-output', '请先回首页设置 API Key。'); return; }
  setText('math-status', '正在生成讲解与 GeoGebra 指令...');
  setText('math-output', '等待模型返回...');
  setHTML('math-commands', '');
  const systemContext = '你是数学系数形结合助教。请给出简洁严谨的中文讲解，并在最后一行用 [GGB_COMMANDS_START] 和 [GGB_COMMANDS_END] 包裹 GeoGebra 图形计算器可执行命令；多条命令用英文分号分隔。如果题目不需要图形，命令区留空。不要使用 Markdown 表格。';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${mathApiKey}` },
      body: JSON.stringify({ model: mathModel, messages:[{role:'system',content:systemContext},{role:'user',content:prompt}], temperature:0.2 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = parseCommands(content);
    setText('math-output', parsed.text || '模型没有返回讲解文本。');
    if (parsed.commands.length) {
      injectGraphingIfNeeded();
      setHTML('math-commands', parsed.commands.map(c => `<span class="command-badge">${c}</span>`).join(''));
      setText('math-status', '已生成讲解，并尝试绘制图形。');
      setTimeout(() => {
        parsed.commands.forEach(cmd => { try { graphingApi && graphingApi.evalCommand(cmd); } catch(e) {} });
      }, 800);
    } else {
      setText('math-status', '已生成讲解；本题未触发绘图。');
    }
  } catch (err) {
    setText('math-output', `调用失败：${err.message}`);
    setText('math-status', '调用失败');
  }
}
function fillExample(text) { const el = document.getElementById('math-prompt'); if (el) el.value = text; }
