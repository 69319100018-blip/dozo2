/* ============================================
   Dozo Genshin - Main App Script
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

const MATERIAL_TYPES = [
  { id: "ascension", label: "เลื่อนขั้นตัวละคร", sub: "Ascension mats" },
  { id: "talent", label: "Talent / หนังสือ", sub: "สกิลตัวละคร" },
  { id: "weapon", label: "วัสดุอาวุธ", sub: "เลื่อนขั้นอาวุธ" },
  { id: "boss", label: "บอส / รายสัปดาห์", sub: "Boss · Weekly" },
  { id: "local", label: "ของท้องถิ่น", sub: "ฟาร์มโลก" },
  { id: "custom", label: "กำหนดเอง", sub: "ระบุในรายละเอียด" }
];

const BUILD_GOALS = [
  { id: "level-90", label: "ปั้นถึง Lv.90", sub: "เลเวลเต็ม" },
  { id: "ascension-only", label: "เลื่อนขั้นอย่างเดียว", sub: "Ascension" },
  { id: "talent-focus", label: "เน้น Talent", sub: "อัพสกิล" },
  { id: "full-build", label: "ปั้นครบชุด", sub: "เลเวล + Talent" },
  { id: "custom", label: "กำหนดเอง", sub: "ระบุรายละเอียด" }
];

// Abyss / Explore
const abyssForm = document.getElementById("abyss-form");
const exploreForm = document.getElementById("explore-form");
const btnSubmitAbyss = document.getElementById("btn-submit-abyss");
const btnSubmitExplore = document.getElementById("btn-submit-explore");
const abyssPackageGrid = document.getElementById("abyss-package-grid");
const explorePackageGrid = document.getElementById("explore-package-grid");

const ABYSS_OPTIONS = [
  { id: "floor-9-10", label: "ชั้น 9–10", sub: "30 ฿", price: 30 },
  { id: "floor-9-11", label: "ชั้น 9–11", sub: "60 ฿", price: 60 },
  { id: "floor-9-12", label: "ชั้น 9–12", sub: "120 ฿", price: 120 },
  { id: "floor-11-12", label: "ชั้น 11–12", sub: "100 ฿", price: 100 },
  { id: "full-36", label: "36 ดาว", sub: "170 ฿", price: 170 },
];

const EXPLORE_OPTIONS = [
  { id: "mondstadt", label: "Mondstadt", areas: 6 },
  { id: "liyue", label: "Liyue", areas: 9 },
  { id: "inazuma", label: "Inazuma", areas: 6 },
  { id: "sumeru", label: "Sumeru", areas: 13 },
  { id: "fontaine", label: "Fontaine", areas: 8 },
  { id: "natlan", label: "Natlan", areas: 9 },
  { id: "nod-krai", label: "Nod-Krai", areas: 7 },
  { id: "enkanomiya", label: "Enkanomiya", areas: 3 },
  { id: "chasm", label: "The Chasm", areas: 3 },
  { id: "sea-of-bygone", label: "Sea of Bygone Eras", areas: 3 },
  { id: "ancient-sacred-mountain", label: "Ancient Sacred Mountain", areas: 6 },
  { id: "temple-of-space", label: "Temple of Space", areas: 3 },
  { id: "frostmoon", label: "Frostmoon", areas: 3 },
].map((opt) => ({ ...opt, sub: `${opt.areas} พื้นที่` }));

const EXPLORE_RATE_PER_PERCENT = 2; // 1% = 2 ฿ ต่อ 1 พื้นที่
const EXPLORE_AREA_LIMITS = Object.fromEntries(
  EXPLORE_OPTIONS.map((opt) => [opt.id, opt.areas])
);

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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
}

function privateFileLink(pathname, label) {
  if (!pathname) return "";
  const url = DozoAPI.fileUrl(pathname);
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

function attachmentLabelForService(service) {
  if (service === "explore" || service === "farm-gem") return "ดูภาพแมพ";
  if (service === "build-char") return "ดูภาพตัวละคร";
  if (service === "material") return "ดูภาพวัสดุ";
  return "ดูไฟล์แนบ";
}

function orderFilesHtml(o) {
  return [
    privateFileLink(o.slipPath, "ดูสลิป"),
    privateFileLink(o.attachmentPath, attachmentLabelForService(o.service)),
  ].filter(Boolean).join(" · ");
}

async function handleOrderError(error) {
  console.error(error);
  alert(error?.message || "บันทึกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
}

// ---------- Packages: ลูกค้าปกติ (cus) ----------
const CUSTOMER_PACKAGES = [
  { gems: 160, price: 10 },
  { gems: 320, price: 18 },
  { gems: 480, price: 29 },
  { gems: 680, price: 36 },
  { gems: 800, price: 49 },
  { gems: 1600, price: 90 },
  { gems: 3200, price: 180 },
  { gems: 4800, price: 290 },
  { gems: 6400, price: 380 },
  { gems: 8000, price: 490 },
  { gems: 9600, price: 570 },
  { gems: 11200, price: 695 },
  { gems: 12800, price: 785 },
  { gems: 14400, price: 895 },
  { gems: 16000, price: 1090 },
];

// ---------- Packages: สมาชิก (mem) ----------
const MEMBER_PACKAGES = [
  { gems: 160, price: 10 },
  { gems: 320, price: 18 },
  { gems: 480, price: 29 },
  { gems: 680, price: 36 },
  { gems: 800, price: 49 },
  { gems: 1600, price: 90 },
  { gems: 3200, price: 180 },
  { gems: 4800, price: 275 },
  { gems: 6400, price: 361 },
  { gems: 8000, price: 465 },
  { gems: 9600, price: 541 },
  { gems: 11200, price: 660 },
  { gems: 12800, price: 745 },
  { gems: 14400, price: 850 },
  { gems: 16000, price: 1035 },
];

function getActivePackages() {
  return isMemberUser() ? MEMBER_PACKAGES : CUSTOMER_PACKAGES;
}

function isMemberUser() {
  const role = currentUser?.role;
  return role === "member" || role === "staff" || role === "admin";
}

// ---------- รายชื่อตัวละคร Genshin (playable) ----------
const CHARACTERS = [
  // Mondstadt
  "Albedo", "Amber", "Barbara", "Bennett", "Diluc", "Diona", "Eula", "Fischl",
  "Jean", "Kaeya", "Klee", "Lisa", "Mika", "Mona", "Noelle", "Razor", "Rosaria",
  "Sucrose", "Venti",
  // Liyue
  "Baizhu", "Beidou", "Chongyun", "Gaming", "Ganyu", "Hu Tao", "Keqing",
  "Ningguang", "Qiqi", "Shenhe", "Xiangling", "Xingqiu", "Xinyan", "Yanfei",
  "Yaoyao", "Yun Jin", "Zhongli", "Xianyun",
  // Inazuma
  "Arataki Itto", "Gorou", "Kaedehara Kazuha", "Kamisato Ayaka", "Kamisato Ayato",
  "Kujou Sara", "Kuki Shinobu", "Raiden Shogun", "Sangonomiya Kokomi",
  "Sayu", "Shikanoin Heizou", "Thoma", "Yae Miko", "Yoimiya", "Kirara",
  // Sumeru
  "Alhaitham", "Candace", "Collei", "Cyno", "Dehya", "Dori", "Faruzan",
  "Kaveh", "Layla", "Nahida", "Nilou", "Tighnari", "Wanderer", "Sethos",
  // Fontaine
  "Charlotte", "Chevreuse", "Clorinde", "Emilie", "Freminet", "Furina",
  "Lynette", "Lyney", "Navia", "Neuvillette", "Sigewinne", "Wriothesley",
  // Natlan
  "Chasca", "Citlali", "Iansan", "Kachina", "Kinich", "Mualani", "Ororon",
  "Xilonen", "Mavuika",
  // Other / Traveler
  "Traveler (Anemo)", "Traveler (Geo)", "Traveler (Electro)", "Traveler (Dendro)",
  "Traveler (Hydro)", "Traveler (Pyro)", "Aloy"
].sort((a, b) => a.localeCompare(b));

let selectedPackage = null;
let hasSlip = false;
let selectedFarmSlipFile = null;
let hasFarmMap = false;
let selectedFarmMapFile = null;
let selectedMatScreenshotFile = null;
let selectedMatSlipFile = null;
let selectedBuildScreenshotFile = null;
let selectedBuildSlipFile = null;
let selectedAbyssSlipFile = null;
let selectedExploreSlipFile = null;

let selectedMaterialType = null;
let hasMatShot = false;
let hasMatSlip = false;

let selectedBuildCharacter = null;
let selectedBuildGoal = null;
let hasBuildShot = false;
let hasBuildSlip = false;

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

// ---------- Auth ----------
function showError(msg) {
  authError.textContent = msg;
  authError.classList.remove("hidden");
}
function hideError() { authError.classList.add("hidden"); }

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  btnText.classList.toggle("hidden", isLoading);
  btnLoader.classList.toggle("hidden", !isLoading);
}

function setAuthMode(registerMode) {
  isRegisterMode = registerMode;
  registerNameGroup?.classList.toggle("hidden", !registerMode);
  confirmPasswordGroup?.classList.toggle("hidden", !registerMode);
  if (registerNameInput) registerNameInput.required = registerMode;
  if (confirmPasswordInput) confirmPasswordInput.required = registerMode;
  if (passwordInput) passwordInput.autocomplete = registerMode ? "new-password" : "current-password";
  if (btnText) btnText.textContent = registerMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
  if (authFooterText) authFooterText.textContent = registerMode ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?";
  if (registerLink) registerLink.textContent = registerMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
  if (authError) authError.classList.add("hidden");
}

function applyRoleChrome(user) {
  isAdmin = user?.role === "admin";
  isStaff = user?.role === "staff";
  const isMember = user?.role === "member";

  document.querySelectorAll(".customer-only").forEach(el => {
    el.classList.toggle("hidden", isAdmin || isStaff);
  });
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });
  document.querySelectorAll(".staff-only").forEach(el => {
    el.classList.toggle("hidden", !isStaff);
  });

  // แบนเนอร์สมาชิก / โปรโมสมัครสมาชิก (เฉพาะลูกค้า ไม่โชว์ให้ staff/admin)
  const promo = document.getElementById("membership-promo");
  const activeBanner = document.getElementById("member-active-banner");
  if (promo) {
    promo.classList.toggle("hidden", isAdmin || isStaff || isMember);
  }
  if (activeBanner) {
    activeBanner.classList.toggle("hidden", isAdmin || isStaff || !isMember);
  }

  const badge = document.getElementById("role-badge");
  if (badge) {
    if (isAdmin) {
      badge.textContent = "ADMIN";
      badge.className = "role-badge role-admin";
    } else if (isStaff) {
      badge.textContent = "STAFF";
      badge.className = "role-badge role-staff";
    } else if (isMember) {
      badge.textContent = "MEMBER";
      badge.className = "role-badge role-member";
    } else {
      badge.textContent = "";
      badge.className = "role-badge hidden";
    }
  }

  // อัปเดตข้อความระดับราคาในหน้าฟาร์มเจม
  const tierNote = document.getElementById("farm-price-tier-note");
  if (tierNote) {
    if (isMemberUser()) {
      tierNote.textContent = "ราคาสมาชิก · ฟาร์มเจมถูกกว่าปกติประมาณ 5%";
      tierNote.className = "price-tier-note member";
    } else {
      tierNote.textContent = "ราคาลูกค้าทั่วไป · สมัครสมาชิกผ่านแชทเพื่อรับส่วนลดฟาร์มเจม";
      tierNote.className = "price-tier-note";
    }
  }
}

function updateAuthHeader(user) {
  const loggedIn = Boolean(user);
  if (userEmailEl) {
    userEmailEl.textContent = user?.email || "";
    userEmailEl.classList.toggle("hidden", !loggedIn);
  }
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !loggedIn);
  if (loginHeaderBtn) loginHeaderBtn.classList.toggle("hidden", loggedIn);
}

function enterAnonymousMode() {
  currentUser = null;
  isAdmin = false;
  isStaff = false;
  applyRoleChrome(null);
  updateAuthHeader(null);
  if (displayNameEl) displayNameEl.textContent = "นักเดินทาง";
  // อยู่บน dashboard อยู่แล้ว
  showView("home");
}

function goToDashboard(user) {
  currentUser = user;
  applyRoleChrome(user);
  updateAuthHeader(user);
  if (displayNameEl) {
    displayNameEl.textContent = user?.displayName || user?.email?.split("@")[0] || "นักเดินทาง";
  }

  // ปิดหน้า login ถ้าเปิดอยู่ แล้วไป dashboard
  if (loginScreen.classList.contains("active")) {
    switchScreen(loginScreen, dashboardScreen);
  } else {
    dashboardScreen.style.display = "flex";
    dashboardScreen.classList.add("active");
  }
  if (isAdmin) showView("admin");
  else if (isStaff) showView("staff");
  else showView("home");
}

function openLoginScreen() {
  hideError();
  setAuthMode(false);
  loginForm?.reset();
  dashboardScreen.classList.remove("active");
  setTimeout(() => {
    dashboardScreen.style.display = "none";
    loginScreen.style.display = "flex";
    void loginScreen.offsetWidth;
    loginScreen.classList.add("active");
  }, 200);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) { showError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }

  if (isRegisterMode && password !== confirmPasswordInput.value) {
    showError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    return;
  }

  setLoading(true);
  try {
    const result = isRegisterMode
      ? await DozoAPI.register({
          email,
          password,
          displayName: registerNameInput.value.trim()
        })
      : await DozoAPI.login({ email, password });
    goToDashboard(result.user);
    loginForm.reset();
    setAuthMode(false);
  } catch (error) {
    showError(error.message || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
  } finally {
    setLoading(false);
  }
});

registerLink.addEventListener("click", (e) => {
  e.preventDefault();
  setAuthMode(!isRegisterMode);
});

document.getElementById("skip-login-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  if (loginScreen.classList.contains("active")) {
    switchScreen(loginScreen, dashboardScreen);
  }
  enterAnonymousMode();
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await DozoAPI.logout();
  } catch (error) {
    console.error("Logout error:", error);
  }
  currentUser = null;
  isAdmin = false;
  isStaff = false;
  staffListCache = [];
  adminOrdersCache = [];
  enterAnonymousMode();
});

loginHeaderBtn?.addEventListener("click", () => {
  openLoginScreen();
});

async function checkAuthState() {
  try {
    await loadPromptPayConfig();
    const user = await DozoAPI.me();
    if (user) goToDashboard(user);
    else enterAnonymousMode();
  } catch (error) {
    console.error("Session check failed:", error);
    // ไม่บล็อกการใช้งาน — เข้าแบบไม่ล็อกอินได้
    enterAnonymousMode();
  }
}

// ---------- Views / Navbar ----------
function showView(name) {
  // กันแอดมิน/สตาฟ์หลุดไปหน้าสั่งซื้อ
  if ((isAdmin || isStaff) && (name === "home" || name.startsWith("order-"))) {
    name = isAdmin ? "admin" : "staff";
  }
  if (name === "admin" && !isAdmin) name = isStaff ? "staff" : "home";
  if (name === "staff" && !isStaff) name = isAdmin ? "admin" : "home";

  Object.values(views).forEach(v => v && v.classList.remove("active"));
  const map = {
    home: views.home,
    history: views.history,
    contact: views.contact,
    admin: views.admin,
    staff: views.staff,
    "order-farm": views.orderFarm,
    "order-material": views.orderMaterial,
    "order-build": views.orderBuild,
    "order-abyss": views.orderAbyss,
    "order-explore": views.orderExplore,
    "order-oculus": views.orderOculus
  };
  if (map[name]) map[name].classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });

  if (name === "admin" && isAdmin) renderAdminAll();
  if (name === "staff" && isStaff) renderStaffJobs();
  if (name === "history") renderCustomerHistory();
}

// หลังสั่งซื้อสำเร็จ — เด้งไปตารางคิวให้ลูกค้าแคปไปแจ้งร้าน
function goToQueueAfterOrder({ orderNumber, extraLines = "" } = {}) {
  const lines = [
    "✅ ส่งคำสั่งซื้อสำเร็จ!",
    "",
    orderNumber != null ? `รหัสออเดอร์: #${orderNumber}` : null,
    extraLines || null,
    "",
    "กำลังพาไปหน้าคิวออเดอร์ — กรุณาแคปคิวของตัวเองแล้วส่งมาทาง Facebook: Do Zo Genshin",
  ].filter((x) => x != null);
  alert(lines.join("\n"));
  showView("history");
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.getElementById("btn-back-home")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-mat")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-build")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-abyss")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-explore")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-goto-contact-member")?.addEventListener("click", () => showView("contact"));

document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.goto));
});

// Service cards — เปิดบนเว็บเฉพาะ farm-gem / abyss / explore / oculus
// หาวัสดุ + ปั้นตัวละคร ให้สอบถามที่ Facebook เท่านั้น
document.querySelectorAll(".service-card").forEach(card => {
  const btn = card.querySelector(".btn-service");
  btn?.addEventListener("click", () => {
    const service = card.dataset.service;
    if (service === "farm-gem") {
      showView("order-farm");
      renderPackages();
    } else if (service === "abyss") {
      showView("order-abyss");
      renderAbyssOptions();
    } else if (service === "explore") {
      showView("order-explore");
      renderExploreOptions();
    } else if (service === "oculus") {
      showView("order-oculus");
      renderOculusOptions();
    } else if (service === "material" || service === "build-char") {
      alert("บริการนี้รับเฉพาะทาง Facebook หน้าร้าน กรุณาทักสอบถามราคาโดยตรง");
      showView("contact");
    } else {
      alert("บริการนี้กำลังเตรียมเปิดให้ใช้งานเร็ว ๆ นี้");
    }
  });
});

// ---------- Packages ----------
function renderPackages() {
  packageGrid.innerHTML = "";
  selectedPackage = null;
  hasSlip = false;
  selectedFarmSlipFile = null;
  hasFarmMap = false;
  selectedFarmMapFile = null;
  if (slipUpload) slipUpload.value = "";
  slipPreview?.classList.add("hidden");
  if (uploadPlaceholder) uploadPlaceholder.style.display = "block";
  const farmMapPreview = document.getElementById("farm-map-preview");
  const farmMapPlaceholder = document.getElementById("farm-map-placeholder");
  const farmMapInput = document.getElementById("farm-map-upload");
  if (farmMapPreview) {
    farmMapPreview.src = "";
    farmMapPreview.classList.add("hidden");
  }
  if (farmMapPlaceholder) farmMapPlaceholder.style.display = "block";
  if (farmMapInput) farmMapInput.value = "";
  document.getElementById("farm-map-error")?.classList.remove("show");
  updateTotal();
  updateSubmitState();

  const packages = getActivePackages();
  const memberMode = isMemberUser();
  packages.forEach((pkg, idx) => {
    const el = document.createElement("div");
    el.className = "package-item";
    el.dataset.index = idx;
    el.innerHTML = `
      <span class="gems">${pkg.gems.toLocaleString()} เจม</span>
      <span class="price">${pkg.price} ฿${memberMode ? '<small class="mem-tag">สมาชิก</small>' : ""}</span>
    `;
    el.addEventListener("click", () => {
      packageGrid.querySelectorAll(".package-item").forEach(p => p.classList.remove("selected"));
      el.classList.add("selected");
      selectedPackage = pkg;
      updateTotal();
      updateSubmitState();
    });
    packageGrid.appendChild(el);
  });

}

function getFarmExtraFees() {
  let extra = 0;
  if (document.getElementById("farm-no-daily-gems")?.checked) extra += 20;
  if (document.getElementById("farm-no-abyss-theater-gems")?.checked) extra += 50;
  if (document.querySelector('input[name="farm-combat"]:checked')?.value === "cannot") extra += 50;
  return extra;
}

function getFarmTotalAmount() {
  if (!selectedPackage) return null;
  let price = Number(selectedPackage.price) || 0;
  if (rushCheck?.checked) {
    price = Math.round(price * 1.3);
  }
  price += getFarmExtraFees();
  return price > 0 ? price : null;
}

function updateTotal() {
  const price = getFarmTotalAmount();
  if (totalPriceEl) {
    totalPriceEl.textContent = price != null ? price.toLocaleString() + " ฿" : "0 ฿";
  }
  // เปลี่ยนยอด → ล้าง QR เก่า ให้กดสร้างใหม่
  if (price !== lastFarmQrAmount) {
    resetFarmQr();
  }
  updateGenerateQrButton();
}

rushCheck?.addEventListener("change", updateTotal);
document.getElementById("farm-no-daily-gems")?.addEventListener("change", updateTotal);
document.getElementById("farm-no-abyss-theater-gems")?.addEventListener("change", updateTotal);
document.querySelectorAll('input[name="farm-combat"]').forEach((el) => {
  el.addEventListener("change", updateTotal);
});

const AUTH_METHOD_META = {
  hoyoverse: {
    hint: "สมัครด้วย Hoyoverse — กรอกอีเมล/ยูสเซอร์และรหัสผ่านบัญชีเกม",
    loginLabel: "4. ID (ล็อกอิน)",
    loginPlaceholder: "อีเมล / ยูสเซอร์ล็อกอิน Hoyoverse",
    passLabel: "5. Pass",
    passPlaceholder: "รหัสผ่านบัญชี Hoyoverse",
  },
  google: {
    hint: "สมัครด้วย Google — ใช้อีเมล Google ที่ผูกกับไอดีเกม",
    loginLabel: "4. อีเมล Google",
    loginPlaceholder: "เช่น name@gmail.com",
    passLabel: "5. รหัสผ่าน Google",
    passPlaceholder: "รหัสผ่านบัญชี Google",
  },
  apple: {
    hint: "สมัครด้วย Apple — ใช้ Apple ID ที่ผูกกับไอดีเกม",
    loginLabel: "4. Apple ID",
    loginPlaceholder: "อีเมล Apple ID",
    passLabel: "5. รหัสผ่าน Apple",
    passPlaceholder: "รหัสผ่าน Apple ID",
  },
  facebook: {
    hint: "สมัครด้วย Facebook — ใช้บัญชี Facebook ที่ผูกกับไอดีเกม",
    loginLabel: "4. บัญชี Facebook",
    loginPlaceholder: "อีเมล / เบอร์ / ชื่อผู้ใช้ Facebook",
    passLabel: "5. รหัสผ่าน Facebook",
    passPlaceholder: "รหัสผ่านบัญชี Facebook",
  },
};

function applyAuthMethod(prefix, method) {
  const meta = AUTH_METHOD_META[method] || AUTH_METHOD_META.hoyoverse;
  const hidden = document.getElementById(`${prefix}-auth-method`);
  const hint = document.getElementById(`${prefix}-auth-method-hint`);
  const panel = document.getElementById(`${prefix}-auth-fields`);
  const loginLabel = document.getElementById(`${prefix}-login-id-label`);
  const passLabel = document.getElementById(`${prefix}-pass-label`);
  const loginInput = document.getElementById(`${prefix}-game-login-id`);
  const passInput = document.getElementById(`${prefix}-game-pass`);

  if (hidden) hidden.value = method;
  if (hint) hint.textContent = meta.hint;
  if (loginLabel) loginLabel.textContent = meta.loginLabel;
  if (passLabel) passLabel.textContent = meta.passLabel;
  if (loginInput) loginInput.placeholder = meta.loginPlaceholder;
  if (passInput) passInput.placeholder = meta.passPlaceholder;

  if (panel) {
    panel.classList.remove("is-active");
    // force reflow for animation restart
    void panel.offsetWidth;
    panel.classList.add("is-active");
  }

  document.querySelectorAll(`.auth-method-tabs[data-auth-prefix="${prefix}"] .auth-method-btn`).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.authMethod === method);
  });
}

function bindAuthMethodTabs() {
  document.querySelectorAll(".auth-method-tabs").forEach((tabs) => {
    const prefix = tabs.dataset.authPrefix;
    tabs.querySelectorAll(".auth-method-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyAuthMethod(prefix, btn.dataset.authMethod || "hoyoverse");
      });
    });
  });
}

// ---------- PromptPay Dynamic QR ----------
let promptPayId = null;
let promptPayReady = false;
let farmQrGenerated = false;
let lastFarmQrAmount = null;

function farmQrEls() {
  return {
    btn: document.getElementById("btn-generate-farm-qr"),
    box: document.getElementById("farm-qr-box"),
    hint: document.getElementById("farm-qr-hint"),
    amountLine: document.getElementById("farm-qr-amount-line"),
  };
}

async function loadPromptPayConfig() {
  try {
    const cfg = await DozoAPI.getConfig();
    promptPayId = (cfg.promptPayId || "").trim() || null;
    promptPayReady = Boolean(promptPayId);

    if (!promptPayReady) {
      console.warn("[promptpay] PROMPTPAY_ID ยังไม่ถูกตั้งค่าใน Vercel");
      document.querySelectorAll('.qr-box[data-qr="static"]').forEach((box) => {
        box.innerHTML =
          `<p class="qr-note warn">ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน Vercel</p>`;
      });
      updateGenerateQrButton();
      return;
    }

    // บริการอื่น: QR พร้อมเพย์แบบไม่ล็อกยอด
    document.querySelectorAll('.qr-box[data-qr="static"]').forEach((box) => {
      if (!window.DozoPromptPay) return;
      try {
        const payload = window.DozoPromptPay.generatePayload(promptPayId, {});
        window.DozoPromptPay.renderQr(box, payload, null);
      } catch (err) {
        console.error(err);
      }
    });
    updateGenerateQrButton();
  } catch (err) {
    console.error("loadPromptPayConfig", err);
    updateGenerateQrButton();
  }
}

function updateGenerateQrButton() {
  const { btn, hint } = farmQrEls();
  if (!btn) return;

  const amount = getFarmTotalAmount();
  const hasPackage = amount != null && amount > 0;

  // เปิดปุ่มเมื่อเลือกแพ็กแล้ว — แม้ยังไม่มี PROMPTPAY_ID (จะแจ้งตอนกด)
  btn.disabled = !hasPackage;

  if (!hasPackage) {
    btn.textContent = "สร้าง QR ตามยอดชำระ";
    if (hint) hint.textContent = "เลือกแพ็กเกจก่อน แล้วกดปุ่มเพื่อสร้าง QR";
    return;
  }

  if (!promptPayReady) {
    btn.textContent = `สร้าง QR ${amount.toLocaleString()} ฿`;
    if (hint) hint.textContent = "กดได้ แต่ต้องตั้ง PROMPTPAY_ID ใน Vercel ก่อน";
    return;
  }

  if (farmQrGenerated && lastFarmQrAmount === amount) {
    btn.textContent = `สร้าง QR ใหม่ (${amount.toLocaleString()} ฿)`;
    if (hint) hint.textContent = `QR ปัจจุบัน: ${amount.toLocaleString()} ฿ — กดอีกครั้งได้`;
  } else {
    btn.textContent = `สร้าง QR ${amount.toLocaleString()} ฿`;
    if (hint) hint.textContent = `พร้อมสร้าง QR ยอด ${amount.toLocaleString()} ฿`;
  }
}

function resetFarmQr() {
  farmQrGenerated = false;
  lastFarmQrAmount = null;
  const { box, amountLine } = farmQrEls();
  if (box) {
    box.classList.add("qr-box-pending");
    box.innerHTML = `<p class="qr-note">ยังไม่ได้สร้าง QR</p>`;
  }
  if (amountLine) amountLine.textContent = "";
}

function generateFarmQr() {
  const { box, amountLine } = farmQrEls();
  const amount = getFarmTotalAmount();

  if (amount == null || amount <= 0) {
    alert("กรุณาเลือกแพ็กเกจก่อน");
    return;
  }
  if (!promptPayReady || !promptPayId) {
    alert("ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน Vercel\nไปที่ Settings → Environment Variables แล้วใส่เบอร์พร้อมเพย์");
    return;
  }
  if (!window.DozoPromptPay) {
    alert("โหลดระบบ QR ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
    return;
  }
  if (!box) return;

  try {
    const payload = window.DozoPromptPay.generatePayload(promptPayId, { amount });
    box.classList.remove("qr-box-pending");
    window.DozoPromptPay.renderQr(box, payload, amount);
    farmQrGenerated = true;
    lastFarmQrAmount = amount;
    if (amountLine) amountLine.textContent = `ยอดใน QR: ${amount.toLocaleString()} ฿`;
    updateGenerateQrButton();
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="qr-note warn">สร้าง QR ไม่สำเร็จ</p>`;
    alert(err?.message || "สร้าง QR ไม่สำเร็จ");
  }
}

// ผูกคลิกแบบ delegation — ไม่พังถ้า DOM ยังไม่พร้อมตอนโหลดสคริปต์
document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("#btn-generate-farm-qr");
  if (!btn) return;
  e.preventDefault();
  generateFarmQr();
});

// ---------- Slip Upload ----------
function handleSlipFile(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
    selectedFarmSlipFile = null;
    hasSlip = false;
    slipPreview.classList.add("hidden");
    uploadPlaceholder.style.display = "block";
    updateSubmitState();
    return;
  }

  selectedFarmSlipFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    slipPreview.src = e.target.result;
    slipPreview.classList.remove("hidden");
    uploadPlaceholder.style.display = "none";
    hasSlip = true;
    slipError.classList.remove("show");
    updateSubmitState();
  };
  reader.readAsDataURL(file);
}

slipUpload?.addEventListener("change", (e) => {
  handleSlipFile(e.target.files[0]);
});

uploadArea?.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea?.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
uploadArea?.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleSlipFile(file);
});

bindImageUpload({
  inputId: "farm-map-upload",
  areaId: "farm-map-area",
  placeholderId: "farm-map-placeholder",
  previewId: "farm-map-preview",
  errorId: "farm-map-error",
  onChange: (ok, file) => { selectedFarmMapFile = file || null; hasFarmMap = ok; updateSubmitState(); }
});

function updateSubmitState() {
  const canSubmit = !!selectedPackage && hasFarmMap && hasSlip;
  btnSubmitOrder.disabled = !canSubmit;
}

// ---------- Submit Order ----------
function readGameAccount(prefix) {
  const name = document.getElementById(`${prefix}-game-name`)?.value.trim() || "";
  const uid = document.getElementById(`${prefix}-game-uid`)?.value.trim() || "";
  const server = document.getElementById(`${prefix}-game-server`)?.value.trim() || "";
  const loginId = document.getElementById(`${prefix}-game-login-id`)?.value.trim() || "";
  const pass = document.getElementById(`${prefix}-game-pass`)?.value.trim() || "";
  const arRaw = document.getElementById(`${prefix}-game-ar`)?.value;
  const ar = arRaw != null && String(arRaw).trim() !== "" ? Number(arRaw) : null;
  return { name, uid, server, loginId, pass, ar };
}

function validateGameAccount(account) {
  if (!account.name) return "กรุณากรอกชื่อในเกม";
  if (!account.uid) return "กรุณากรอก UID";
  if (!account.server) return "กรุณาเลือกเซิร์ฟเวอร์";
  if (!account.loginId) return "กรุณากรอก ID ล็อกอิน";
  if (!account.pass) return "กรุณากรอก Pass";
  if (account.ar == null || !Number.isFinite(account.ar) || account.ar < 1) return "กรุณากรอก AR ให้ถูกต้อง";
  return null;
}

farmForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedPackage) { alert("กรุณาเลือกจำนวนเจม"); return; }
  if (!hasFarmMap || !selectedFarmMapFile) { document.getElementById("farm-map-error")?.classList.add("show"); return; }
  if (!hasSlip || !selectedFarmSlipFile) { slipError.classList.add("show"); return; }

  const account = readGameAccount("farm");
  const accountError = validateGameAccount(account);
  if (accountError) { alert(accountError); return; }
  const facebookName = document.getElementById("farm-facebook-name")?.value.trim() || "";
  if (!facebookName || facebookName.length < 2) { alert("กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน"); return; }

  const noDailyGems = !!document.getElementById("farm-no-daily-gems")?.checked;
  const noAbyssTheaterGems = !!document.getElementById("farm-no-abyss-theater-gems")?.checked;
  const combat = document.querySelector('input[name="farm-combat"]:checked')?.value || "can";
  const authMethod = document.getElementById("farm-auth-method")?.value || "hoyoverse";

  const details = {
    gems: selectedPackage.gems,
    rush: rushCheck.checked,
    noDailyGems,
    noAbyssTheaterGems,
    combat,
    authMethod,
    prohibitions: document.getElementById("prohibitions").value.trim(),
    stream: document.querySelector('input[name="stream"]:checked')?.value || "no",
    gameName: account.name,
    server: account.server,
    loginId: account.loginId,
    gamePass: account.pass,
    ar: account.ar,
  };

  btnSubmitOrder.disabled = true;
  try {
    const saved = await saveOrder({
      service: "farm-gem",
      gameUsername: account.name,
      gameUid: account.uid,
      facebookName,
      details
    }, {
      slipFile: selectedFarmSlipFile,
      attachmentFile: selectedFarmMapFile,
      attachmentPurpose: "map_screenshot"
    });

    goToQueueAfterOrder({
      orderNumber: saved.order.orderNumber,
      extraLines: `จำนวน: ${details.gems.toLocaleString()} เจม\nยอดชำระ: ${saved.order.totalPrice} ฿`,
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateSubmitState();
  }
});

// ---------- หาวัสดุ ----------
function renderMaterialTypes() {
  if (!matTypeGrid) return;
  matTypeGrid.innerHTML = "";
  selectedMaterialType = null;
  MATERIAL_TYPES.forEach(opt => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "package-item option-btn";
    el.innerHTML = `<span class="opt-title">${opt.label}</span><span class="opt-sub">${opt.sub}</span>`;
    el.addEventListener("click", () => {
      selectedMaterialType = opt;
      matTypeGrid.querySelectorAll(".package-item").forEach(c => c.classList.remove("selected"));
      el.classList.add("selected");
      updateMaterialSubmitState();
    });
    matTypeGrid.appendChild(el);
  });
  updateMaterialSubmitState();
}

function bindImageUpload({ inputId, areaId, placeholderId, previewId, errorId, onChange }) {
  const input = document.getElementById(inputId);
  const area = document.getElementById(areaId);
  const placeholder = document.getElementById(placeholderId);
  const preview = document.getElementById(previewId);
  const error = document.getElementById(errorId);
  if (!input || !area) return;

  function handle(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      onChange(false, null);
      preview?.classList.add("hidden");
      if (placeholder) placeholder.style.display = "block";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (preview) {
        preview.src = e.target.result;
        preview.classList.remove("hidden");
      }
      if (placeholder) placeholder.style.display = "none";
      onChange(true, file);
      error?.classList.remove("show");
    };
    reader.readAsDataURL(file);
  }

  input.addEventListener("change", (e) => handle(e.target.files[0]));
  area.addEventListener("dragover", (e) => { e.preventDefault(); area.classList.add("dragover"); });
  area.addEventListener("dragleave", () => area.classList.remove("dragover"));
  area.addEventListener("drop", (e) => {
    e.preventDefault();
    area.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]);
  });
}

bindImageUpload({
  inputId: "mat-shot-upload",
  areaId: "mat-shot-area",
  placeholderId: "mat-shot-placeholder",
  previewId: "mat-shot-preview",
  errorId: "mat-shot-error",
  onChange: (ok, file) => { selectedMatScreenshotFile = file || null; hasMatShot = ok; updateMaterialSubmitState(); }
});

bindImageUpload({
  inputId: "mat-slip-upload",
  areaId: "mat-slip-area",
  placeholderId: "mat-slip-placeholder",
  previewId: "mat-slip-preview",
  errorId: "mat-slip-error",
  onChange: (ok, file) => { selectedMatSlipFile = file || null; hasMatSlip = ok; updateMaterialSubmitState(); }
});

function updateMaterialSubmitState() {
  if (!btnSubmitMaterial) return;
  const noteOk = !!(document.getElementById("mat-note")?.value.trim());
  btnSubmitMaterial.disabled = !(selectedMaterialType && noteOk && hasMatShot && hasMatSlip);
}

document.getElementById("mat-note")?.addEventListener("input", updateMaterialSubmitState);

materialForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedMaterialType) { alert("กรุณาเลือกประเภทวัสดุ"); return; }
  const note = document.getElementById("mat-note")?.value.trim() || "";
  if (!note) { alert("กรุณาระบุรายละเอียดวัสดุที่ต้องการ"); return; }
  if (!hasMatShot || !selectedMatScreenshotFile) { document.getElementById("mat-shot-error")?.classList.add("show"); return; }
  if (!hasMatSlip || !selectedMatSlipFile) { document.getElementById("mat-slip-error")?.classList.add("show"); return; }

  const userVal = document.getElementById("mat-user")?.value.trim();
  const uidVal = document.getElementById("mat-id")?.value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    materialType: selectedMaterialType.label,
    forCharacter: document.getElementById("mat-for-character")?.value.trim() || "",
    note,
    prohibitions: document.getElementById("mat-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="mat-stream"]:checked')?.value || "no"
  };

  btnSubmitMaterial.disabled = true;
  try {
    const savedMat = await saveOrder({
      service: "material",
      gameUsername: userVal,
      gameUid: uidVal,
      details
    }, { slipFile: selectedMatSlipFile, attachmentFile: selectedMatScreenshotFile });
    goToQueueAfterOrder({
      orderNumber: savedMat.order.orderNumber,
      extraLines: `ประเภท: ${details.materialType}` + (details.forCharacter ? `\nใช้กับ: ${details.forCharacter}` : ""),
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateMaterialSubmitState();
  }
});

// ---------- ปั้นตัวละคร ----------
function renderBuildCharacters(filter = "") {
  if (!buildCharGrid) return;
  buildCharGrid.innerHTML = "";
  const q = filter.trim().toLowerCase();
  const list = q
    ? CHARACTERS.filter(c => c.toLowerCase().includes(q))
    : CHARACTERS;

  if (!list.length) {
    buildCharGrid.innerHTML = `<p class="hint" style="padding:0.8rem;grid-column:1/-1">ไม่พบตัวละคร</p>`;
    return;
  }

  list.forEach(name => {
    const el = document.createElement("div");
    el.className = "char-item" + (selectedBuildCharacter === name ? " selected" : "");
    el.textContent = name;
    el.addEventListener("click", () => {
      selectedBuildCharacter = name;
      buildCharGrid.querySelectorAll(".char-item").forEach(c => c.classList.remove("selected"));
      el.classList.add("selected");
      if (buildCharSelectedHint) buildCharSelectedHint.textContent = "เลือกแล้ว: " + name;
      updateBuildSubmitState();
    });
    buildCharGrid.appendChild(el);
  });
}

function renderBuildGoals() {
  if (!buildGoalGrid) return;
  buildGoalGrid.innerHTML = "";
  selectedBuildGoal = null;
  BUILD_GOALS.forEach(opt => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "package-item option-btn";
    el.innerHTML = `<span class="opt-title">${opt.label}</span><span class="opt-sub">${opt.sub}</span>`;
    el.addEventListener("click", () => {
      selectedBuildGoal = opt;
      buildGoalGrid.querySelectorAll(".package-item").forEach(c => c.classList.remove("selected"));
      el.classList.add("selected");
      updateBuildSubmitState();
    });
    buildGoalGrid.appendChild(el);
  });
  updateBuildSubmitState();
}

buildCharSearch?.addEventListener("input", () => {
  renderBuildCharacters(buildCharSearch.value);
});

bindImageUpload({
  inputId: "build-shot-upload",
  areaId: "build-shot-area",
  placeholderId: "build-shot-placeholder",
  previewId: "build-shot-preview",
  errorId: null,
  onChange: (ok, file) => { selectedBuildScreenshotFile = file || null; hasBuildShot = ok; }
});

bindImageUpload({
  inputId: "build-slip-upload",
  areaId: "build-slip-area",
  placeholderId: "build-slip-placeholder",
  previewId: "build-slip-preview",
  errorId: "build-slip-error",
  onChange: (ok, file) => { selectedBuildSlipFile = file || null; hasBuildSlip = ok; updateBuildSubmitState(); }
});

function updateBuildSubmitState() {
  if (!btnSubmitBuild) return;
  btnSubmitBuild.disabled = !(selectedBuildCharacter && selectedBuildGoal && hasBuildSlip);
}

buildForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedBuildCharacter) { alert("กรุณาเลือกตัวละคร"); return; }
  if (!selectedBuildGoal) { alert("กรุณาเลือกเป้าหมายการปั้น"); return; }
  if (!hasBuildSlip || !selectedBuildSlipFile) { document.getElementById("build-slip-error")?.classList.add("show"); return; }

  const userVal = document.getElementById("build-user")?.value.trim();
  const uidVal = document.getElementById("build-id")?.value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    character: selectedBuildCharacter,
    goal: selectedBuildGoal.label,
    levelFrom: document.getElementById("build-level-from")?.value.trim() || "",
    levelTo: document.getElementById("build-level-to")?.value.trim() || "",
    talent: document.getElementById("build-talent")?.value.trim() || "",
    note: document.getElementById("build-note")?.value.trim() || "",
    prohibitions: document.getElementById("build-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="build-stream"]:checked')?.value || "no"
  };

  btnSubmitBuild.disabled = true;
  try {
    const saved = await saveOrder({
      service: "build-char",
      gameUsername: userVal,
      gameUid: uidVal,
      details
    }, {
      slipFile: selectedBuildSlipFile,
      attachmentFile: selectedBuildScreenshotFile || null
    });
    goToQueueAfterOrder({
      orderNumber: saved.order.orderNumber,
      extraLines: `ตัวละคร: ${details.character}\nเป้าหมาย: ${details.goal}`,
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateBuildSubmitState();
  }
});

// ---------- Abyss options ----------
function renderOptionGrid(grid, options, selectedRef, onSelect) {
  if (!grid) return;
  grid.innerHTML = "";
  options.forEach(opt => {
    const el = document.createElement("div");
    el.className = "package-item" + (selectedRef && selectedRef.id === opt.id ? " selected" : "");
    el.innerHTML = `<span class="gems">${opt.label}</span><span class="price">${opt.sub}</span>`;
    el.addEventListener("click", () => {
      grid.querySelectorAll(".package-item").forEach(p => p.classList.remove("selected"));
      el.classList.add("selected");
      onSelect(opt);
    });
    grid.appendChild(el);
  });
}

let abyssQrGenerated = false;
let lastAbyssQrAmount = null;

function getAbyssTotalAmount() {
  if (!selectedAbyss || selectedAbyss.price == null) return null;
  return Number(selectedAbyss.price) || null;
}

function updateAbyssTotalDisplay() {
  const el = document.getElementById("abyss-total-price");
  const price = getAbyssTotalAmount();
  if (el) el.textContent = price != null ? price.toLocaleString() + " ฿" : "0 ฿";
}

function resetAbyssQr() {
  abyssQrGenerated = false;
  lastAbyssQrAmount = null;
  const box = document.getElementById("abyss-qr-box");
  const amountLine = document.getElementById("abyss-qr-amount-line");
  if (box) {
    box.classList.add("qr-box-pending");
    box.innerHTML = `<p class="qr-note">ยังไม่ได้สร้าง QR</p>`;
  }
  if (amountLine) amountLine.textContent = "";
}

function updateAbyssQrButton() {
  const btn = document.getElementById("btn-generate-abyss-qr");
  const hint = document.getElementById("abyss-qr-hint");
  if (!btn) return;
  const amount = getAbyssTotalAmount();
  const hasPackage = amount != null && amount > 0;
  btn.disabled = !hasPackage;
  if (!hasPackage) {
    btn.textContent = "สร้าง QR ตามยอดชำระ";
    if (hint) hint.textContent = "เลือกแพ็กเกจก่อน แล้วกดปุ่มเพื่อสร้าง QR";
    return;
  }
  btn.textContent = abyssQrGenerated && lastAbyssQrAmount === amount
    ? `สร้าง QR ใหม่ (${amount.toLocaleString()} ฿)`
    : `สร้าง QR ${amount.toLocaleString()} ฿`;
  if (hint) {
    hint.textContent = abyssQrGenerated && lastAbyssQrAmount === amount
      ? `QR ปัจจุบัน: ${amount.toLocaleString()} ฿ — กดอีกครั้งได้`
      : `พร้อมสร้าง QR ยอด ${amount.toLocaleString()} ฿`;
  }
}

function generateAbyssQr() {
  const amount = getAbyssTotalAmount();
  const box = document.getElementById("abyss-qr-box");
  const amountLine = document.getElementById("abyss-qr-amount-line");
  if (amount == null || amount <= 0) {
    alert("กรุณาเลือกแพ็กเกจก่อน");
    return;
  }
  if (!promptPayReady || !promptPayId || !window.DozoPromptPay) {
    alert("ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน Vercel");
    return;
  }
  if (!box) return;
  try {
    const payload = window.DozoPromptPay.generatePayload(promptPayId, { amount });
    box.classList.remove("qr-box-pending");
    window.DozoPromptPay.renderQr(box, payload, amount);
    abyssQrGenerated = true;
    lastAbyssQrAmount = amount;
    if (amountLine) amountLine.textContent = `ยอดใน QR: ${amount.toLocaleString()} ฿`;
    updateAbyssQrButton();
  } catch (err) {
    console.error(err);
    alert(err?.message || "สร้าง QR ไม่สำเร็จ");
  }
}

function getExploreTotalAmount() {
  if (!selectedExplore || selectedExplorePercent == null || selectedExploreAreaCount == null) return null;
  return selectedExploreAreaCount * selectedExplorePercent * EXPLORE_RATE_PER_PERCENT;
}

function updateExploreCalcBox() {
  const regionEl = document.getElementById("explore-calc-region");
  const areasEl = document.getElementById("explore-calc-areas");
  const percentEl = document.getElementById("explore-calc-percent");
  const formulaEl = document.getElementById("explore-calc-formula");
  const regionHint = document.getElementById("explore-region-hint");
  if (regionEl) regionEl.textContent = selectedExplore ? selectedExplore.label : "-";
  if (areasEl) {
    areasEl.textContent = selectedExploreAreaCount != null
      ? `${selectedExploreAreaCount} / ${selectedExplore?.areas || "-"}`
      : "-";
  }
  if (percentEl) percentEl.textContent = selectedExplorePercent != null ? `${selectedExplorePercent}%` : "-";
  if (formulaEl) {
    if (selectedExploreAreaCount != null && selectedExplorePercent != null) {
      const total = getExploreTotalAmount();
      formulaEl.textContent = `${selectedExploreAreaCount} × ${selectedExplorePercent} × 2 = ${total?.toLocaleString() || 0} ฿`;
    } else {
      formulaEl.textContent = "จำนวนพื้นที่ × % × 2 ฿";
    }
  }
  if (regionHint) {
    regionHint.textContent = selectedExplore
      ? `${selectedExplore.label} มีทั้งหมด ${selectedExplore.areas} พื้นที่`
      : "กดเลือกเมืองเพื่อดูจำนวนพื้นที่ที่มี";
  }
}

function updateExploreTotalDisplay() {
  const el = document.getElementById("explore-total-price");
  const price = getExploreTotalAmount();
  if (el) el.textContent = price != null ? price.toLocaleString() + " ฿" : "0 ฿";
  updateExploreCalcBox();
}

function renderExploreAreaCountButtons() {
  const grid = document.getElementById("explore-area-count-grid");
  const hint = document.getElementById("explore-area-hint");
  if (!grid) return;
  grid.innerHTML = "";
  selectedExploreAreaCount = null;
  if (!selectedExplore) {
    if (hint) hint.textContent = "เลือกเมืองก่อน ระบบจะแสดงจำนวนพื้นที่ของเมืองนั้น";
    return;
  }
  const max = selectedExplore.areas;
  if (hint) hint.textContent = `${selectedExplore.label} มี ${max} พื้นที่ — เลือกจำนวนที่ต้องการสำรวจ`;
  for (let n = 1; n <= max; n++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "area-count-item";
    btn.dataset.count = String(n);
    btn.innerHTML = `<span class="area-count-num">${n}</span><span class="area-count-label">พื้นที่</span>`;
    btn.addEventListener("click", () => {
      grid.querySelectorAll(".area-count-item").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedExploreAreaCount = n;
      const price = getExploreTotalAmount();
      if (price !== lastExploreQrAmount) resetExploreQr();
      updateExploreTotalDisplay();
      updateExploreQrButton();
      updateExploreSubmitState();
    });
    grid.appendChild(btn);
  }
}

function resetExploreQr() {
  exploreQrGenerated = false;
  lastExploreQrAmount = null;
  const box = document.getElementById("explore-qr-box");
  const amountLine = document.getElementById("explore-qr-amount-line");
  if (box) {
    box.classList.add("qr-box-pending");
    box.innerHTML = `<p class="qr-note">ยังไม่ได้สร้าง QR</p>`;
  }
  if (amountLine) amountLine.textContent = "";
}

function updateExploreQrButton() {
  const btn = document.getElementById("btn-generate-explore-qr");
  const hint = document.getElementById("explore-qr-hint");
  if (!btn) return;
  const amount = getExploreTotalAmount();
  const ready = amount != null && amount > 0;
  btn.disabled = !ready;
  if (!ready) {
    btn.textContent = "สร้าง QR ตามยอดชำระ";
    if (hint) hint.textContent = "เลือกเมือง จำนวนพื้นที่ และเปอร์เซ็นต์ก่อน";
    return;
  }
  btn.textContent = exploreQrGenerated && lastExploreQrAmount === amount
    ? `สร้าง QR ใหม่ (${amount.toLocaleString()} ฿)`
    : `สร้าง QR ${amount.toLocaleString()} ฿`;
  if (hint) {
    hint.textContent = exploreQrGenerated && lastExploreQrAmount === amount
      ? `QR ปัจจุบัน: ${amount.toLocaleString()} ฿`
      : `พร้อมสร้าง QR ยอด ${amount.toLocaleString()} ฿`;
  }
}

function generateExploreQr() {
  const amount = getExploreTotalAmount();
  const box = document.getElementById("explore-qr-box");
  const amountLine = document.getElementById("explore-qr-amount-line");
  if (amount == null || amount <= 0) {
    alert("กรุณาเลือกเมือง จำนวนพื้นที่ และเปอร์เซ็นต์ก่อน");
    return;
  }
  if (!promptPayReady || !promptPayId || !window.DozoPromptPay) {
    alert("ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน Vercel");
    return;
  }
  if (!box) return;
  try {
    const payload = window.DozoPromptPay.generatePayload(promptPayId, { amount });
    box.classList.remove("qr-box-pending");
    window.DozoPromptPay.renderQr(box, payload, amount);
    exploreQrGenerated = true;
    lastExploreQrAmount = amount;
    if (amountLine) amountLine.textContent = `ยอดใน QR: ${amount.toLocaleString()} ฿`;
    updateExploreQrButton();
  } catch (err) {
    console.error(err);
    alert(err?.message || "สร้าง QR ไม่สำเร็จ");
  }
}

function bindExplorePercentButtons() {
  document.querySelectorAll("#explore-percent-grid .percent-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#explore-percent-grid .percent-item").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedExplorePercent = Number(btn.dataset.percent);
      const price = getExploreTotalAmount();
      if (price !== lastExploreQrAmount) resetExploreQr();
      updateExploreTotalDisplay();
      updateExploreQrButton();
      updateExploreSubmitState();
    });
  });
}

function renderAbyssOptions() {
  selectedAbyss = null;
  hasAbyssSlip = false;
  selectedAbyssSlipFile = null;
  resetAbyssQr();
  updateAbyssTotalDisplay();
  updateAbyssQrButton();
  updateAbyssSubmitState();
  renderOptionGrid(abyssPackageGrid, ABYSS_OPTIONS, selectedAbyss, (opt) => {
    selectedAbyss = opt;
    const price = getAbyssTotalAmount();
    if (price !== lastAbyssQrAmount) resetAbyssQr();
    updateAbyssTotalDisplay();
    updateAbyssQrButton();
    updateAbyssSubmitState();
  });
}

function renderExploreOptions() {
  selectedExplore = null;
  selectedExplorePercent = null;
  selectedExploreAreaCount = null;
  hasExploreSlip = false;
  selectedExploreSlipFile = null;
  hasExploreMap = false;
  selectedExploreMapFile = null;
  const mapPreview = document.getElementById("explore-map-preview");
  const mapPlaceholder = document.getElementById("explore-map-placeholder");
  const mapInput = document.getElementById("explore-map-upload");
  if (mapPreview) {
    mapPreview.src = "";
    mapPreview.classList.add("hidden");
  }
  if (mapPlaceholder) mapPlaceholder.style.display = "block";
  if (mapInput) mapInput.value = "";
  document.getElementById("explore-map-error")?.classList.remove("show");
  document.querySelectorAll("#explore-percent-grid .percent-item").forEach((b) => b.classList.remove("selected"));
  renderExploreAreaCountButtons();
  resetExploreQr();
  updateExploreTotalDisplay();
  updateExploreQrButton();
  updateExploreSubmitState();
  renderOptionGrid(explorePackageGrid, EXPLORE_OPTIONS, selectedExplore, (opt) => {
    selectedExplore = opt;
    renderExploreAreaCountButtons();
    const price = getExploreTotalAmount();
    if (price !== lastExploreQrAmount) resetExploreQr();
    updateExploreTotalDisplay();
    updateExploreQrButton();
    updateExploreSubmitState();
  });
}

function updateAbyssSubmitState() {
  if (btnSubmitAbyss) btnSubmitAbyss.disabled = !(selectedAbyss && hasAbyssSlip);
}
function updateExploreSubmitState() {
  if (btnSubmitExplore) {
    btnSubmitExplore.disabled = !(selectedExplore && selectedExploreAreaCount && selectedExplorePercent && hasExploreMap && hasExploreSlip);
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest?.("#btn-generate-abyss-qr")) {
    e.preventDefault();
    generateAbyssQr();
  }
  if (e.target.closest?.("#btn-generate-explore-qr")) {
    e.preventDefault();
    generateExploreQr();
  }
});

bindImageUpload({
  inputId: "abyss-slip-upload",
  areaId: "abyss-slip-area",
  placeholderId: "abyss-slip-placeholder",
  previewId: "abyss-slip-preview",
  errorId: "abyss-slip-error",
  onChange: (ok, file) => { selectedAbyssSlipFile = file || null; hasAbyssSlip = ok; updateAbyssSubmitState(); }
});

bindImageUpload({
  inputId: "explore-slip-upload",
  areaId: "explore-slip-area",
  placeholderId: "explore-slip-placeholder",
  previewId: "explore-slip-preview",
  errorId: "explore-slip-error",
  onChange: (ok, file) => { selectedExploreSlipFile = file || null; hasExploreSlip = ok; updateExploreSubmitState(); }
});

bindImageUpload({
  inputId: "explore-map-upload",
  areaId: "explore-map-area",
  placeholderId: "explore-map-placeholder",
  previewId: "explore-map-preview",
  errorId: "explore-map-error",
  onChange: (ok, file) => { selectedExploreMapFile = file || null; hasExploreMap = ok; updateExploreSubmitState(); }
});

abyssForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedAbyss) { alert("กรุณาเลือกชั้น / เป้าหมาย"); return; }
  if (!hasAbyssSlip || !selectedAbyssSlipFile) { document.getElementById("abyss-slip-error")?.classList.add("show"); return; }
  const account = readGameAccount("abyss");
  const accountError = validateGameAccount(account);
  if (accountError) { alert(accountError); return; }
  const facebookName = document.getElementById("abyss-facebook-name")?.value.trim() || "";
  if (!facebookName || facebookName.length < 2) { alert("กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน"); return; }

  const details = {
    packageId: selectedAbyss.id,
    package: selectedAbyss.label,
    detail: document.getElementById("abyss-detail")?.value.trim() || "",
    prohibitions: document.getElementById("abyss-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="abyss-stream"]:checked')?.value || "no",
    authMethod: document.getElementById("abyss-auth-method")?.value || "hoyoverse",
    gameName: account.name,
    server: account.server,
    loginId: account.loginId,
    gamePass: account.pass,
    ar: account.ar,
  };
  btnSubmitAbyss.disabled = true;
  try {
    const saved = await saveOrder({
      service: "abyss",
      gameUsername: account.name,
      gameUid: account.uid,
      facebookName,
      details
    }, { slipFile: selectedAbyssSlipFile });
    goToQueueAfterOrder({
      orderNumber: saved.order.orderNumber,
      extraLines: `เป้าหมาย: ${details.package}\nยอด: ${saved.order.totalPrice ?? "-"} ฿`,
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateAbyssSubmitState();
  }
});

exploreForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedExplore) { alert("กรุณาเลือกเมือง"); return; }
  if (!selectedExploreAreaCount) { alert("กรุณาเลือกจำนวนพื้นที่"); return; }
  if (!selectedExplorePercent) { alert("กรุณาเลือกเปอร์เซ็นต์ที่จะสำรวจ"); return; }
  if (!hasExploreMap || !selectedExploreMapFile) { document.getElementById("explore-map-error")?.classList.add("show"); return; }
  if (!hasExploreSlip || !selectedExploreSlipFile) { document.getElementById("explore-slip-error")?.classList.add("show"); return; }
  const account = readGameAccount("explore");
  const accountError = validateGameAccount(account);
  if (accountError) { alert(accountError); return; }
  const facebookName = document.getElementById("explore-facebook-name")?.value.trim() || "";
  if (!facebookName || facebookName.length < 2) { alert("กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน"); return; }

  const details = {
    packageId: selectedExplore.id,
    package: selectedExplore.label,
    areaCount: selectedExploreAreaCount,
    areaMax: selectedExplore.areas,
    percent: selectedExplorePercent,
    detail: document.getElementById("explore-detail")?.value.trim() || "",
    prohibitions: document.getElementById("explore-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="explore-stream"]:checked')?.value || "no",
    authMethod: document.getElementById("explore-auth-method")?.value || "hoyoverse",
    gameName: account.name,
    server: account.server,
    loginId: account.loginId,
    gamePass: account.pass,
    ar: account.ar,
  };
  btnSubmitExplore.disabled = true;
  try {
    const saved = await saveOrder(
      { service: "explore", gameUsername: account.name, gameUid: account.uid, facebookName, details },
      { slipFile: selectedExploreSlipFile, attachmentFile: selectedExploreMapFile, attachmentPurpose: "map_screenshot" }
    );
    goToQueueAfterOrder({
      orderNumber: saved.order.orderNumber,
      extraLines: `เมือง: ${details.package}\nพื้นที่: ${details.areaCount}/${details.areaMax} · ${details.percent}%\nยอด: ${saved.order.totalPrice ?? "-"} ฿`,
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateExploreSubmitState();
  }
});

// ---------- Oculus / ลูกแก้ว ----------
const OCULUS_TYPES = [
  { id: "anemoculus", label: "Anemoculus", unit: 1, maxAll: 65 },
  { id: "geoculus", label: "Geoculus", unit: 1.5, maxAll: 195 },
  { id: "electroculus", label: "Electroculus", unit: 2.5, maxAll: 450 },
  { id: "dendroculus", label: "Dendroculus", unit: 2.5, maxAll: 650 },
  { id: "hydroculus", label: "Hydroculus", unit: 3, maxAll: 675 },
  { id: "pyroculus", label: "Pyroculus", unit: 3, maxAll: 745 },
  { id: "lunarculus", label: "Lunarculus", unit: 3, maxAll: 590 },
  { id: "cryoculus", label: "Cryoculus", unit: 2.5, maxAll: 280 },
  { id: "crimson-agate", label: "Crimson Agate", unit: 1.5, maxAll: 160 },
  { id: "lumenstone", label: "Lumenstone", unit: 1.5, maxAll: 150 },
  { id: "spirit-carp", label: "Spirit Carp", unit: 1.5, maxAll: 75 },
  { id: "sacred-seal", label: "Sacred Seal", unit: 1, maxAll: 55 },
  { id: "plume", label: "Plume of Purifying Light", unit: 2, maxAll: 75 },
  { id: "mnemonic-cluster", label: "Mnemonic Cluster", unit: 2, maxAll: 60 },
  { id: "utsava", label: "อุตริมณฑล (ต่อเลเวล)", unit: 35, maxAll: 160 },
];

const oculusForm = document.getElementById("oculus-form");
const btnSubmitOculus = document.getElementById("btn-submit-oculus");
let hasOculusSlip = false;
let selectedOculusSlipFile = null;
let oculusQrGenerated = false;
let lastOculusQrAmount = null;

function getSelectedOculusItems() {
  const items = [];
  for (const type of OCULUS_TYPES) {
    const checked = document.getElementById(`oculus-check-${type.id}`)?.checked;
    if (!checked) continue;
    const remaining = Number(document.getElementById(`oculus-qty-${type.id}`)?.value);
    if (!Number.isFinite(remaining) || remaining <= 0) continue;
    const qty = Math.min(9999, Math.floor(remaining));
    const lineTotal = Math.round(qty * type.unit * 100) / 100;
    items.push({
      id: type.id,
      label: type.label,
      remaining: qty,
      unitPrice: type.unit,
      lineTotal,
    });
  }
  return items;
}

function getOculusExtraFees() {
  let extra = 0;
  if (document.getElementById("oculus-no-compass")?.checked) extra += 20;
  if (document.getElementById("oculus-no-markers")?.checked) extra += 20;
  return extra;
}

function getOculusTotalAmount() {
  const items = getSelectedOculusItems();
  if (!items.length) return null;
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  return Math.round((subtotal + getOculusExtraFees()) * 100) / 100;
}

function updateOculusTotalDisplay() {
  const total = getOculusTotalAmount();
  const el = document.getElementById("oculus-total-price");
  const breakdown = document.getElementById("oculus-price-breakdown");
  if (el) el.textContent = total != null ? `${total.toLocaleString("th-TH")} ฿` : "0 ฿";
  if (breakdown) {
    const items = getSelectedOculusItems();
    if (!items.length) {
      breakdown.textContent = "ยังไม่ได้เลือกชนิด";
    } else {
      const parts = items.map((it) => `${it.label} ${it.remaining}×${it.unitPrice}=${it.lineTotal}`);
      const extra = getOculusExtraFees();
      if (extra) parts.push(`เงื่อนไขพิเศษ +${extra}`);
      breakdown.textContent = parts.join(" · ");
    }
  }
  if (total !== lastOculusQrAmount) {
    resetOculusQr();
  }
  updateOculusQrButton();
  updateOculusSubmitState();
}

function updateOculusSubmitState() {
  if (!btnSubmitOculus) return;
  const items = getSelectedOculusItems();
  btnSubmitOculus.disabled = !(items.length && hasOculusSlip);
}

function updateOculusQrButton() {
  const btn = document.getElementById("btn-generate-oculus-qr");
  const hint = document.getElementById("oculus-qr-hint");
  const amount = getOculusTotalAmount();
  if (btn) btn.disabled = !(amount > 0);
  if (hint) {
    hint.textContent = amount > 0
      ? (oculusQrGenerated && lastOculusQrAmount === amount ? "สร้าง QR แล้ว" : "กดสร้าง QR ตามยอด")
      : "เลือกชนิดและจำนวนก่อน";
  }
}

function resetOculusQr() {
  oculusQrGenerated = false;
  lastOculusQrAmount = null;
  const box = document.getElementById("oculus-qr-box");
  const amountLine = document.getElementById("oculus-qr-amount-line");
  if (box) {
    box.classList.add("qr-box-pending");
    box.innerHTML = `<p class="qr-note">ยังไม่ได้สร้าง QR</p>`;
  }
  if (amountLine) amountLine.textContent = "";
  updateOculusQrButton();
}

function generateOculusQr() {
  const amount = getOculusTotalAmount();
  const box = document.getElementById("oculus-qr-box");
  const amountLine = document.getElementById("oculus-qr-amount-line");
  if (!amount || !window.DozoPromptPay || !promptPayId) {
    alert("ยังไม่พร้อมสร้าง QR หรือยังไม่ได้เลือกจำนวน");
    return;
  }
  try {
    const payload = window.DozoPromptPay.generatePayload(promptPayId, { amount });
    box?.classList.remove("qr-box-pending");
    window.DozoPromptPay.renderQr(box, payload, amount);
    oculusQrGenerated = true;
    lastOculusQrAmount = amount;
    if (amountLine) amountLine.textContent = `ยอดใน QR: ${amount.toLocaleString("th-TH")} ฿`;
    updateOculusQrButton();
  } catch (err) {
    console.error(err);
    alert(err?.message || "สร้าง QR ไม่สำเร็จ");
  }
}

function renderOculusOptions() {
  const grid = document.getElementById("oculus-type-grid");
  if (!grid) return;
  hasOculusSlip = false;
  selectedOculusSlipFile = null;
  resetOculusQr();
  grid.innerHTML = OCULUS_TYPES.map((type) => `
    <label class="oculus-card">
      <div class="oculus-card-top">
        <input type="checkbox" id="oculus-check-${type.id}" data-oculus-id="${type.id}" />
        <div class="oculus-card-text">
          <strong>${type.label}</strong>
          <small>ชิ้นละ ${type.unit} ฿ · ครบชุดประมาณ ${type.maxAll} ฿</small>
        </div>
      </div>
      <div class="oculus-qty-row">
        <span>จำนวนที่เหลือ</span>
        <input type="number" id="oculus-qty-${type.id}" min="1" max="9999" step="1" placeholder="0" disabled />
      </div>
    </label>
  `).join("");

  grid.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.oculusId;
      const qty = document.getElementById(`oculus-qty-${id}`);
      if (qty) {
        qty.disabled = !cb.checked;
        if (!cb.checked) qty.value = "";
        else if (!qty.value) qty.focus();
      }
      updateOculusTotalDisplay();
    });
  });
  grid.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener("input", updateOculusTotalDisplay);
  });
  document.getElementById("oculus-no-compass")?.addEventListener("change", updateOculusTotalDisplay);
  document.getElementById("oculus-no-markers")?.addEventListener("change", updateOculusTotalDisplay);
  updateOculusTotalDisplay();
}

document.getElementById("btn-back-home-oculus")?.addEventListener("click", () => showView("home"));
document.addEventListener("click", (e) => {
  if (e.target.closest?.("#btn-generate-oculus-qr")) {
    e.preventDefault();
    generateOculusQr();
  }
});

bindImageUpload({
  inputId: "oculus-slip-upload",
  areaId: "oculus-slip-area",
  placeholderId: "oculus-slip-placeholder",
  previewId: "oculus-slip-preview",
  errorId: "oculus-slip-error",
  onChange: (ok, file) => {
    selectedOculusSlipFile = file || null;
    hasOculusSlip = ok;
    updateOculusSubmitState();
  }
});

oculusForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const items = getSelectedOculusItems();
  if (!items.length) {
    alert("กรุณาเลือกชนิด Oculus และใส่จำนวนที่เหลือ");
    return;
  }
  if (!hasOculusSlip || !selectedOculusSlipFile) {
    document.getElementById("oculus-slip-error")?.classList.add("show");
    return;
  }
  const account = readGameAccount("oculus");
  const accountError = validateGameAccount(account);
  if (accountError) { alert(accountError); return; }
  const facebookName = document.getElementById("oculus-facebook-name")?.value.trim() || "";
  if (!facebookName || facebookName.length < 2) {
    alert("กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน");
    return;
  }

  const details = {
    items,
    noCompass: !!document.getElementById("oculus-no-compass")?.checked,
    noMarkers: !!document.getElementById("oculus-no-markers")?.checked,
    note: document.getElementById("oculus-note")?.value.trim() || "",
    authMethod: document.getElementById("oculus-auth-method")?.value || "hoyoverse",
    gameName: account.name,
    server: account.server,
    loginId: account.loginId,
    gamePass: account.pass,
    ar: account.ar,
  };

  btnSubmitOculus.disabled = true;
  try {
    const saved = await saveOrder(
      { service: "oculus", gameUsername: account.name, gameUid: account.uid, facebookName, details },
      { slipFile: selectedOculusSlipFile }
    );
    goToQueueAfterOrder({
      orderNumber: saved.order.orderNumber,
      extraLines: `รายการ: ${items.map((it) => `${it.label}×${it.remaining}`).join(", ")}\nยอด: ${saved.order.totalPrice ?? "-"} ฿`,
    });
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateOculusSubmitState();
  }
});

// ---------- Admin / Staff panels ----------
const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  "build-char": "ปั้นตัวละคร",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่",
  oculus: "เก็บ Oculus"
};

const STATUS_LABEL = {
  pending: "รอดำเนินการ",
  doing: "กำลังทำ",
  done: "เสร็จแล้ว",
  cancel: "ยกเลิก"
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function statusSelectHtml(orderId, current, extraClass = "") {
  const st = current || "pending";
  return `<select class="btn-status ${extraClass}" data-order-id="${escapeHtml(orderId)}">
    <option value="pending" ${st === "pending" ? "selected" : ""}>รอดำเนินการ</option>
    <option value="doing" ${st === "doing" ? "selected" : ""}>กำลังทำ</option>
    <option value="done" ${st === "done" ? "selected" : ""}>เสร็จแล้ว</option>
    <option value="cancel" ${st === "cancel" ? "selected" : ""}>ยกเลิก</option>
  </select>`;
}

function staffAssignSelectHtml(order) {
  const current = order.assignedStaffId || "";
  const options = [
    `<option value="">— ยังไม่มอบหมาย —</option>`,
    ...staffListCache.map(s =>
      `<option value="${escapeHtml(s.id)}" ${s.id === current ? "selected" : ""}>${escapeHtml(s.displayName || s.email)}</option>`
    )
  ];
  return `<select class="assign-select" data-assign-order="${escapeHtml(order.id)}">${options.join("")}</select>`;
}

async function ensureStaffList() {
  if (!isAdmin) return staffListCache;
  try {
    const result = await DozoAPI.listTeam();
    staffListCache = Array.isArray(result.staff) ? result.staff : [];
  } catch {
    staffListCache = [];
  }
  return staffListCache;
}

function updateAdminSummary(orders) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };
  set("admin-stat-orders", orders.length);
  set("admin-stat-unassigned", orders.filter(o => !o.assignedStaffId).length);
  set("admin-stat-doing", orders.filter(o => o.status === "doing").length);
  set("admin-stat-staff", staffListCache.length);
}

async function renderAdminOrders() {
  const tbody = document.getElementById("orders-tbody");
  const countEl = document.getElementById("order-count");
  if (!tbody) return;

  await ensureStaffList();
  const orders = await loadOrders();
  adminOrdersCache = orders;
  updateAdminSummary(orders);

  const filter = document.getElementById("admin-order-filter")?.value || "all";
  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "unassigned") return !o.assignedStaffId;
    return (o.status || "pending") === filter;
  });

  if (countEl) countEl.textContent = filtered.length + " รายการ" + (filter !== "all" ? ` (จาก ${orders.length})` : "");

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">ยังไม่มีออเดอร์${filter !== "all" ? "ตามตัวกรองนี้" : ""}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const st = o.status || "pending";
    const files = orderFilesHtml(o);
    const assignedLabel = o.assignedStaffName
      ? `<div class="assign-current">${escapeHtml(o.assignedStaffName)}</div>`
      : `<div class="assign-current muted">ยังไม่มอบหมาย</div>`;
    return `<tr class="${o.assignedStaffId ? "" : "row-unassigned"}">
      <td>${escapeHtml(formatTime(o.createdAt))}</td>
      <td><span class="svc-chip">${escapeHtml(SERVICE_LABEL[o.service] || o.service)}</span></td>
      <td class="cell-detail">${escapeHtml(o.summary || "-")}<br><small>${files}</small></td>
      <td>
        <div>${escapeHtml(o.facebookName || o.customerDisplayName || o.customerEmail || "ไม่ระบุ")}</div>
        <small class="muted">UID: ${escapeHtml(o.uid || "-")}</small>
      </td>
      <td>
        ${assignedLabel}
        ${staffAssignSelectHtml(o)}
      </td>
      <td>
        <span class="status-badge status-${escapeHtml(st)}">${escapeHtml(STATUS_LABEL[st] || st)}</span>
        ${statusSelectHtml(o.id, st)}
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll("select[data-order-id]").forEach(sel => {
    sel.addEventListener("change", async () => {
      sel.disabled = true;
      try {
        await updateOrderStatus(sel.dataset.orderId, sel.value);
        await renderAdminOrders();
        await renderAdminCustomers();
      } catch (error) {
        alert(error.message || "อัปเดตสถานะไม่สำเร็จ");
        sel.disabled = false;
      }
    });
  });

  tbody.querySelectorAll("select[data-assign-order]").forEach(sel => {
    sel.addEventListener("change", async () => {
      sel.disabled = true;
      try {
        const value = sel.value || null;
        await DozoAPI.assignOrder(sel.dataset.assignOrder, value);
        await renderAdminOrders();
      } catch (error) {
        alert(error.message || "มอบหมายงานไม่สำเร็จ");
        sel.disabled = false;
      }
    });
  });
}

async function renderStaffJobs() {
  const list = document.getElementById("staff-job-list");
  if (!list) return;

  let orders = [];
  try {
    orders = await loadOrders();
  } catch (error) {
    list.innerHTML = `<div class="empty-state glass"><p>${escapeHtml(error.message || "โหลดงานไม่สำเร็จ")}</p></div>`;
    return;
  }

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };
  set("staff-stat-total", orders.length);
  set("staff-stat-doing", orders.filter(o => o.status === "doing").length);
  set("staff-stat-done", orders.filter(o => o.status === "done").length);
  set("staff-stat-pending", orders.filter(o => (o.status || "pending") === "pending").length);

  if (!orders.length) {
    list.innerHTML = `<div class="empty-state glass">
      <p>ยังไม่มีงานที่ถูกส่งมอบให้คุณ</p>
      <p class="muted">เมื่อแอดมินมอบหมายออเดอร์ให้คุณ รายการจะแสดงที่นี่ และคุณจะสามารถอัปเดตสถานะได้</p>
    </div>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const st = o.status || "pending";
    const files = orderFilesHtml(o);
    return `<article class="staff-job-card glass status-border-${escapeHtml(st)}">
      <div class="staff-job-head">
        <div>
          <h3>${escapeHtml(SERVICE_LABEL[o.service] || o.service)}
            <span class="order-number">#${escapeHtml(o.orderNumber)}</span>
          </h3>
          <p class="staff-job-summary">${escapeHtml(o.summary || "-")}</p>
        </div>
        <span class="status-badge status-${escapeHtml(st)}">${escapeHtml(STATUS_LABEL[st] || st)}</span>
      </div>
      <div class="staff-job-meta">
        <span>ลูกค้า: ${escapeHtml(o.facebookName || o.customerDisplayName || o.customerEmail || "ไม่ระบุ")}</span>
        <span>UID: ${escapeHtml(o.uid || "-")}</span>
        <span>Username: ${escapeHtml(o.gameUsername || "-")}</span>
        <span>${escapeHtml(formatTime(o.createdAt))}</span>
      </div>
      ${files ? `<div class="history-files">${files}</div>` : ""}
      <div class="staff-job-actions">
        <label>อัปเดตสถานะ</label>
        ${statusSelectHtml(o.id, st, "staff-status")}
      </div>
    </article>`;
  }).join("");

  list.querySelectorAll("select[data-order-id]").forEach(sel => {
    sel.addEventListener("change", async () => {
      sel.disabled = true;
      try {
        await updateOrderStatus(sel.dataset.orderId, sel.value);
        await renderStaffJobs();
      } catch (error) {
        alert(error.message || "อัปเดตสถานะไม่สำเร็จ");
        sel.disabled = false;
      }
    });
  });
}

async function renderCustomerHistory() {
  const tbody = document.getElementById("queue-tbody");
  const countEl = document.getElementById("queue-count");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">กำลังโหลดคิว...</td></tr>`;
  try {
    const orders = await DozoAPI.listPublicQueue();
    if (countEl) countEl.textContent = String(orders.length);
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">ยังไม่มีออเดอร์ในคิว</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map((o, idx) => {
      const st = o.status || "pending";
      const price =
        o.totalPrice != null && o.totalPrice !== ""
          ? `${Number(o.totalPrice).toLocaleString("th-TH")} ฿`
          : "-";
      return `<tr class="queue-row status-row-${escapeHtml(st)}">
        <td class="queue-time">${escapeHtml(formatTime(o.createdAt))}</td>
        <td><span class="queue-id">#${escapeHtml(o.orderNumber)}</span></td>
        <td><span class="svc-chip">${escapeHtml(SERVICE_LABEL[o.service] || o.service)}</span></td>
        <td class="queue-summary">${escapeHtml(o.summary || "-")}</td>
        <td class="queue-fb">${escapeHtml(o.facebookName || "-")}</td>
        <td class="queue-price">${escapeHtml(price)}</td>
        <td><span class="status-badge status-${escapeHtml(st)}">${escapeHtml(STATUS_LABEL[st] || st)}</span></td>
      </tr>`;
    }).join("");
  } catch (error) {
    if (countEl) countEl.textContent = "-";
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">${escapeHtml(error.message || "โหลดคิวไม่สำเร็จ")}</td></tr>`;
  }
}

async function renderAdminCustomers() {
  const tbody = document.getElementById("customers-tbody");
  const countEl = document.getElementById("customer-count");
  if (!tbody) return;
  const orders = await loadOrders();
  const map = {};
  orders.forEach(o => {
    const key = o.customerEmail || o.uid || "unknown";
    if (!map[key]) {
      map[key] = { key, count: 0, last: o.createdAt };
    }
    map[key].count += 1;
    if (o.createdAt > map[key].last) map[key].last = o.createdAt;
  });
  const list = Object.values(map).sort((a, b) => (String(b.last || "")).localeCompare(String(a.last || "")));
  if (countEl) countEl.textContent = list.length + " คน";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-cell">ยังไม่มีข้อมูลลูกค้า</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td>${escapeHtml(c.key)}</td>
      <td>${c.count}</td>
      <td>${formatTime(c.last)}</td>
    </tr>
  `).join("");
}

async function renderAdminTeam() {
  const grid = document.getElementById("team-grid");
  const countEl = document.getElementById("team-count");
  const memberSelect = document.getElementById("team-user-select");
  const addButton = document.getElementById("team-add-submit");
  if (!grid) return;

  grid.innerHTML = `<div class="empty-state glass"><p>กำลังโหลดรายชื่อลูกทีม...</p></div>`;
  try {
    const result = await DozoAPI.listTeam();
    const members = Array.isArray(result.staff) ? result.staff : [];
    const candidates = Array.isArray(result.candidates) ? result.candidates : [];
    staffListCache = members;

    const adminStaffStat = document.getElementById("admin-stat-staff");
    if (adminStaffStat) adminStaffStat.textContent = String(members.length);
    if (countEl) countEl.textContent = `${members.length} คน`;

    if (memberSelect) {
      const previousValue = memberSelect.value;
      memberSelect.innerHTML = candidates.length
        ? `<option value="">เลือกสมาชิกที่สมัครแล้ว</option>` + candidates.map(candidate =>
            `<option value="${escapeHtml(candidate.id)}">${escapeHtml(candidate.displayName)} — ${escapeHtml(candidate.email)}</option>`
          ).join("")
        : `<option value="">ไม่มีบัญชีลูกค้าที่สามารถเพิ่มเป็นลูกทีม</option>`;
      if (previousValue && candidates.some(candidate => candidate.id === previousValue)) {
        memberSelect.value = previousValue;
      }
    }
    if (addButton) addButton.disabled = candidates.length === 0;

    if (!members.length) {
      grid.innerHTML = `<div class="empty-state glass"><p>ยังไม่มีลูกทีมในระบบ</p><p>เลือกสมาชิกที่สมัครไว้แล้วจากด้านบน แล้วเพิ่ม role เป็น staff ได้เลย</p></div>`;
      return;
    }

    grid.innerHTML = members.map(member => `
      <article class="team-card glass">
        <div class="team-name">${escapeHtml(member.displayName || "สมาชิก")}</div>
        <div class="team-role">${escapeHtml(member.staffTitle || "ทีมงาน")}</div>
        <div class="team-meta">${escapeHtml(member.staffDescription || "ไม่มีรายละเอียดเพิ่มเติม")}</div>
        <div class="team-email">${escapeHtml(member.email || "")}</div>
        <button type="button" class="btn-team-remove" data-remove-staff="${escapeHtml(member.id)}">นำออกจากทีม</button>
      </article>
    `).join("");

    grid.querySelectorAll("[data-remove-staff]").forEach(button => {
      button.addEventListener("click", async () => {
        const memberId = button.dataset.removeStaff;
        const member = members.find(item => item.id === memberId);
        if (!member || !confirm(`ต้องการนำ ${member.displayName} ออกจากทีมใช่หรือไม่?`)) return;
        button.disabled = true;
        try {
          await DozoAPI.updateTeamMember({ userId: memberId, role: "customer" });
          await renderAdminTeam();
        } catch (error) {
          alert(error.message || "นำสมาชิกออกจากทีมไม่สำเร็จ");
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    if (countEl) countEl.textContent = "โหลดไม่สำเร็จ";
    grid.innerHTML = `<div class="empty-state glass"><p>${escapeHtml(error.message || "โหลดรายชื่อลูกทีมไม่สำเร็จ")}</p></div>`;
  }
}

const teamAddForm = document.getElementById("team-add-form");
teamAddForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const memberSelect = document.getElementById("team-user-select");
  const titleInput = document.getElementById("team-title");
  const descriptionInput = document.getElementById("team-description");
  const submitButton = document.getElementById("team-add-submit");
  const message = document.getElementById("team-management-message");
  const userId = memberSelect?.value;
  if (!userId) {
    if (message) message.textContent = "กรุณาเลือกบัญชีสมาชิกก่อน";
    return;
  }

  submitButton.disabled = true;
  if (message) message.textContent = "กำลังเพิ่มสมาชิกเข้าทีม...";
  try {
    await DozoAPI.updateTeamMember({
      userId,
      role: "staff",
      staffTitle: titleInput?.value.trim() || "ทีมงาน",
      staffDescription: descriptionInput?.value.trim() || ""
    });
    teamAddForm.reset();
    if (message) message.textContent = "เพิ่มสมาชิกเป็นลูกทีมเรียบร้อยแล้ว";
    await renderAdminTeam();
  } catch (error) {
    if (message) message.textContent = error.message || "เพิ่มลูกทีมไม่สำเร็จ";
  } finally {
    submitButton.disabled = false;
  }
});

async function renderAdminAll() {
  await ensureStaffList();
  await renderAdminOrders();
  await renderAdminCustomers();
  await renderAdminTeam();
  const staffCountEl = document.getElementById("admin-stat-staff");
  if (staffCountEl) staffCountEl.textContent = String(staffListCache.length);
}

document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    const panel = document.getElementById("admin-panel-" + tab.dataset.adminTab);
    if (panel) panel.classList.add("active");
  });
});

document.getElementById("btn-refresh-orders")?.addEventListener("click", async () => {
  await renderAdminOrders();
  await renderAdminCustomers();
});

document.getElementById("admin-order-filter")?.addEventListener("change", () => {
  renderAdminOrders();
});

document.getElementById("btn-refresh-team")?.addEventListener("click", renderAdminTeam);

document.getElementById("btn-refresh-staff")?.addEventListener("click", () => {
  if (isStaff) renderStaffJobs();
});

document.getElementById("btn-refresh-queue")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-refresh-queue");
  if (btn) {
    btn.classList.add("is-loading");
    btn.disabled = true;
  }
  try {
    await renderCustomerHistory();
  } finally {
    if (btn) {
      btn.classList.remove("is-loading");
      btn.disabled = false;
    }
  }
});

// ---------- Start ----------
window.addEventListener("DOMContentLoaded", () => {
  bindExplorePercentButtons();
  bindAuthMethodTabs();
  startLoading();
});
