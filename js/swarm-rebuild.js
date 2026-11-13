/* ============================================
   Dozo Genshin — Motion Swarm Rebuild Intro
   10 agent cursors spread out and "rebuild" the UI piece by piece
   ============================================ */
(function () {
  "use strict";

  const CURSOR_COUNT = 10;
  const SPREAD_MS = 2200;
  const WORK_MS = 1800;
  const FADE_MS = 700;

  const AGENT_LABELS = [
    "layout agent",
    "style agent",
    "hero agent",
    "nav agent",
    "form agent",
    "glass agent",
    "motion agent",
    "type agent",
    "color agent",
    "ship agent",
  ];

  /** Classic pointer cursor as inline SVG (gold-tinted) */
  function cursorSvg(hueOffset) {
    const stroke = `hsl(${38 + hueOffset}, 70%, ${55 + (hueOffset % 10)}%)`;
    return `
      <svg class="swarm-cursor-svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="${stroke}" stroke="rgba(0,0,0,0.45)" stroke-width="1.2"
          d="M4.5 3.5l14 8.2-6.1 1.5 3.2 7.2-2.6 1.2-3.3-7.3-5.2 4.1z"/>
      </svg>`;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Run swarm rebuild over the loading screen, then call onDone()
   */
  function runSwarmRebuild({ onProgress, onDone } = {}) {
    if (prefersReducedMotion()) {
      onProgress?.(100);
      onDone?.();
      return;
    }

    const host = document.getElementById("loading-screen");
    if (!host) {
      onDone?.();
      return;
    }

    // Layer
    const layer = document.createElement("div");
    layer.id = "swarm-layer";
    layer.className = "swarm-layer";
    layer.innerHTML = `
      <div class="swarm-status">
        <span class="swarm-status-dot"></span>
        <span class="swarm-status-text" id="swarm-status-text">AI agents initializing…</span>
      </div>
      <div class="swarm-cursors" id="swarm-cursors"></div>
      <div class="swarm-beams" id="swarm-beams" aria-hidden="true"></div>
    `;
    host.appendChild(layer);

    const cursorsRoot = layer.querySelector("#swarm-cursors");
    const statusText = layer.querySelector("#swarm-status-text");
    const introPieces = [
      host.querySelector(".intro-avatar-wrap"),
      host.querySelector(".intro-title"),
      host.querySelector(".intro-sub"),
      host.querySelector(".progress-wrapper"),
    ].filter(Boolean);

    // Start intro pieces hidden (rebuild reveal)
    introPieces.forEach((el) => {
      el.classList.add("swarm-piece", "swarm-piece-hidden");
    });

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.32;

    const agents = [];
    for (let i = 0; i < CURSOR_COUNT; i++) {
      const angle = (i / CURSOR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const tx = cx + Math.cos(angle) * radius;
      const ty = cy + Math.sin(angle) * radius * 0.85;

      const el = document.createElement("div");
      el.className = "swarm-agent";
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      el.innerHTML = `
        ${cursorSvg(i * 4)}
        <span class="swarm-agent-label">${AGENT_LABELS[i] || "agent " + (i + 1)}</span>
      `;
      cursorsRoot.appendChild(el);
      agents.push({ el, tx, ty, angle, i });
    }

    // Phase 1 — spawn pulse at center
    statusText.textContent = "Spawning agent swarm…";
    onProgress?.(8);

    requestAnimationFrame(() => {
      layer.classList.add("is-active");
    });

    // Phase 2 — spread one-by-one
    const spreadDelay = SPREAD_MS / CURSOR_COUNT;
    agents.forEach((agent, i) => {
      setTimeout(() => {
        agent.el.classList.add("is-moving");
        agent.el.style.transform = `translate(-2px, -2px)`;
        agent.el.style.left = agent.tx + "px";
        agent.el.style.top = agent.ty + "px";
        agent.el.classList.add("is-spread");

        statusText.textContent = `${AGENT_LABELS[i]} deploying…`;
        onProgress?.(10 + Math.round(((i + 1) / CURSOR_COUNT) * 40));

        // Reveal intro pieces gradually
        const pieceIndex = Math.min(
          introPieces.length - 1,
          Math.floor((i / CURSOR_COUNT) * introPieces.length)
        );
        const piece = introPieces[pieceIndex];
        if (piece && piece.classList.contains("swarm-piece-hidden")) {
          piece.classList.remove("swarm-piece-hidden");
          piece.classList.add("swarm-piece-in");
        }
      }, 280 + i * spreadDelay);
    });

    // Phase 3 — "work" ticks (micro motion + status)
    const workStart = 280 + SPREAD_MS + 120;
    setTimeout(() => {
      statusText.textContent = "Agents rebuilding interface…";
      agents.forEach((agent) => {
        agent.el.classList.add("is-working");
      });
      // Reveal any remaining pieces
      introPieces.forEach((el) => {
        el.classList.remove("swarm-piece-hidden");
        el.classList.add("swarm-piece-in");
      });
      onProgress?.(70);
    }, workStart);

    // Fake work progress
    let workProgress = 70;
    const workTimer = setInterval(() => {
      workProgress = Math.min(98, workProgress + 4 + Math.random() * 5);
      onProgress?.(workProgress);
      if (workProgress >= 98) clearInterval(workTimer);
    }, 160);

    // Phase 4 — collapse + fade
    setTimeout(() => {
      clearInterval(workTimer);
      statusText.textContent = "Build complete — handing off…";
      onProgress?.(100);

      agents.forEach((agent, i) => {
        setTimeout(() => {
          agent.el.classList.remove("is-working");
          agent.el.classList.add("is-exit");
          agent.el.style.left = cx + "px";
          agent.el.style.top = cy + "px";
          agent.el.style.opacity = "0";
        }, i * 40);
      });

      layer.classList.add("is-done");
      setTimeout(() => {
        layer.remove();
        onDone?.();
      }, FADE_MS + 200);
    }, workStart + WORK_MS);
  }

  window.DozoSwarm = { run: runSwarmRebuild };
})();
