"use strict";
// Public Star controls link to native GitHub. They never request a token,
// call a Star API, or silently change an account's Stars.
(() => {
  const REPO = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;
  function makeButton(name, size) {
    const valid = typeof name === "string" && REPO.test(name) &&
      name.split("/").every(part => part !== "." && part !== "..");
    const el = document.createElement(valid ? "a" : "span");
    el.className = "star-toggle" + (size === "compact" ? " star-toggle-small" : "");
    el.textContent = "★";
    if (valid) {
      el.href = "https://github.com/" + name;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
      el.title = "在 GitHub 仓库页查看或取消 Star（新标签页）";
      el.setAttribute("aria-label", "在 GitHub 管理 " + name + " 的 Star（新标签页）");
    } else {
      el.title = "无效的仓库地址";
      el.setAttribute("aria-label", "仓库地址不可用");
    }
    return el;
  }
  window.StarUI = {
    makeButton,
    isStarred() { return true; },
    retainedCount(names) { return names.length; }
  };
})();
