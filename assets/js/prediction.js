function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function getDefaultProfile() { return { studyHours: 2, attendance: 80, sleepHours: 7, previousScore: 70 }; }
function readProfileFromInputs() {
  const byId = (id, fallback) => {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : fallback;
  };
  return {
    studyHours: byId("study-hours", 2),
    attendance: byId("attendance", 80),
    sleepHours: byId("sleep-hours", 7),
    previousScore: byId("previous-scores", 70)
  };
}
function saveProfile(profile) { localStorage.setItem("studentProfile", JSON.stringify(profile)); }
function loadProfile() {
  try { return JSON.parse(localStorage.getItem("studentProfile") || "null") || getDefaultProfile(); }
  catch { return getDefaultProfile(); }
}
function predictPassFromProfile(p) {
  const coeffs = [0.40855892, 0.3195569, 0.08639317, 0.04907167];
  const intercept = -27.44203988;
  const z = intercept + coeffs[0] * p.studyHours + coeffs[1] * p.attendance + coeffs[2] * p.sleepHours + coeffs[3] * p.previousScore;
  const raw = 1 / (1 + Math.exp(-z));
  return clamp(raw, 0.005, 0.995);
}
function predictGradeFromProfile(p) {
  const studyScore = Math.min(p.studyHours / 8, 1) * 100;
  const sleepScore = Math.max(0, 100 - Math.abs(p.sleepHours - 7.5) * 18);
  const grade = 0.25 * studyScore + 0.30 * p.attendance + 0.15 * sleepScore + 0.30 * p.previousScore;
  return clamp(grade, 0, 100);
}
function gradeLevel(score) {
  if (score >= 90) return "A 优秀";
  if (score >= 80) return "B 良好";
  if (score >= 70) return "C 中等";
  if (score >= 60) return "D 及格边缘";
  return "风险区间";
}
function buildProfileText(p) {
  const pass = predictPassFromProfile(p);
  const grade = predictGradeFromProfile(p);
  return `学习时长：${p.studyHours.toFixed(1)} 小时/天\n出勤率：${p.attendance.toFixed(0)}%\n睡眠时长：${p.sleepHours.toFixed(1)} 小时/天\n前次成绩：${p.previousScore.toFixed(0)} 分\n通过概率：${(pass * 100).toFixed(1)}%\n综合成绩预测：${grade.toFixed(1)} 分（${gradeLevel(grade)}）`;
}
function generateAdvice(p) {
  const grade = predictGradeFromProfile(p);
  const risks = [];
  if (p.studyHours < 3) risks.push("学习时长偏低");
  if (p.attendance < 85) risks.push("出勤率不足");
  if (p.sleepHours < 6.5) risks.push("睡眠不足");
  if (p.sleepHours > 9) risks.push("睡眠过长，需检查作息效率");
  if (p.previousScore < 70) risks.push("基础成绩需要巩固");
  if (!risks.length) risks.push("整体状态较稳定");
  const action = grade >= 80 ? "保持节奏，增加提高题与综合题训练。" : grade >= 65 ? "优先补齐薄弱概念，并提高每日有效学习时间。" : "先完成基础定义、例题和错题复盘，降低学习风险。";
  return { grade, risks, action };
}
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
