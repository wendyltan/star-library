"use strict";
// Badge gallery consumes pre-validated payload only. No API writes of any kind.
(() => {
  const data = JSON.parse(document.getElementById("library-data").textContent);
  const badgeData = data.badges || {};
  const catalogue = Array.isArray(badgeData.catalogue) ? badgeData.catalogue : [];
  const $ = (query) => document.querySelector(query);
  const el = (tag, cls, text) => {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = String(text);
    return item;
  };
  const gallery = $("#badge-gallery");
  const tabs = $("#badge-family-tabs");
  const more = $("#badge-more");
  if (!gallery || !tabs || !more) return;
  const familyColors = {
    "星星种子":["#d9b67b","#f7e6bc"],
    "分类漫游":["#d7a1ab","#f7e5e7"],
    "研究室":["#97b8b1","#e1f0e9"],
    "作者宇宙":["#b2a5cc","#efebfa"],
    "探索足迹":["#9cb5d6","#e4ecfb"],
  };
  const order = Object.keys(familyColors);
  let group = "", status = "all", expanded = false;

  $("#badge-summary-number").replaceChildren(
    document.createTextNode(badgeData.unlocked || 0),
    el("em","", " / " + (badgeData.total || 42))
  );
  $("#badge-count-caption").textContent = (badgeData.total
    ? (badgeData.unlocked + " 枚已获得 · " + (badgeData.total-badgeData.unlocked) + " 枚待探索")
    : "成就数据正在建立中。");
  $("#badge-first-day").textContent = badgeData.baseline
    ? "✦ 成就登记开始于 " + badgeData.baseline + " · " +
      (badgeData.as_of ? "本轮更新 " + badgeData.as_of : "")
    : "✦ 正在等待首份可验证的授勋记录";
  $("#badge-hero-title").textContent = badgeData.total
    ? "已经收好 " + badgeData.unlocked + " 枚小小荣誉。"
    : "把你的每次发现都认真收好。";

  function medal(badge) {
    const circle = el("div","badge-medal");
    const palette = familyColors[badge.group] || familyColors["星星种子"];
    circle.style.setProperty("--ring",palette[0]);
    circle.style.setProperty("--glow",palette[1]);
    const illustration = el("img","badge-artwork");
    illustration.src = "./" + badge.artwork;
    illustration.alt = "";
    illustration.loading = "lazy";
    illustration.decoding = "async";
    circle.appendChild(illustration);
    circle.setAttribute("aria-hidden","true");
    return circle;
  }

  function detail(badge) {
    const dialog = $("#badge-detail");
    $("#badge-detail-ornament").replaceChildren(medal(badge));
    $("#badge-detail-family").textContent = badge.group + " / " + badge.id;
    $("#badge-detail-title").textContent = badge.name;
    $("#badge-detail-description").textContent = badge.criteria + " · " + badge.art;
    $("#badge-detail-progress").textContent = badge.unlocked && badge.current < badge.goal
      ?  "曾经达成，永久保留 · 当前 " + badge.current + " / " + badge.goal
      : badge.current + " / " + badge.goal + " · " + badge.percent + "%";
    $("#badge-detail-date").textContent = badge.unlocked
      ? (badge.basis === "initial_registration" ? "首次登记于 " : "获得于 ") + badge.recorded_at
      : "继续保持好奇，这枚勋章还在等你。";
    dialog.showModal();
  }

  $("#badge-detail-close").addEventListener("click", () => $("#badge-detail").close());

  function card(badge) {
    const item = el("button","badge-card");
    item.type="button";
    item.dataset.group=badge.group;
    item.dataset.locked=String(!badge.unlocked);
    item.setAttribute("aria-label",badge.name + "，" + (badge.unlocked ? "已获得" : "尚未解锁") + "，点击查看详情");
    item.appendChild(el("span","badge-ribbon", badge.unlocked ? "已获得 ✦" : "待解锁"));
    item.appendChild(medal(badge));
    item.appendChild(el("span","badge-id",badge.id + " · " + badge.group));
    item.appendChild(el("span","badge-title",badge.name));
    item.appendChild(el("span","badge-criteria",badge.criteria));
    const progress=el("div","badge-progress");
    const track=el("div","badge-track");
    const fill=el("span");
    fill.style.width=(badge.unlocked ? 100 : badge.percent) + "%";
    track.appendChild(fill);
    const text=el("div","badge-progress-text");
    text.append(
      el("span","",badge.unlocked ? "✓ 已珍藏" : "继续探索"),
      el("span","",badge.current + " / " + badge.goal)
    );
    progress.append(track,text);
    item.appendChild(progress);
    item.addEventListener("click",()=>detail(badge));
    return item;
  }

  function featured() {
    const selected = ["S06","C06","T02"]
      .map(id => catalogue.find(x => x.id===id && x.unlocked))
      .filter(Boolean);
    if (selected.length<3) {
      for(const b of catalogue) {
        if (selected.length>=3) break;
        if (b.unlocked && !selected.find(x=>x.id===b.id)) selected.push(b);
      }
    }
    $("#badge-featured").replaceChildren(...selected.map(b => {
      const panel=el("div","badge-feature");
      panel.append(medal(b),el("small","",b.name));
      return panel;
    }));
  }

  function drawTabs() {
    tabs.replaceChildren();
    const names=["全部系列",...order];
    names.forEach(name => {
      const btn=el("button","",name);
      btn.type="button";
      const all=name==="全部系列";
      btn.setAttribute("aria-pressed",String(all ? !group : group===name));
      btn.addEventListener("click",()=>{group=all?"":name;expanded=false;paint();});
      tabs.appendChild(btn);
    });
  }

  function paint() {
    const eligible=catalogue.filter(b =>
      (!group || b.group===group) &&
      (status==="all" || (status==="unlocked" ? b.unlocked : !b.unlocked))
    );
    const show=expanded ? eligible : eligible.slice(0,12);
    gallery.replaceChildren(...show.map(card));
    if (!eligible.length) gallery.append(el("div","badge-gallery-empty","这里暂时没有符合条件的勋章。"));
    more.hidden=eligible.length<=12;
    more.textContent=expanded ? "收起部分勋章 ↑" : "展开整本图鉴 · 共 " + eligible.length + " 枚 ↓";
    drawTabs();
  }

  document.querySelectorAll(".badge-status").forEach(btn=>{
    btn.addEventListener("click",()=>{
      status=btn.dataset.status;expanded=false;
      document.querySelectorAll(".badge-status").forEach(item=>{
        const on=item===btn;
        item.classList.toggle("active",on);
        item.setAttribute("aria-pressed",String(on));
      });
      paint();
    });
  });
  more.addEventListener("click",()=>{expanded=!expanded;paint();});
  featured();
  paint();
})();
