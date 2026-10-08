(() => {
  "use strict";

  const courses = Array.isArray(window.COURSES) ? window.COURSES : [];
  const details = window.COURSE_DETAILS || {};
  const courseNav = document.querySelector("#course-nav");
  const outlineLink = document.querySelector(".outline-link");
  const view = document.querySelector("#view");
  const breadcrumb = document.querySelector("#breadcrumb");
  const sidebar = document.querySelector("#sidebar");
  const menuToggle = document.querySelector("#menu-toggle");
  const chapterLookup = new Map(courses.flatMap(course => course.chapters.map((chapter, index) => [chapter.id, { course, chapter, index }])));

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function routeId() {
    try { return decodeURIComponent(location.hash.slice(1)) || "outline"; }
    catch { return "outline"; }
  }

  function chapterLink(chapter, index, withDescription = false) {
    return `<a href="#${escapeHtml(chapter.id)}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(chapter.title)}</strong>${withDescription ? `<small>${escapeHtml(chapter.lead)}</small>` : ""}</a>`;
  }

  function renderOutline() {
    return `<section class="view" aria-labelledby="page-title">
      <div class="page-hero"><p class="eyebrow">AI LEARNING HUB</p><h1 id="page-title">課程綱要</h1><p class="lead">${courses.length} 次課程形成一條學習路徑：從 AI 趨勢與台灣戰略出發，理解企業導入和成本治理，最後把工作做成可重複、可查核、可停止的流程。</p></div>
      <div class="outline-list">${courses.map((course, index) => `
        <article class="outline-card"><span class="outline-index ${index === 1 ? "mint" : index === 2 ? "purple" : ""}">${String(course.id).padStart(2, "0")}</span>
          <div><p class="card-kicker">${escapeHtml(course.name)} · ${course.chapters.length} 章</p><h2><a href="#course-${course.id}">${escapeHtml(course.subtitle)}</a></h2><p>${escapeHtml(course.summary)}</p>
          <ul class="outline-outcomes">${course.outcomes.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <a class="outline-action" href="#course-${course.id}">查看本次課程章節 <span aria-hidden="true">→</span></a></div>
        </article>`).join("")}</div>
    </section>`;
  }

  function renderCourse(course) {
    return `<section class="view" aria-labelledby="page-title">
      <div class="page-hero"><p class="eyebrow">COURSE ${String(course.id).padStart(2, "0")}</p><h1 id="page-title">${escapeHtml(course.name)}</h1><p class="lead">${escapeHtml(course.subtitle)}。${escapeHtml(course.summary)}</p></div>
      <div class="course-outcomes"><h2>這次課程要帶走什麼</h2><ul>${course.outcomes.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      <div class="course-chapters"><div class="list-heading"><h2>課程章節</h2><span>${course.chapters.length} 章</span></div>
        <nav class="chapter-list" aria-label="${escapeHtml(course.name)}章節">${course.chapters.map((chapter, index) => chapterLink(chapter, index, true)).join("")}</nav>
      </div>
    </section>`;
  }

  function renderDag(block, markerId) {
    const nodes = new Map(block.nodes.map(([id, title, body, x, y]) => [id, { title, body, x: Number(x) * 8.8, y: Number(y) * 4.4 }]));
    const paths = block.edges.map(([from, to]) => {
      const a = nodes.get(from), b = nodes.get(to);
      if (!a || !b) return "";
      const startX = a.x + 89, endX = b.x - 95;
      const bend = Math.max(12, (endX - startX) * .47);
      return `<path d="M ${startX.toFixed(1)} ${a.y.toFixed(1)} C ${(startX + bend).toFixed(1)} ${a.y.toFixed(1)}, ${(endX - bend).toFixed(1)} ${b.y.toFixed(1)}, ${endX.toFixed(1)} ${b.y.toFixed(1)}" marker-end="url(#${markerId})"/>`;
    }).join("");
    return `<div class="diagram-scroll" tabindex="0" aria-label="可橫向捲動的相依關係圖"><div class="dag-board">
      <svg viewBox="0 0 880 440" aria-hidden="true" focusable="false"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" class="arrow-head"/></marker></defs>${paths}</svg>
      <ol class="dag-nodes">${block.nodes.map(([id, title, body, x, y]) => `<li style="left:${Number(x)}%;top:${Number(y)}%"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></li>`).join("")}</ol>
    </div></div><p class="diagram-edges">關係：${block.edges.map(([from, to]) => `${escapeHtml(nodes.get(from)?.title || from)} → ${escapeHtml(nodes.get(to)?.title || to)}`).join("；")}</p>`;
  }

  function renderDetailBlock(block, chapter, index) {
    const id = `section-${chapter.id}-${index + 1}`;
    const title = `<h2 id="${id}">${escapeHtml(block.title)}</h2>`;
    const intro = block.intro ? `<p class="block-intro">${escapeHtml(block.intro)}</p>` : "";
    let body = "";
    if (block.type === "prose") {
      body = block.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
    } else if (block.type === "bullets") {
      body = `<ul class="explain-list">${block.items.map(([heading, text]) => `<li><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(text)}</p></li>`).join("")}</ul>`;
    } else if (block.type === "flow") {
      body = `<ol class="flow-list">${block.steps.map(([heading, text]) => `<li><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(text)}</p></li>`).join("")}</ol>`;
    } else if (block.type === "layers") {
      body = `<ol class="layer-list">${block.layers.map(([heading, text]) => `<li><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(text)}</p></li>`).join("")}</ol>`;
    } else if (block.type === "relation") {
      body = `<figure class="relation-figure"><div class="relation-core"><strong>${escapeHtml(block.center[0])}</strong><p>${escapeHtml(block.center[1])}</p></div><ul class="relation-branches">${block.branches.map(([heading, text]) => `<li><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(text)}</p></li>`).join("")}</ul></figure>`;
    } else if (block.type === "comparison") {
      body = `<div class="compare-grid">${block.columns.map(([heading, text]) => `<div><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(text)}</p></div>`).join("")}</div>${block.note ? `<p class="compare-note">${escapeHtml(block.note)}</p>` : ""}`;
    } else if (block.type === "scenario") {
      body = `<div class="scenario"><p class="scenario-label">情境</p><p>${escapeHtml(block.situation)}</p><p class="scenario-label">如何處理</p><p>${escapeHtml(block.explanation)}</p></div>`;
    } else if (block.type === "dag") {
      body = renderDag(block, `arrow-${chapter.id}-${index}`);
    }
    return `<section class="detail-block detail-${escapeHtml(block.type)}" aria-labelledby="${id}">${title}${intro}${body}</section>`;
  }

  function renderChapter(course, chapter, index) {
    const next = course.chapters[index + 1];
    const blocks = Array.isArray(details[chapter.id]) ? details[chapter.id] : [];
    const contents = blocks.length
      ? `<nav class="section-nav" aria-label="本章內容"><strong>本章內容</strong><ol>${blocks.map((block, i) => `<li><a href="#section-${chapter.id}-${i + 1}">${escapeHtml(block.title)}</a></li>`).join("")}</ol></nav>${blocks.map((block, i) => renderDetailBlock(block, chapter, i)).join("")}`
      : `<section class="concept-block"><h2>核心概念</h2><p>${escapeHtml(chapter.concept)}</p></section><section><h2 class="content-title">操作原則</h2><ol class="principles">${chapter.principles.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></li>`).join("")}</ol></section>`;
    return `<article class="view chapter-view" aria-labelledby="page-title">
      <header class="chapter-head"><p class="eyebrow">${escapeHtml(course.name)} · 第 ${index + 1} 章</p><h1 id="page-title">${escapeHtml(chapter.title)}</h1><p class="lead">${escapeHtml(chapter.lead)}</p></header>
      ${contents}
      <section class="check-block" aria-labelledby="checks-title"><h2 id="checks-title">本章檢核</h2><ul>${chapter.checks.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      <p class="source-note">對應教材：${escapeHtml(chapter.source)}</p>
      <nav class="chapter-footer" aria-label="章節導覽"><a href="#course-${course.id}">返回${escapeHtml(course.name)}</a><span>第 ${index + 1} / ${course.chapters.length} 章</span><a href="${next ? `#${escapeHtml(next.id)}` : "#outline"}">${next ? "下一章 →" : "返回課程綱要 ↑"}</a></nav>
    </article>`;
  }

  function buildNav() {
    courseNav.innerHTML = courses.map(course => `
      <details class="course-group" data-course="${course.id}"><summary><span class="course-number">${String(course.id).padStart(2, "0")}</span><span>${escapeHtml(course.name)}<small>${escapeHtml(course.subtitle)}</small></span><span class="chevron" aria-hidden="true">⌄</span></summary>
      <div class="chapter-nav">${course.chapters.map((chapter, index) => `<a href="#${escapeHtml(chapter.id)}">${index + 1}. ${escapeHtml(chapter.title)}</a>`).join("")}</div></details>
    `).join("");
    courseNav.querySelectorAll("summary").forEach(summary => {
      summary.addEventListener("click", event => {
        event.preventDefault();
        const courseId = summary.parentElement.dataset.course;
        const target = `course-${courseId}`;
        location.hash = routeId() === target ? "outline" : target;
      });
    });
  }

  function closeMobileMenu() {
    sidebar.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "開啟課程目錄");
  }

  function showRoute() {
    const id = routeId();
    if (id === "main") return;
    const chapterMatch = chapterLookup.get(id);
    const courseMatch = id.startsWith("course-") ? courses.find(item => `course-${item.id}` === id) : null;
    const activeCourse = chapterMatch?.course || courseMatch;

    if (chapterMatch) view.innerHTML = renderChapter(chapterMatch.course, chapterMatch.chapter, chapterMatch.index);
    else if (courseMatch) view.innerHTML = renderCourse(courseMatch);
    else view.innerHTML = renderOutline();

    outlineLink.classList.toggle("active", !activeCourse);
    if (activeCourse) outlineLink.removeAttribute("aria-current");
    else outlineLink.setAttribute("aria-current", "page");
    courseNav.querySelectorAll(".course-group").forEach(group => {
      const current = String(activeCourse?.id) === group.dataset.course;
      group.open = current;
      group.classList.toggle("current", current);
      group.querySelectorAll(".chapter-nav a").forEach(link => {
        const selected = chapterMatch && link.getAttribute("href") === `#${chapterMatch.chapter.id}`;
        link.classList.toggle("active", Boolean(selected));
        if (selected) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    });
    const title = chapterMatch?.chapter.title || courseMatch?.name || "課程綱要";
    breadcrumb.textContent = chapterMatch ? `${chapterMatch.course.name} / ${title}` : title;
    document.title = `${title}｜AI 內訓課程`;
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  menuToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "關閉課程目錄" : "開啟課程目錄");
  });
  view.addEventListener("click", event => {
    const link = event.target.closest(".section-nav a");
    if (!link) return;
    event.preventDefault();
    const target = view.querySelector(link.getAttribute("href"));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  sidebar.addEventListener("click", event => { if (event.target.closest("a")) closeMobileMenu(); });
  document.addEventListener("click", event => {
    if (window.innerWidth <= 780 && !event.target.closest(".sidebar") && !event.target.closest(".menu-toggle")) closeMobileMenu();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMobileMenu(); });
  window.addEventListener("hashchange", showRoute);

  if (courses.length) { buildNav(); showRoute(); }
  else view.innerHTML = '<p class="load-error">課程內容無法載入，請確認 assets/courses.js 與網站放在同一個資料夾。</p>';
})();
