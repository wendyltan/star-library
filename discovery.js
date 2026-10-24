"use strict";
(() => {
  const data = JSON.parse(document.getElementById("library-data").textContent);
  const all = Array.isArray(data.recommendations) ? data.recommendations : [];
  const grid = document.getElementById("discover-grid");
  const chips = document.getElementById("discover-categories");
  const more = document.getElementById("discover-more");
  const empty = document.getElementById("discover-empty");
  const label = document.getElementById("discover-date");
  if (!grid || !chips || !more) return;
  label.textContent = data.recommendations_as_of ?
    "更新于 " + data.recommendations_as_of : "每周更新";
  const mk = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = String(text);
    return node;
  };
  const number = new Intl.NumberFormat("zh-CN");
  const options = Array.from(new Set(all.map(item => item.category)));
  let active = "", shown = 6;
  function renderCard(item) {
    const card = mk("article", "discover-card");
    const type = mk("div", "discover-card-type");
    type.appendChild(mk("span", "discover-badge", item.category));
    card.append(type, mk("h3", "", item.name));
    card.appendChild(mk("p", "discover-description", item.description || "这个项目暂时没有简介。"));
    card.appendChild(mk("p", "discover-reason", "✦ " + item.reason));
    const growth = mk("div", "discover-growth");
    const week = mk("span");
    week.append(mk("strong", "", "+" + number.format(item.stars7)), " 近 7 天");
    const month = mk("span");
    month.append(mk("strong", "month", "+" + number.format(item.stars28)), " 近 28 天");
    growth.append(week, month);
    card.append(growth);
    if (Number.isInteger(item.issues_28d) && Number.isInteger(item.prs_28d)) {
      card.appendChild(mk("p", "discover-discussion",
        "☏ 近 28 天新建 " + item.issues_28d + " Issue · " +
        item.prs_28d + " PR"));
    }
    const footer=mk("div", "discover-footer");
    footer.appendChild(mk("span","total-stars", "累计 " + number.format(item.total) + " Stars"));
    const link=mk("a", "", "看看项目 ↗");
    link.href=item.url;
    link.target="_blank";
    link.rel="noopener noreferrer";
    link.setAttribute("aria-label", "在 GitHub 查看 " + item.name);
    footer.appendChild(link);
    const manage=mk("a", "discover-manage", "☆ 去 GitHub 收藏 ↗");
    manage.href=item.url;
    manage.target="_blank";
    manage.rel="noopener noreferrer";
    manage.setAttribute("aria-label", "在 GitHub 打开 " + item.name + " 并自行点击 Star（新标签页）");
    footer.appendChild(manage);
    card.appendChild(footer);
    return card;
  }
  function renderChips() {
    chips.replaceChildren();
    for (const name of ["全部推荐", ...options]) {
      const allChoice = name === "全部推荐";
      const button = mk("button", "discover-chip", name);
      button.type="button";
      button.setAttribute("aria-pressed", String((!active&&allChoice)||(active===name)));
      button.addEventListener("click",()=>{active=allChoice?"":name; shown=6; paint();});
      chips.appendChild(button);
    }
  }
  function paint() {
    const visible=all.filter(r=>!active||r.category===active);
    grid.replaceChildren(...visible.slice(0,shown).map(renderCard));
    more.hidden=visible.length<=shown;
    empty.hidden=visible.length>0;
    renderChips();
  }
  more.addEventListener("click",()=>{shown+=6;paint();});
  paint();
})();
