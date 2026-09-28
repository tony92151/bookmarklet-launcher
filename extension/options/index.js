import { prepareScriptSubmission } from "../script-submission.js";
import { createLanguageController } from "../language.js";
import {
  getScripts,
  saveScript,
  updateScript,
  deleteScript,
} from "../storage-client.js";

const versionEl = document.getElementById("extension-version");

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

let editingId = null;
let lastScripts = [];
let currentHint = null;
const i18n = createLanguageController({
  document,
  navigator: globalThis.navigator,
  storage: chrome.storage.local,
  onChange() {
    versionEl.textContent = `${i18n.t('version')} ${chrome.runtime.getManifest().version}`;
    formTitle.textContent = i18n.t(editingId ? 'editScript' : 'addScript');
    saveBtn.textContent = i18n.t(editingId ? 'update' : 'save');
    if (currentHint) formHint.textContent = i18n.t(currentHint);
    renderList(lastScripts);
  },
});

function inputMode() {
  return document.querySelector('input[name="input-mode"]:checked').value;
}

function resetInputMode() {
  document.querySelector('input[name="input-mode"][value="raw"]').checked = true;
}

function setHint(key, kind = "success") {
  currentHint = key;
  formHint.textContent = i18n.t(key);
  formHint.classList.toggle("error", kind === "error");
  if (key) {
    setTimeout(() => {
      formHint.textContent = "";
      currentHint = null;
    }, 2500);
  }
}

function enterEditMode(script) {
  editingId = script.id;
  formTitle.textContent = i18n.t('editScript');
  saveBtn.textContent = i18n.t('update');
  cancelBtn.classList.remove("hidden");
  nameInput.value = script.name;
  codeInput.value = script.code;
  resetInputMode();
  formTitle.scrollIntoView({ behavior: "smooth", block: "start" });
  nameInput.focus({ preventScroll: true });
}

function exitEditMode() {
  editingId = null;
  formTitle.textContent = i18n.t('addScript');
  saveBtn.textContent = i18n.t('save');
  cancelBtn.classList.add("hidden");
  form.reset();
  resetInputMode();
}

function renderList(scripts) {
  lastScripts = scripts;
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
    meta.textContent = script.code.slice(0, 80).replace(/\s+/g, " ");
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "sm-btn edit";
    editBtn.textContent = i18n.t('edit');
    editBtn.addEventListener("click", () => enterEditMode(script));
    const delBtn = document.createElement("button");
    delBtn.className = "sm-btn delete";
    delBtn.textContent = i18n.t('delete');
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
  if (!confirm(i18n.t('deleteConfirm', { name: script.name }))) return;
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
    const message = error instanceof Error ? error.message : String(error);
    setHint(message === 'Code cannot be empty.' ? 'emptyCode'
      : message === 'Unable to decode bookmarklet: malformed percent encoding.' ? 'malformedEncoding'
        : message, 'error');
    return;
  }

  const { name, code } = submission;

  if (editingId) {
    await updateScript(editingId, { name, code });
    exitEditMode();
    setHint('updated');
  } else {
    await saveScript({ name, code });
    form.reset();
    setHint(mode === 'encoded-bookmarklet' ? 'decodedSaved' : 'saved');
  }
  await refresh();
});

cancelBtn.addEventListener("click", exitEditMode);

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => i18n.setLanguage(button.dataset.language));
});

void i18n.initialize().then(refresh);
