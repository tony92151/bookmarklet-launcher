import { prepareScriptSubmission } from "../script-submission.js";
import { loadGithubScript } from "../github-import.js";
import {
  getScripts,
  saveScript,
  updateScript,
  deleteScript,
} from "../storage-client.js";

const versionEl = document.getElementById("extension-version");
versionEl.textContent = `Version ${chrome.runtime.getManifest().version}`;

const form = document.getElementById("script-form");
const nameInput = document.getElementById("name");
const codeInput = document.getElementById("code");
const formTitle = document.getElementById("form-title");
const formHint = document.getElementById("form-hint");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const listEl = document.getElementById("list");
const listEmpty = document.getElementById("list-empty");
const countEl = document.getElementById("count");
const manualTab = document.getElementById("manual-tab");
const githubTab = document.getElementById("github-tab");
const manualPanel = document.getElementById("manual-panel");
const githubPanel = document.getElementById("github-panel");
const githubForm = document.getElementById("github-form");
const githubUrlInput = document.getElementById("github-url");
const githubSaveBtn = document.getElementById("github-save-btn");
const githubHint = document.getElementById("github-hint");

let editingId = null;

function inputMode() {
  return document.querySelector('input[name="input-mode"]:checked').value;
}

function resetInputMode() {
  document.querySelector('input[name="input-mode"][value="raw"]').checked = true;
}

function formatUpdatedAt(script) {
  const timestamp = Number.isFinite(script.updatedAt) ? script.updatedAt : script.createdAt;
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return "Updated time unavailable";
  const pad = (value) => String(value).padStart(2, "0");
  return `Updated ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function setActiveTab(source) {
  const manual = source === "manual";
  manualPanel.classList.toggle("hidden", !manual);
  githubPanel.classList.toggle("hidden", manual);
  manualTab.setAttribute("aria-selected", String(manual));
  githubTab.setAttribute("aria-selected", String(!manual));
  manualTab.setAttribute("tabindex", manual ? "0" : "-1");
  githubTab.setAttribute("tabindex", manual ? "-1" : "0");
}

function setHint(text, kind = "success") {
  formHint.textContent = text;
  formHint.classList.toggle("error", kind === "error");
  if (text) {
    setTimeout(() => {
      formHint.textContent = "";
    }, 2500);
  }
}

function enterEditMode(script) {
  setActiveTab("manual");
  githubTab.classList.add("hidden");
  editingId = script.id;
  formTitle.textContent = "Edit Script";
  saveBtn.textContent = "Update";
  cancelBtn.classList.remove("hidden");
  nameInput.value = script.name;
  codeInput.value = script.code;
  resetInputMode();
  formTitle.scrollIntoView({ behavior: "smooth", block: "start" });
  nameInput.focus({ preventScroll: true });
}

function exitEditMode() {
  editingId = null;
  githubTab.classList.remove("hidden");
  formTitle.textContent = "Add Script";
  saveBtn.textContent = "Save";
  cancelBtn.classList.add("hidden");
  form.reset();
  resetInputMode();
}

function renderList(scripts) {
  countEl.textContent = String(scripts.length);
  listEl.innerHTML = "";
  listEmpty.classList.toggle("hidden", scripts.length > 0);

  for (const script of scripts) {
    const li = document.createElement("li");
    li.className = "item";

    const info = document.createElement("div");
    info.className = "item-info";
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = script.name;
    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = formatUpdatedAt(script);
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "sm-btn edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => enterEditMode(script));
    const delBtn = document.createElement("button");
    delBtn.className = "sm-btn delete";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => onDelete(script));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(info);
    li.appendChild(actions);
    listEl.appendChild(li);
  }
}

async function refresh() {
  const scripts = await getScripts();
  renderList(scripts);
}

async function onDelete(script) {
  if (!confirm(`Delete "${script.name}"?`)) return;
  await deleteScript(script.id);
  if (editingId === script.id) exitEditMode();
  await refresh();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mode = inputMode();
  let submission;
  try {
    submission = prepareScriptSubmission({
      name: nameInput.value,
      code: codeInput.value,
      mode,
    });
  } catch (error) {
    setHint(error instanceof Error ? error.message : String(error), "error");
    return;
  }

  const { name, code } = submission;

  if (editingId) {
    await updateScript(editingId, { name, code });
    exitEditMode();
    setHint("Updated.");
  } else {
    await saveScript({ name, code });
    form.reset();
    setHint(submission.successMessage);
  }
  await refresh();
});

cancelBtn.addEventListener("click", exitEditMode);

manualTab.addEventListener("click", () => setActiveTab("manual"));
githubTab.addEventListener("click", () => setActiveTab("github"));
for (const tab of [manualTab, githubTab]) {
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === manualTab ? githubTab : manualTab;
    if (next.classList.contains("hidden")) return;
    setActiveTab(next === manualTab ? "manual" : "github");
    next.focus();
  });
}

githubForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  githubSaveBtn.disabled = true;
  githubHint.textContent = "Loading GitHub file…";
  githubHint.classList.remove("error");
  try {
    const script = await loadGithubScript(githubUrlInput.value);
    await saveScript(script);
    githubForm.reset();
    githubHint.textContent = "Saved a local copy.";
    await refresh();
  } catch (error) {
    githubHint.textContent = error instanceof Error ? error.message : String(error);
    githubHint.classList.add("error");
  } finally {
    githubSaveBtn.disabled = false;
  }
});

refresh();
