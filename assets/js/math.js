let mathApiKey = '';
let mathModel = DEFAULT_API_MODEL;
let mathProvider = DEFAULT_API_PROVIDER;
let mathEndpoint = DEFAULT_API_ENDPOINT;

let graphingApi = null;
let graphingInjected = false;
let geogebraCommandDocs = '';

const FALLBACK_GEOGEBRA_COMMAND_DOCS = `
【GeoGebra 图形计算器常用命令】
函数：f(x)=sin(x), g(x)=x^2-2, Function(x^2,-3,3)
点与线：A=(1,2), B=(3,4), Line(A,B), Segment(A,B), Ray(A,B)
圆与多边形：Circle(A,2), Circle(A,B), Polygon(A,B,C)
交点与特殊点：Intersect(f,g), Root(f), Extremum(f), TurningPoint(f)
导数与切线：Derivative(f), Tangent(1,f)
积分与面积：Integral(f,0,2), IntegralBetween(f,g,0,2)
规则：命令必须可由 GeoGebra 图形计算器 evalCommand 执行；多条命令用英文分号 ; 分隔；命令区不能包含解释、编号、Markdown 或中文。
`;

function initSharedApiForMath() {
  const session = loadSharedApiSession();
  mathApiKey = session.key;
  mathModel = session.model;
  mathProvider = session.provider;
  mathEndpoint = session.endpoint;
  setText('math-api-status', mathApiKey ? `API Key：${maskApiKeyForDisplay(mathApiKey)}｜平台：${getProviderLabel(mathProvider)}｜模型：${mathModel}` : 'API Key：未设置');
  const homeLink = document.getElementById('math-home-api-link');
  if (homeLink) homeLink.classList.toggle('hidden', !!mathApiKey);
  loadGeoGebraCommandDocs();
}

async function loadGeoGebraCommandDocs() {
  try {
    const response = await fetch('assets/docs/geogebra-commands.md', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    geogebraCommandDocs = await response.text();
    setText('ggb-doc-status', 'GeoGebra 命令参考：已加载');
  } catch (err) {
    geogebraCommandDocs = FALLBACK_GEOGEBRA_COMMAND_DOCS;
    setText('ggb-doc-status', 'GeoGebra 命令参考：使用内置简化版');
  }
}

function clearApiKeySessionFromMath() {
  clearSharedApiSession();
  mathApiKey = '';
  mathModel = DEFAULT_API_MODEL;
  mathProvider = DEFAULT_API_PROVIDER;
  mathEndpoint = DEFAULT_API_ENDPOINT;
  setText('math-api-status', 'API Key：未设置');
  const homeLink = document.getElementById('math-home-api-link');
  if (homeLink) homeLink.classList.remove('hidden');
  setText('math-status', '当前状态：API Key 会话已清除。');
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
    id: 'ggbGraphing',
    appName: 'graphing',
    width,
    height: 480,
    showToolBar: false,
    showAlgebraInput: false,
    showMenuBar: false,
    showAlgebraView: false,
    enableShiftDragZoom: true,
    useBrowserForJS: true,
    appletOnLoad: function(api) {
      graphingApi = api;
      try {
        api.setPerspective('G');
        api.setCoordSystem(-10, 10, -6, 6);
      } catch(e) {}
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
  return {
    text,
    commands: raw
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(c => !/[\u4e00-\u9fa5]/.test(c))
      .filter(c => !c.startsWith('-') && !c.startsWith('*') && !/^\d+[\.、]/.test(c))
  };
}

function buildGeoGebraSystemPrompt() {
  const docs = geogebraCommandDocs || FALLBACK_GEOGEBRA_COMMAND_DOCS;
  return `你是服务数学系本科生的“数形结合讲题助教”。你需要把用户输入的数学题目拆成两部分：中文数学讲解和 GeoGebra 图形命令。

【讲解要求】
1. 用中文回答，严谨、简洁、适合大一数学系学生。
2. 优先说明定义、思路、关键步骤和结论。
3. 不要使用 Markdown 表格。
4. 不要编造不存在的定理名称。
5. 如果题目条件不足，明确指出不足，并给出可补充的条件。

【GeoGebra 命令输出要求】
1. 如果题目适合图形辅助，必须生成 GeoGebra 图形计算器命令。
2. 命令必须放在回复最后，并用以下标签包裹：
[GGB_COMMANDS_START]
命令1;命令2;命令3
[GGB_COMMANDS_END]
3. 多条命令必须用英文分号 ; 分隔。
4. 命令区只能包含 GeoGebra 命令，不能包含中文、解释、Markdown、编号、项目符号或代码块。
5. 如果题目不需要画图，仍然输出空标签：
[GGB_COMMANDS_START]
[GGB_COMMANDS_END]
6. 只生成图形计算器可执行命令，避免 CAS 专用命令。
7. 不确定是否支持的命令不要生成。

【可用 GeoGebra 命令参考】
${docs}

【输出结构】
先输出“数学讲解”，最后输出命令标签。`;
}

function buildGeoGebraUserPrompt(userPrompt) {
  return `【用户题目】
${userPrompt}

请完成：
1. 给出中文数学讲解。
2. 判断是否需要图形辅助。
3. 如果需要图形辅助，生成可由 GeoGebra 图形计算器 evalCommand 执行的命令。
4. 命令必须严格放在 [GGB_COMMANDS_START] 与 [GGB_COMMANDS_END] 之间。`;
}

async function executeMathQuestion() {
  const prompt = document.getElementById('math-prompt').value.trim();
  if (!prompt) { alert('请先输入数学题目。'); return; }
  if (!mathApiKey) { setText('math-output', '请先回首页设置 API Key。'); return; }
  setText('math-status', '正在生成讲解与 GeoGebra 指令...');
  setText('math-output', '等待模型返回...');
  setHTML('math-commands', '');
  try {
    if (!geogebraCommandDocs) await loadGeoGebraCommandDocs();
    const content = await callSharedLLM({
      system: buildGeoGebraSystemPrompt(),
      user: buildGeoGebraUserPrompt(prompt),
      temperature: 0.15
    });
    const parsed = parseCommands(content);
    setText('math-output', parsed.text || '模型没有返回讲解文本。');
    if (parsed.commands.length) {
      injectGraphingIfNeeded();
      setHTML('math-commands', parsed.commands.map(c => `<span class="command-badge">${c}</span>`).join(''));
      setText('math-status', '已生成讲解，并尝试绘制图形。');
      setTimeout(() => {
        parsed.commands.forEach(cmd => {
          try { graphingApi && graphingApi.evalCommand(cmd); } catch(e) {}
        });
      }, 800);
    } else {
      setText('math-status', '已生成讲解；本题未触发绘图。');
    }
  } catch (err) {
    setText('math-output', `调用失败：${err.message}`);
    setText('math-status', '调用失败');
  }
}

function fillExample(text) {
  const el = document.getElementById('math-prompt');
  if (el) el.value = text;
}
