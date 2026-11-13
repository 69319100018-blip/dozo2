/* ============================================
   Dozo Genshin — Core (DOM refs, shared state, loading, init)
   ============================================ */

// ---------- DOM ----------
const loadingScreen = document.getElementById("loading-screen");
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");

const progressFill = document.getElementById("progress-fill");
const loadingText = document.getElementById("loading-text");
const particlesEl = document.getElementById("particles");

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const btnText = loginBtn.querySelector(".btn-text");
const btnLoader = loginBtn.querySelector(".btn-loader");
const authError = document.getElementById("auth-error");
const registerLink = document.getElementById("register-link");
const registerNameInput = document.getElementById("register-name");
const confirmPasswordInput = document.getElementById("confirm-password");
const registerNameGroup = document.getElementById("register-name-group");
const confirmPasswordGroup = document.getElementById("confirm-password-group");
const authFooterText = document.getElementById("auth-footer-text");
let isRegisterMode = false;

const userEmailEl = document.getElementById("user-email");
const displayNameEl = document.getElementById("display-name");
const logoutBtn = document.getElementById("logout-btn");
const loginHeaderBtn = document.getElementById("login-header-btn");

// Views
const views = {
  home: document.getElementById("view-home"),
  orderFarm: document.getElementById("view-order-farm"),
  orderMaterial: document.getElementById("view-order-material"),
  orderBuild: document.getElementById("view-order-build"),
  orderAbyss: document.getElementById("view-order-abyss"),
  orderExplore: document.getElementById("view-order-explore"),
  orderOculus: document.getElementById("view-order-oculus"),
  history: document.getElementById("view-history"),
  contact: document.getElementById("view-contact"),
  admin: document.getElementById("view-admin"),
  staff: document.getElementById("view-staff")
};

// Farm form
const packageGrid = document.getElementById("package-grid");
const rushCheck = document.getElementById("rush-check");
const totalPriceEl = document.getElementById("total-price");
const farmForm = document.getElementById("farm-form");
const slipUpload = document.getElementById("slip-upload");
const uploadArea = document.getElementById("upload-area");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const slipPreview = document.getElementById("slip-preview");
const slipError = document.getElementById("slip-error");
const btnSubmitOrder = document.getElementById("btn-submit-order");

// Material form
const materialForm = document.getElementById("material-form");
const btnSubmitMaterial = document.getElementById("btn-submit-material");
const matTypeGrid = document.getElementById("mat-type-grid");

// Build character form
const buildForm = document.getElementById("build-form");
const btnSubmitBuild = document.getElementById("btn-submit-build");
const buildCharGrid = document.getElementById("build-char-grid");
const buildCharSearch = document.getElementById("build-char-search");
const buildCharSelectedHint = document.getElementById("build-char-selected-hint");
const buildGoalGrid = document.getElementById("build-goal-grid");


const abyssForm = document.getElementById("abyss-form");
const exploreForm = document.getElementById("explore-form");
const btnSubmitAbyss = document.getElementById("btn-submit-abyss");
const btnSubmitExplore = document.getElementById("btn-submit-explore");
const abyssPackageGrid = document.getElementById("abyss-package-grid");
const explorePackageGrid = document.getElementById("explore-package-grid");

let selectedAbyss = null;
let hasAbyssSlip = false;
let selectedExplore = null;
let selectedExplorePercent = null;
let selectedExploreAreaCount = null;
let hasExploreSlip = false;
let hasExploreMap = false;
let selectedExploreMapFile = null;
let exploreQrGenerated = false;
let lastExploreQrAmount = null;

let currentUser = null;
let isAdmin = false;
let isStaff = false;
let staffListCache = [];
let adminOrdersCache = [];


// ---------- Neon API client ----------
async function loadOrders() {
  return DozoAPI.listOrders();
}

// รูปจะถูกเก็บใน Private Vercel Blob ส่วน Neon เก็บเฉพาะ pathname
async function saveOrder(order, { slipFile, attachmentFile = null, attachmentPurpose = "material_screenshot" } = {}) {
  if (!slipFile) throw new Error("กรุณาเลือกไฟล์สลิปก่อนสั่งซื้อ");
  const slip = await DozoAPI.uploadFile(slipFile, "slip");
  let attachment = null;
  if (attachmentFile) {
    attachment = await DozoAPI.uploadFile(attachmentFile, attachmentPurpose);
  }
  return DozoAPI.createOrder({
    ...order,
    slipPath: slip.pathname,
    attachmentPath: attachment?.pathname || null
  });
}

async function updateOrderStatus(id, status) {
  return DozoAPI.updateOrderStatus(id, status);
}


// ---------- Particles ----------
function createParticles(count = 18) {
  if (!particlesEl) return;
  particlesEl.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = (8 + Math.random() * 10) + "s";
    p.style.animationDelay = (Math.random() * 6) + "s";
    p.style.opacity = (0.2 + Math.random() * 0.5).toFixed(2);
    if (Math.random() > 0.6) p.style.background = "rgba(233, 196, 106, 0.5)";
    particlesEl.appendChild(p);
  }
}

// ---------- Loading ----------
const loadingMessages = [
  "กำลังเตรียมระบบ...",
  "โหลดข้อมูลบริการ...",
  "เชื่อมต่อเซิร์ฟเวอร์...",
  "เกือบเสร็จแล้ว..."
];

function startLoading() {
  createParticles(20);
  let progress = 0;
  let msgIndex = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 16 + 7;
    if (progress > 100) progress = 100;
    progressFill.style.width = progress + "%";

    if (progress > 22 && msgIndex === 0) { loadingText.textContent = loadingMessages[1]; msgIndex = 1; }
    else if (progress > 48 && msgIndex === 1) { loadingText.textContent = loadingMessages[2]; msgIndex = 2; }
    else if (progress > 75 && msgIndex === 2) { loadingText.textContent = loadingMessages[3]; msgIndex = 3; }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        // เข้าหน้าหลักได้เลย ไม่บังคับล็อกอิน
        switchScreen(loadingScreen, dashboardScreen);
        checkAuthState();
      }, 450);
    }
  }, 260);
}

function switchScreen(from, to) {
  from.classList.remove("active");
  setTimeout(() => {
    from.style.display = "none";
    to.style.display = to.id === "dashboard-screen" ? "flex" : "flex";
    void to.offsetWidth;
    to.classList.add("active");
  }, 550);
}


// ---------- Start ----------
/* Sticky glass header intensifies on scroll */
function bindHeaderScroll() {
  const header = document.querySelector(".dash-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

window.addEventListener("DOMContentLoaded", () => {
  bindExplorePercentButtons();
  bindAuthMethodTabs();
  bindHeaderScroll();
  startLoading();
});
/* ============================================
   Anti DevTools / Inspect guard (client-side)
   กันคนทั่วไป — ไม่ใช่ security จริง
   ============================================ */
(function () {
  "use strict";

  // 1) บล็อกคีย์ลัดเปิด DevTools
  document.addEventListener(
    "keydown",
    function (e) {
      const key = e.key || "";
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // F12
      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (ctrl && shift && (key === "I" || key === "J" || key === "C" || key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (view source)
      if (ctrl && (key === "U" || key === "u")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S (save page) — optional
      if (ctrl && (key === "S" || key === "s")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Mac: Cmd+Option+I / J / C
      if (e.metaKey && alt && (key === "I" || key === "J" || key === "C" || key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    true
  );

  // 2) ปิดคลิกขวา (context menu)
  document.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
      return false;
    },
    true
  );

  // 3) ตรวจจับว่า DevTools เปิดอยู่ (ประมาณการจากขนาดหน้าต่าง)
  //    ปรับ threshold ตามธีม/เครื่องได้
  let devtoolsOpen = false;
  const threshold = 160;

  function checkDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    const open = widthDiff || heightDiff;

    if (open && !devtoolsOpen) {
      devtoolsOpen = true;
      onDevToolsOpen();
    } else if (!open && devtoolsOpen) {
      devtoolsOpen = false;
    }
  }

  function onDevToolsOpen() {
    // เลือกอย่างใดอย่างหนึ่งตามที่ต้องการ:

    // A) แค่เตือน
    // console.clear();
    // alert("ไม่สามารถใช้เครื่องมือนักพัฒนาได้");

    // B) เคลียร์หน้า / redirect
    // document.body.innerHTML = "<h1 style='color:#fff;text-align:center;margin-top:20vh'>Access Denied</h1>";
    // window.location.href = "/";

    // C) เงียบไว้ (แค่บล็อกคีย์ + คลิกขวา)
  }

  setInterval(checkDevTools, 500);

  // 4) กัน drag รูป / เลือกข้อความ (optional)
  document.addEventListener("dragstart", (e) => e.preventDefault());
  // document.addEventListener("selectstart", (e) => e.preventDefault());
})();