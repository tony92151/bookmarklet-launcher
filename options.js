import { decodeBookmarklet } from "./lib/decode.js";
import {
  getScripts,
  saveScript,
  updateScript,
  deleteScript,
} from "./lib/storage.js";

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

function setHint(text) {
  formHint.textContent = text;
  if (text) {
    setTimeout(() => {
      formHint.textContent = "";
    }, 2500);
  }
}

function enterEditMode(script) {
  editingId = script.id;
  formTitle.textContent = "編輯腳本";
  saveBtn.textContent = "更新";
  cancelBtn.classList.remove("hidden");
  nameInput.value = script.name;
  codeInput.value = script.code;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitEditMode() {
  editingId = null;
  formTitle.textContent = "新增腳本";
  saveBtn.textContent = "儲存";
  cancelBtn.classList.add("hidden");
  form.reset();
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
    meta.textContent = script.code.slice(0, 80).replace(/\s+/g, " ");
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "sm-btn edit";
    editBtn.textContent = "編輯";
    editBtn.addEventListener("click", () => enterEditMode(script));
    const delBtn = document.createElement("button");
    delBtn.className = "sm-btn delete";
    delBtn.textContent = "刪除";
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
  if (!confirm(`確定刪除「${script.name}」?`)) return;
  await deleteScript(script.id);
  if (editingId === script.id) exitEditMode();
  await refresh();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const { code, wasBookmarklet } = decodeBookmarklet(codeInput.value);

  if (!code) {
    setHint("程式碼不可為空。");
    return;
  }

  if (editingId) {
    await updateScript(editingId, { name, code });
    exitEditMode();
    setHint("已更新。");
  } else {
    await saveScript({ name, code });
    form.reset();
    setHint(wasBookmarklet ? "已解碼書籤碼並儲存。" : "已儲存。");
  }
  await refresh();
});

cancelBtn.addEventListener("click", exitEditMode);

refresh();
