/* Dozo Genshin — UX enhancements (ไม่แตะ logic เดิมใน app.js) */
(() => {
  "use strict";

  /* 1) Toast แทน alert() แบบบล็อกหน้าจอ */
  const host = document.createElement("div");
  host.className = "ux-toasts";
  host.setAttribute("aria-live", "polite");
  document.body.appendChild(host);

  function toast(message, ms) {
    const text = String(message ?? "");
    const isError = /ไม่สำเร็จ|ไม่ถูกต้อง|กรุณา|ไม่พบ|ผิดพลาด|ยังไม่/.test(text) && !/สำเร็จ!/.test(text);
    const el = document.createElement("div");
    el.className = "ux-toast" + (isError ? " is-error" : "");
    el.setAttribute("role", "status");
    el.textContent = text;
    host.appendChild(el);
    const life = ms || Math.min(9000, 2800 + text.length * 45);
    const close = () => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 320);
    };
    el.addEventListener("click", close);
    setTimeout(close, life);
  }
  window.alert = toast;

  /* 2) Header ย่อลงเมื่อเลื่อน (dashboard เป็นตัว scroll) */
  const dash = document.getElementById("dashboard-screen");
  const header = document.querySelector(".dash-header");
  dash?.addEventListener("scroll", () => {
    header?.classList.toggle("is-scrolled", dash.scrollTop > 12);
  }, { passive: true });

  /* 3) การ์ดบริการค่อย ๆ โผล่ทีละใบ (เฉพาะตอนเข้าหน้า ไม่เล่นซ้ำทุก hover) */
  function revealCards() {
    const cards = document.querySelectorAll("#view-home .service-card");
    cards.forEach((card, i) => {
      card.classList.remove("is-in");
      setTimeout(() => card.classList.add("is-in"), 70 + i * 70);
    });
  }

  /* 4) เปลี่ยนหน้า → เลื่อนกลับบนสุดอย่างนุ่มนวล + เล่น reveal เมื่อกลับหน้าหลัก */
  const main = document.querySelector(".dash-main");
  if (main) {
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        const el = m.target;
        if (el.classList?.contains("view") && el.classList.contains("active")) {
          dash?.scrollTo({ top: 0, behavior: "smooth" });
          if (el.id === "view-home") revealCards();
        }
      }
    }).observe(main, { attributes: true, attributeFilter: ["class"], subtree: true });
  }
  window.addEventListener("load", () => setTimeout(revealCards, 900));

  /* 5) Ripple บนปุ่มหลัก */
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest?.(".btn-primary, .btn-service, .btn-generate-qr");
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement("span");
    dot.className = "ux-ripple";
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
})();
