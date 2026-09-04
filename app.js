const STORAGE_KEY = "signalbridge_classroom_v1";
const LABELS = ["ready", "pause", "ask"];
const LABEL_META = {
  ready: { title: "Keep going", support: "The learner is probably ready to continue.", glyph: ">", color: "ready" },
  pause: { title: "Please pause", support: "The learner may need a lower-load next step.", glyph: "||", color: "pause" },
  ask: { title: "Ask me", support: "The signal is ambiguous. Ask before acting.", glyph: "?", color: "ask" }
};

// These are compact prototypes derived from the existing Heard experiment's
// support-state framing. The browser demo learns a separate centroid per learner.
const BASELINE = {
  ready: [0.32, 0.36, 0.67, 0.26, 0.27],
  pause: [0.78, 0.70, 0.28, 0.68, 0.72],
  ask: [0.49, 0.42, 0.48, 0.48, 0.49]
};

const DEMO_FEATURES = {
  ready: [0.28, 0.31, 0.74, 0.22, 0.24],
  pause: [0.84, 0.74, 0.24, 0.74, 0.78],
  ask: [0.51, 0.46, 0.48, 0.45, 0.52]
};

const state = {
  profiles: loadProfiles(),
  history: loadHistory(),
  current: null,
  audio: { context: null, analyser: null, stream: null, timer: null, frames: [] }
};

const els = {
  recordStatus: document.querySelector("#recordStatus"),
  signalOrb: document.querySelector("#signalOrb"),
  orbGlyph: document.querySelector("#orbGlyph"),
  currentState: document.querySelector("#currentState"),
  currentSupport: document.querySelector("#currentSupport"),
  confidenceValue: document.querySelector("#confidenceValue"),
  confidenceMeter: document.querySelector("#confidenceMeter"),
  recordBtn: document.querySelector("#recordBtn"),
  stopBtn: document.querySelector("#stopBtn"),
  micHint: document.querySelector("#micHint"),
  profileRows: document.querySelector("#profileRows"),
  adaptationValue: document.querySelector("#adaptationValue"),
  adaptationMeter: document.querySelector("#adaptationMeter"),
  adaptationHint: document.querySelector("#adaptationHint"),
  receiptRows: document.querySelector("#receiptRows"),
  teacherGlyph: document.querySelector("#teacherGlyph"),
  teacherState: document.querySelector("#teacherState"),
  teacherTime: document.querySelector("#teacherTime"),
  teacherAction: document.querySelector("#teacherAction"),
  teacherActions: document.querySelector("#teacherActions"),
  eventCount: document.querySelector("#eventCount"),
  historyList: document.querySelector("#historyList"),
  resetBtn: document.querySelector("#resetBtn")
};

function init() {
  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => runSample(button.dataset.sample));
  });
  document.querySelectorAll("[data-feedback]").forEach((button) => {
    button.addEventListener("click", () => applyFeedback(button.dataset.feedback));
  });
  els.recordBtn.addEventListener("click", startRecording);
  els.stopBtn.addEventListener("click", stopRecording);
  els.resetBtn.addEventListener("click", resetDemo);
  renderProfiles();
  renderHistory();
  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    window.setTimeout(() => runSample("pause"), 250);
  }
}

function loadProfiles() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.profiles) return saved.profiles;
  } catch {
    // A fresh in-browser model is the conservative fallback.
  }
  return LABELS.reduce((profiles, label) => {
    profiles[label] = { count: 0, centroid: [...BASELINE[label]] };
    return profiles;
  }, {});
}

function loadHistory() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(saved?.history) ? saved.history : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: state.profiles, history: state.history }));
  } catch {
    setStatus("Browser storage is unavailable; no raw audio was kept.");
  }
}

function runSample(label) {
  const features = DEMO_FEATURES[label] || DEMO_FEATURES.ask;
  const result = classify(features, "sample phrase");
  renderResult(result);
  setStatus("Sample signal analyzed");
}

function classify(features, source) {
  const scores = LABELS.map((label) => {
    const profile = state.profiles[label];
    const distance = weightedDistance(features, profile.centroid);
    const score = Math.exp(-4.2 * distance);
    return { label, distance, score, samples: profile.count };
  }).sort((a, b) => b.score - a.score);

  const total = scores.reduce((sum, item) => sum + item.score, 0);
  scores.forEach((item) => { item.probability = item.score / total; });
  const top = scores[0];
  const second = scores[1];
  const margin = top.probability - second.probability;
  const abstained = top.probability < 0.55 || margin < 0.09;
  const label = abstained ? "ask" : top.label;

  return {
    label,
    rawLabel: top.label,
    confidence: abstained ? Math.max(0.35, top.probability) : top.probability,
    margin,
    source,
    features: [...features],
    scores
  };
}

function weightedDistance(a, b) {
  const weights = [1.35, 1.15, 1.0, 1.0, 1.2];
  const squared = a.reduce((sum, value, index) => sum + weights[index] * (value - b[index]) ** 2, 0);
  return Math.sqrt(squared / weights.reduce((sum, value) => sum + value, 0));
}

function renderResult(result) {
  state.current = result;
  const meta = LABEL_META[result.label];
  els.currentState.textContent = meta.title;
  els.currentSupport.textContent = meta.support;
  els.confidenceValue.textContent = `${Math.round(result.confidence * 100)}%`;
  els.confidenceMeter.style.width = `${Math.round(result.confidence * 100)}%`;
  els.signalOrb.className = `signal-orb ${meta.color}`;
  els.orbGlyph.textContent = meta.glyph;
  els.recordStatus.textContent = result.label === "ask" && result.rawLabel !== "ask" ? "Abstained" : "Analyzed";
  renderReceipt(result);
  renderTeacherView(result);
}

function renderReceipt(result) {
  els.receiptRows.replaceChildren();
  const rows = [
    ["Closest support state", LABEL_META[result.rawLabel].title],
    ["Top probability", `${Math.round(result.scores[0].probability * 100)}%`],
    ["Distance to runner-up", `${Math.round(result.margin * 100)} point margin`],
    ["Personal evidence", `${result.scores.find((item) => item.label === result.rawLabel).samples} confirmed samples`]
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "receipt-row";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("strong");
    right.textContent = value;
    row.append(left, right);
    els.receiptRows.append(row);
  });
}

function renderTeacherView(result) {
  const meta = LABEL_META[result.label];
  els.teacherGlyph.textContent = meta.glyph;
  els.teacherState.textContent = meta.title;
  els.teacherTime.textContent = `${result.source}; features only, no recording stored`;
  const action = {
    ready: "Continue the task without interrupting the learner’s flow.",
    pause: "Offer a lower-load step, quiet pause, or choice of how to continue.",
    ask: "Ask the learner directly. Do not infer a feeling from an ambiguous signal."
  }[result.label];
  els.teacherAction.textContent = action;
  els.teacherActions.replaceChildren();
  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.textContent = result.label === "ask" ? "Ask: What would help right now?" : `Suggested move: ${action}`;
  els.teacherActions.append(actionButton);
}

function applyFeedback(feedback) {
  if (!state.current) {
    setStatus("Run a check-in before confirming a signal.");
    return;
  }
  const target = feedback === "correct" ? state.current.rawLabel : feedback;
  const profile = state.profiles[target];
  profile.centroid = profile.centroid.map((value, index) => {
    return (value * profile.count + state.current.features[index]) / (profile.count + 1);
  });
  profile.count += 1;
  state.history.unshift({
    id: Date.now(),
    label: target,
    modelLabel: state.current.label,
    feedback: feedback === "correct" ? "confirmed" : "corrected",
    source: state.current.source,
    time: new Date().toISOString()
  });
  state.history = state.history.slice(0, 8);
  persist();
  renderProfiles();
  renderHistory();
  const refreshed = classify(state.current.features, state.current.source);
  renderResult(refreshed);
  setStatus(feedback === "correct" ? "Confirmed; learner model updated" : "Correction learned locally");
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    els.micHint.textContent = "Microphone is unavailable here; use a sample phrase.";
    setStatus("Microphone unavailable");
    return;
  }
  try {
    state.audio.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audio.context = new AudioContext();
    state.audio.analyser = state.audio.context.createAnalyser();
    state.audio.analyser.fftSize = 1024;
    state.audio.context.createMediaStreamSource(state.audio.stream).connect(state.audio.analyser);
    state.audio.frames = [];
    state.audio.timer = window.setInterval(() => state.audio.frames.push(readAudioFrame()), 100);
    els.recordBtn.disabled = true;
    els.stopBtn.disabled = false;
    els.recordStatus.textContent = "Listening";
    setStatus("Listening locally; raw audio is not recorded");
    window.setTimeout(stopRecording, 3000);
  } catch {
    els.micHint.textContent = "Microphone permission was not granted; use a sample phrase.";
    setStatus("Microphone permission needed");
  }
}

function stopRecording() {
  if (!state.audio.analyser) return;
  window.clearInterval(state.audio.timer);
  const frames = state.audio.frames.length ? state.audio.frames : [[0.4, 0.4, 0.5, 0.4, 0.5]];
  const features = frames[0].map((_, index) => frames.reduce((sum, frame) => sum + frame[index], 0) / frames.length);
  state.audio.stream?.getTracks().forEach((track) => track.stop());
  state.audio.context?.close();
  state.audio = { context: null, analyser: null, stream: null, timer: null, frames: [] };
  els.recordBtn.disabled = false;
  els.stopBtn.disabled = true;
  els.recordStatus.textContent = "Ready";
  renderResult(classify(features, "microphone"));
  setStatus("Voice features analyzed locally");
}

function readAudioFrame() {
  const analyser = state.audio.analyser;
  const time = new Float32Array(analyser.fftSize);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  analyser.getFloatTimeDomainData(time);
  analyser.getByteFrequencyData(freq);
  let energy = 0;
  let crossings = 0;
  for (let index = 0; index < time.length; index += 1) {
    energy += time[index] ** 2;
    if (index > 0 && Math.sign(time[index]) !== Math.sign(time[index - 1])) crossings += 1;
  }
  const rms = Math.sqrt(energy / time.length);
  const centroid = freq.reduce((sum, value, index) => sum + value * index, 0) / Math.max(1, freq.reduce((sum, value) => sum + value, 0));
  return [clamp(rms * 7), clamp(crossings / time.length * 10), clamp(centroid / freq.length), clamp(Math.abs(rms - 0.08) * 8), clamp(1 - crossings / time.length * 5)];
}

function renderProfiles() {
  els.profileRows.replaceChildren();
  LABELS.forEach((label) => {
    const profile = state.profiles[label];
    const row = document.createElement("div");
    row.className = `profile-row ${label}`;
    const labelLine = document.createElement("div");
    labelLine.className = "profile-label";
    const name = document.createElement("strong");
    name.textContent = LABEL_META[label].title;
    const count = document.createElement("span");
    count.textContent = `${profile.count} samples`;
    labelLine.append(name, count);
    const meter = document.createElement("div");
    meter.className = "meter";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, profile.count * 20)}%`;
    meter.append(fill);
    row.append(labelLine, meter);
    els.profileRows.append(row);
  });
  const total = LABELS.reduce((sum, label) => sum + state.profiles[label].count, 0);
  const progress = Math.min(100, Math.round(total / 9 * 100));
  els.adaptationValue.textContent = `${progress}%`;
  els.adaptationMeter.style.width = `${progress}%`;
  els.adaptationHint.textContent = total ? `${total} confirmed sample${total === 1 ? "" : "s"} shape this learner profile.` : "Add one confirmed sample to start adapting.";
}

function renderHistory() {
  els.eventCount.textContent = `${state.history.length} check${state.history.length === 1 ? "" : "s"}`;
  els.historyList.replaceChildren();
  if (!state.history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your confirmed support history stays in this browser.";
    els.historyList.append(empty);
    return;
  }
  state.history.forEach((event) => {
    const row = document.createElement("div");
    row.className = "history-row";
    const time = document.createElement("time");
    time.textContent = new Date(event.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const stateCell = document.createElement("span");
    stateCell.className = `state ${event.label}`;
    stateCell.textContent = LABEL_META[event.label].title;
    const source = document.createElement("small");
    source.textContent = event.source;
    const feedback = document.createElement("span");
    feedback.className = "feedback-tag";
    feedback.textContent = event.feedback;
    row.append(time, stateCell, source, feedback);
    els.historyList.append(row);
  });
}

function resetDemo() {
  window.localStorage.removeItem(STORAGE_KEY);
  state.profiles = LABELS.reduce((profiles, label) => {
    profiles[label] = { count: 0, centroid: [...BASELINE[label]] };
    return profiles;
  }, {});
  state.history = [];
  state.current = null;
  els.currentState.textContent = "No signal yet";
  els.currentSupport.textContent = "Choose a sample phrase or record a short check-in.";
  els.confidenceValue.textContent = "--";
  els.confidenceMeter.style.width = "0%";
  els.signalOrb.className = "signal-orb";
  els.orbGlyph.textContent = "●";
  els.recordStatus.textContent = "Ready";
  els.receiptRows.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "A model receipt appears after a check-in.";
  els.receiptRows.append(empty);
  els.teacherGlyph.textContent = "-";
  els.teacherState.textContent = "Waiting for a student signal";
  els.teacherTime.textContent = "No raw audio is stored.";
  els.teacherAction.textContent = "A teacher sees a suggested next move, not a private recording or a diagnosis.";
  els.teacherActions.replaceChildren();
  renderProfiles();
  renderHistory();
  setStatus("Demo reset");
}

function setStatus(message) {
  els.recordStatus.title = message;
  els.micHint.textContent = message;
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

init();
