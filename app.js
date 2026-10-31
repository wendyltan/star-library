"use strict";

(() => {
  const raw = document.getElementById("library-data").textContent;
  const library = JSON.parse(raw);
  const $ = (selector) => document.querySelector(selector);
  const categoryGrid = $("#category-grid");
  const repositoryGrid = $("#repository-grid");
  const search = $("#repo-search");
  const sorting = $("#sort-select");
  const filterMessage = $("#active-filters");
  const empty = $("#empty-state");
  const pagination = $("#pagination");
  const colors = [
    ["#d6e9da","#e9f3ea"],["#f6d8d1","#fff0ec"],["#f6e5c3","#fff5db"],
    ["#dce6ef","#edf3fa"],["#e6e1f1","#f3f0fa"],["#e9e7d6","#f6f5ec"],
    ["#f1dedf","#fbf0f0"],["#d8e8e5","#edf5f3"]
  ];
  const perPage = 12;
  let active = "";
  let page = 1;

  const el = (tag, className = "", value = "") => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== "") node.textContent = String(value);
    return node;
  };
  const formatShort = (iso) => {
    if (!iso) return "日期未知";
    const [y, m, d] = iso.split("-");
    return y + "." + m + "." + d;
  };
  const lower = (val) => String(val || "").toLocaleLowerCase("zh-CN");
  const safeRepo = (r) => {
    try {
      const u = new URL(r.url);
      return u.protocol === "https:" && u.hostname === "github.com" &&
        u.pathname.replace(/\/$/, "").toLowerCase() === ("/" + r.name).toLowerCase();
    } catch {
      return false;
    }
  };
  const recentStarred = (repo) => {
    if (!repo.starred || !library.updated) return false;
    const date = Date.parse(repo.starred + "T00:00:00Z");
    const last = Date.parse(library.updated + "T00:00:00Z");
    return Number.isFinite(date) && Number.isFinite(last) &&
      last >= date && last - date < 30 * 86400000;
  };

  $("#stat-total").textContent = library.total;
  $("#stat-categories").textContent = library.categories.length;
  $("#stat-recent").textContent = library.repos.filter(recentStarred).length;
  $("#review-count").textContent = (library.review.priority || 0) + (library.review.watch || 0);
  $("#cleanup-link").href = library.review.url;
  $("#review-all-link").href = library.review.url;
  $("#gist-link").href = library.gist;
  $("#updated-label").textContent = "收藏馆更新于 " + (library.updated || "—");

  const catColor = new Map();
  library.categories.forEach((c, i) => catColor.set(c.name, colors[i % colors.length]));

  function buildCategory(label, count, glyph, isAll, index) {
    const btn = el("button", "category-card" + (isAll ? " category-all" : ""));
    btn.type = "button";
    btn.style.setProperty("--tile", isAll ? "#39594f" : colors[index % colors.length][0]);
    btn.setAttribute("aria-pressed", String(isAll ? !active : active === label));
    btn.setAttribute("aria-label", (isAll ? "查看全部分类" : "筛选" + label) + "，" + count + " 个仓库");
    btn.append(el("span", "cat-glyph", glyph), el("span", "cat-title", isAll ? "全部的星星" : label),
      el("span", "cat-count", count + " 个仓库"));
    btn.addEventListener("click", () => {
      active = isAll ? "" : active === label ? "" : label;
      page = 1;
      repaint();
      document.querySelector(".collection-toolbar").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return btn;
  }

  function categoryPaint() {
    categoryGrid.replaceChildren();
    categoryGrid.appendChild(buildCategory("", window.StarUI.retainedCount(library.repos.map((r) => r.name)), "✳", true, 0));
    library.categories.forEach((c, i) => {
      const kept = library.repos.filter((r) => r.category === c.name && window.StarUI.isStarred(r.name)).length;
      categoryGrid.appendChild(buildCategory(c.name, kept, c.glyph, false, i));
    });
  }

  function card(repo) {
    const tile = el("article", "repo-card");
    const scheme = catColor.get(repo.category) || colors[0];
    tile.style.setProperty("--accent", scheme[0]);
    tile.style.setProperty("--badge", scheme[1]);

    const top = el("div", "repo-top");
    top.append(el("span", "repo-category", repo.category), window.StarUI.makeButton(repo.name));
    tile.appendChild(top);

    const heading = el("h4", "repo-name");
    const parts = repo.name.split("/");
    heading.append(el("span", "repo-owner", parts[0] + " / "), document.createTextNode(parts[1] || ""));
    tile.appendChild(heading);
    tile.appendChild(el("p", "repo-desc", repo.description || "这个小项目还没有简介，点进去探索一下吧。"));

    const topics = el("div", "repo-topics");
    (repo.topics || []).slice(0, 3).forEach((topic) => topics.appendChild(el("span", "topic", "#" + topic)));
    tile.appendChild(topics);

    const bottom = el("div", "repo-meta");
    const language = el("span", "");
    language.appendChild(el("i", "language-dot"));
    language.append(document.createTextNode(repo.language || "未标注语言"));
    bottom.append(language, el("span", "", "收藏于 " + formatShort(repo.starred)));
    tile.appendChild(bottom);

    if (repo.archived) tile.appendChild(el("span", "repo-archived", "已归档 · 仅供参考"));
    if (safeRepo(repo)) {
      const link = el("a", "stretched");
      link.href = repo.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "在 GitHub 打开 " + repo.name);
      tile.appendChild(link);
    }
    return tile;
  }

  function paintReviewCards() {
    const container = $("#review-cards");
    container.replaceChildren();
    const known = new Map(library.repos.map((r) => [r.name, r]));
    const rows = (library.review.priorityItems || []).filter((r) => known.has(r.name));
    if (!rows.length) {
      container.appendChild(el("p", "review-none", "目前没有需要优先复核的项目。"));
      return;
    }
    for (const item of rows) {
      const repo = known.get(item.name);
      const entry = el("article", "review-card");
      const body = el("div", "review-card-body");
      const title = el("a", "review-card-title", repo.name);
      title.href = repo.url;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
      body.appendChild(title);
      body.appendChild(el("p", "review-card-reason", item.reason));
      const controls = el("div", "review-card-controls");
      controls.appendChild(el("span", "review-mini-stars", item.stars + " Stars"));
      controls.appendChild(window.StarUI.makeButton(repo.name, "compact"));
      entry.append(body, controls);
      container.appendChild(entry);
    }
  }

  function matchRepos() {
    const query = lower(search.value.trim());
    const list = library.repos.filter((repo) => {
      if (active && repo.category !== active) return false;
      if (!query) return true;
      return [repo.name, repo.description, repo.category, repo.language, ...(repo.topics || [])]
        .some((s) => lower(s).includes(query));
    });
    switch (sorting.value) {
      case "oldest":
        return list.sort((a,b) => (a.starred || "").localeCompare(b.starred || "") || a.name.localeCompare(b.name));
      case "name":
        return list.sort((a,b) => a.name.localeCompare(b.name));
      default:
        return list.sort((a,b) => (b.starred || "").localeCompare(a.starred || "") || a.name.localeCompare(b.name));
    }
  }

  function filterPaint() {
    filterMessage.replaceChildren();
    if (!active && !search.value.trim()) return;
    if (active) {
      const chip = el("button", "clear-filter", active + " ×");
      chip.type = "button";
      chip.addEventListener("click", () => { active = ""; page = 1; repaint(); });
      filterMessage.appendChild(chip);
    }
    if (search.value.trim()) {
      const chip = el("button", "clear-filter", "清除搜索 ×");
      chip.type = "button";
      chip.addEventListener("click", () => { search.value = ""; page = 1; repaint(); search.focus(); });
      filterMessage.appendChild(chip);
    }
  }

  function paintPagination(total, maxPages) {
    pagination.replaceChildren();
    if (maxPages <= 1) return;
    const prev = el("button", "", "← 上一页");
    prev.disabled = page <= 1;
    prev.addEventListener("click", () => jump(page - 1));
    const next = el("button", "", "下一页 →");
    next.disabled = page >= maxPages;
    next.addEventListener("click", () => jump(page + 1));
    pagination.append(prev, el("span", "", page + " / " + maxPages), next);
  }

  function jump(to) {
    page = to;
    repaint();
    $(".collection-toolbar").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function repaint() {
    categoryPaint();
    filterPaint();
    const matched = matchRepos();
    const maxPages = Math.max(1, Math.ceil(matched.length / perPage));
    page = Math.min(page, maxPages);
    const kept = window.StarUI.retainedCount(library.repos.map((r) => r.name));
    $("#result-count").textContent = "展示 " + matched.length + " 条 · 仍收藏 " + kept + " 个";
    repositoryGrid.replaceChildren(...matched.slice((page - 1)*perPage, page*perPage).map(card));
    empty.hidden = matched.length !== 0;
    paintPagination(matched.length, maxPages);
  }
  function updateMetrics() {
    $("#stat-total").textContent = window.StarUI.retainedCount(library.repos.map((r) => r.name));
    $("#stat-recent").textContent = library.repos.filter((r) =>
      recentStarred(r) && window.StarUI.isStarred(r.name)).length;
  }
  document.addEventListener("starstatechange", () => {
    updateMetrics();
    repaint();
  });
  paintReviewCards();
  search.addEventListener("input", () => { page = 1; repaint(); });
  sorting.addEventListener("change", () => { page = 1; repaint(); });
  $("#reset-empty").addEventListener("click", () => { active = ""; search.value = ""; page = 1; repaint(); });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.target.closest("input,textarea,select") || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    search.focus();
  });
  repaint();
})();
