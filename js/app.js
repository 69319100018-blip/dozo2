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

// Views
const views = {
  home: document.getElementById("view-home"),
  orderFarm: document.getElementById("view-order-farm"),
  orderMaterial: document.getElementById("view-order-material"),
  orderAbyss: document.getElementById("view-order-abyss"),
  orderExplore: document.getElementById("view-order-explore"),
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
const charGrid = document.getElementById("char-grid");
const charSearch = document.getElementById("char-search");
const charSelectedHint = document.getElementById("char-selected-hint");
const materialForm = document.getElementById("material-form");
const btnSubmitMaterial = document.getElementById("btn-submit-material");

// Abyss / Explore
const abyssForm = document.getElementById("abyss-form");
const exploreForm = document.getElementById("explore-form");
const btnSubmitAbyss = document.getElementById("btn-submit-abyss");
const btnSubmitExplore = document.getElementById("btn-submit-explore");
const abyssPackageGrid = document.getElementById("abyss-package-grid");
const explorePackageGrid = document.getElementById("explore-package-grid");

const ABYSS_OPTIONS = [
  { id: "floor-9-10", label: "ชั้น 9–10", sub: "เคลียร์" },
  { id: "floor-11", label: "ชั้น 11", sub: "เคลียร์" },
  { id: "floor-12", label: "ชั้น 12", sub: "เคลียร์" },
  { id: "full-36", label: "36 ดาว", sub: "เต็มทุกชั้น" },
  { id: "custom", label: "กำหนดเอง", sub: "ระบุในรายละเอียด" }
];

const EXPLORE_OPTIONS = [
  { id: "mondstadt", label: "Mondstadt", sub: "เปิดแผนที่" },
  { id: "liyue", label: "Liyue", sub: "เปิดแผนที่" },
  { id: "inazuma", label: "Inazuma", sub: "เปิดแผนที่" },
  { id: "sumeru", label: "Sumeru", sub: "เปิดแผนที่" },
  { id: "fontaine", label: "Fontaine", sub: "เปิดแผนที่" },
  { id: "natlan", label: "Natlan", sub: "เปิดแผนที่" },
  { id: "all", label: "ทุกภูมิภาค", sub: "100% ทั้งหมด" },
  { id: "custom-map", label: "กำหนดเอง", sub: "ระบุในรายละเอียด" }
];

let selectedAbyss = null;
let hasAbyssSlip = false;
let selectedExplore = null;
let hasExploreSlip = false;

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
async function saveOrder(order, { slipFile, attachmentFile = null } = {}) {
  if (!slipFile) throw new Error("กรุณาเลือกไฟล์สลิปก่อนสั่งซื้อ");
  const slip = await DozoAPI.uploadFile(slipFile, "slip");
  let attachment = null;
  if (attachmentFile) {
    attachment = await DozoAPI.uploadFile(attachmentFile, "material_screenshot");
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

async function handleOrderError(error) {
  console.error(error);
  alert(error?.message || "บันทึกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
}

// ---------- Packages (จากภาพเรทราคา) ----------
const PACKAGES = [
  { gems: 160, price: 10 },
  { gems: 320, price: 18 },
  { gems: 480, price: 29 },
  { gems: 680, price: 36 },
  { gems: 800, price: 49 },
  { gems: 1600, price: 90 },
  { gems: 3200, price: 160 },
  { gems: 4800, price: 249 },
  { gems: 6400, price: 370 },
  { gems: 8000, price: 440 },
  { gems: 9600, price: 500 },
  { gems: 11200, price: 580 },
  { gems: 12800, price: 680 },
  { gems: 14400, price: 770 },
  { gems: 16000, price: 890 }
];

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
let selectedMatScreenshotFile = null;
let selectedMatSlipFile = null;
let selectedAbyssSlipFile = null;
let selectedExploreSlipFile = null;

let selectedCharacter = null;
let hasMatShot = false;
let hasMatSlip = false;

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
        switchScreen(loadingScreen, loginScreen);
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

  document.querySelectorAll(".customer-only").forEach(el => {
    el.classList.toggle("hidden", isAdmin || isStaff);
  });
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });
  document.querySelectorAll(".staff-only").forEach(el => {
    el.classList.toggle("hidden", !isStaff);
  });

  const badge = document.getElementById("role-badge");
  if (badge) {
    if (isAdmin) {
      badge.textContent = "ADMIN";
      badge.className = "role-badge role-admin";
    } else if (isStaff) {
      badge.textContent = "STAFF";
      badge.className = "role-badge role-staff";
    } else {
      badge.textContent = "";
      badge.className = "role-badge hidden";
    }
  }
}

function goToDashboard(user) {
  currentUser = user;
  applyRoleChrome(user);
  userEmailEl.textContent = user?.email || "ผู้ใช้";
  if (displayNameEl) {
    displayNameEl.textContent = user?.displayName || user?.email?.split("@")[0] || "นักเดินทาง";
  }

  switchScreen(loginScreen, dashboardScreen);
  if (isAdmin) showView("admin");
  else if (isStaff) showView("staff");
  else showView("home");
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

logoutBtn.addEventListener("click", async () => {
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
  applyRoleChrome(null);
  dashboardScreen.classList.remove("active");
  setTimeout(() => {
    dashboardScreen.style.display = "none";
    loginScreen.style.display = "flex";
    void loginScreen.offsetWidth;
    loginScreen.classList.add("active");
    loginForm.reset();
    setAuthMode(false);
    hideError();
  }, 400);
});

async function checkAuthState() {
  try {
    const user = await DozoAPI.me();
    if (user) goToDashboard(user);
  } catch (error) {
    console.error("Session check failed:", error);
    showError("เชื่อมต่อระบบไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
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
    "order-abyss": views.orderAbyss,
    "order-explore": views.orderExplore
  };
  if (map[name]) map[name].classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });

  if (name === "admin" && isAdmin) renderAdminAll();
  if (name === "staff" && isStaff) renderStaffJobs();
  if (name === "history") renderCustomerHistory();
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.getElementById("btn-back-home")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-mat")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-abyss")?.addEventListener("click", () => showView("home"));
document.getElementById("btn-back-home-explore")?.addEventListener("click", () => showView("home"));

document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.goto));
});

// Service cards
document.querySelectorAll(".service-card").forEach(card => {
  const btn = card.querySelector(".btn-service");
  btn.addEventListener("click", () => {
    const service = card.dataset.service;
    if (service === "farm-gem") {
      showView("order-farm");
      renderPackages();
    } else if (service === "material") {
      showView("order-material");
      renderCharacters();
    } else if (service === "abyss") {
      showView("order-abyss");
      renderAbyssOptions();
    } else if (service === "explore") {
      showView("order-explore");
      renderExploreOptions();
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
  if (slipUpload) slipUpload.value = "";
  slipPreview?.classList.add("hidden");
  if (uploadPlaceholder) uploadPlaceholder.style.display = "block";
  updateTotal();
  updateSubmitState();

  PACKAGES.forEach((pkg, idx) => {
    const el = document.createElement("div");
    el.className = "package-item";
    el.dataset.index = idx;
    el.innerHTML = `
      <span class="gems">${pkg.gems.toLocaleString()} เจม</span>
      <span class="price">${pkg.price} ฿</span>
    `;
    el.addEventListener("click", () => {
      document.querySelectorAll(".package-item").forEach(p => p.classList.remove("selected"));
      el.classList.add("selected");
      selectedPackage = pkg;
      updateTotal();
      updateSubmitState();
    });
    packageGrid.appendChild(el);
  });
}

function updateTotal() {
  if (!selectedPackage) {
    totalPriceEl.textContent = "0 ฿";
    return;
  }
  let price = selectedPackage.price;
  if (rushCheck.checked) {
    price = Math.round(price * 1.3);
  }
  totalPriceEl.textContent = price.toLocaleString() + " ฿";
}

rushCheck?.addEventListener("change", updateTotal);

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

function updateSubmitState() {
  const canSubmit = !!selectedPackage && hasSlip;
  btnSubmitOrder.disabled = !canSubmit;
}

// ---------- Submit Order ----------
farmForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedPackage) { alert("กรุณาเลือกจำนวนเจม"); return; }
  if (!hasSlip || !selectedFarmSlipFile) { slipError.classList.add("show"); return; }

  const userVal = document.getElementById("game-user").value.trim();
  const uidVal = document.getElementById("game-id").value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    gems: selectedPackage.gems,
    rush: rushCheck.checked,
    prohibitions: document.getElementById("prohibitions").value.trim(),
    stream: document.querySelector('input[name="stream"]:checked')?.value || "no"
  };

  btnSubmitOrder.disabled = true;
  try {
    const saved = await saveOrder({
      service: "farm-gem",
      gameUsername: userVal,
      gameUid: uidVal,
      details
    }, { slipFile: selectedFarmSlipFile });

    alert(
      `✅ ส่งคำสั่งซื้อสำเร็จ!\n\n` +
      `รหัสออเดอร์: ${saved.order.orderNumber}\n` +
      `จำนวน: ${details.gems.toLocaleString()} เจม\n` +
      `ยอดชำระ: ${saved.order.totalPrice} ฿\n\n` +
      `ระบบบันทึกข้อมูลแล้ว กรุณาติดต่อ Facebook: Do Zo Genshin เพื่อประสานงาน`
    );
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateSubmitState();
  }
});

// ---------- Characters (หาวัสดุ) ----------
function renderCharacters(filter = "") {
  if (!charGrid) return;
  charGrid.innerHTML = "";
  const q = filter.trim().toLowerCase();
  const list = q
    ? CHARACTERS.filter(c => c.toLowerCase().includes(q))
    : CHARACTERS;

  if (!list.length) {
    charGrid.innerHTML = `<p class="hint" style="padding:0.8rem;grid-column:1/-1">ไม่พบตัวละคร</p>`;
    return;
  }

  list.forEach(name => {
    const el = document.createElement("div");
    el.className = "char-item" + (selectedCharacter === name ? " selected" : "");
    el.textContent = name;
    el.addEventListener("click", () => {
      selectedCharacter = name;
      document.querySelectorAll(".char-item").forEach(c => c.classList.remove("selected"));
      el.classList.add("selected");
      if (charSelectedHint) charSelectedHint.textContent = "เลือกแล้ว: " + name;
      updateMaterialSubmitState();
    });
    charGrid.appendChild(el);
  });
}

charSearch?.addEventListener("input", () => {
  renderCharacters(charSearch.value);
});

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
  btnSubmitMaterial.disabled = !(selectedCharacter && hasMatShot && hasMatSlip);
}

materialForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedCharacter) { alert("กรุณาเลือกตัวละคร"); return; }
  if (!hasMatShot || !selectedMatScreenshotFile) { document.getElementById("mat-shot-error")?.classList.add("show"); return; }
  if (!hasMatSlip || !selectedMatSlipFile) { document.getElementById("mat-slip-error")?.classList.add("show"); return; }

  const userVal = document.getElementById("mat-user")?.value.trim();
  const uidVal = document.getElementById("mat-id")?.value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    character: selectedCharacter,
    note: document.getElementById("mat-note")?.value.trim() || "",
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
    alert(
      `✅ ส่งคำสั่งซื้อหาวัสดุสำเร็จ!\n\n` +
      `รหัสออเดอร์: ${savedMat.order.orderNumber}\n` +
      `ตัวละคร: ${details.character}\n\n` +
      `ระบบบันทึกข้อมูลแล้ว กรุณาติดต่อ Facebook: Do Zo Genshin เพื่อประสานงาน`
    );
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateMaterialSubmitState();
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

function renderAbyssOptions() {
  selectedAbyss = null;
  hasAbyssSlip = false;
  selectedAbyssSlipFile = null;
  updateAbyssSubmitState();
  renderOptionGrid(abyssPackageGrid, ABYSS_OPTIONS, selectedAbyss, (opt) => {
    selectedAbyss = opt;
    updateAbyssSubmitState();
  });
}

function renderExploreOptions() {
  selectedExplore = null;
  hasExploreSlip = false;
  selectedExploreSlipFile = null;
  updateExploreSubmitState();
  renderOptionGrid(explorePackageGrid, EXPLORE_OPTIONS, selectedExplore, (opt) => {
    selectedExplore = opt;
    updateExploreSubmitState();
  });
}

function updateAbyssSubmitState() {
  if (btnSubmitAbyss) btnSubmitAbyss.disabled = !(selectedAbyss && hasAbyssSlip);
}
function updateExploreSubmitState() {
  if (btnSubmitExplore) btnSubmitExplore.disabled = !(selectedExplore && hasExploreSlip);
}

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

abyssForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedAbyss) { alert("กรุณาเลือกชั้น / เป้าหมาย"); return; }
  if (!hasAbyssSlip || !selectedAbyssSlipFile) { document.getElementById("abyss-slip-error")?.classList.add("show"); return; }
  const userVal = document.getElementById("abyss-user")?.value.trim();
  const uidVal = document.getElementById("abyss-id")?.value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    package: selectedAbyss.label,
    detail: document.getElementById("abyss-detail")?.value.trim() || "",
    prohibitions: document.getElementById("abyss-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="abyss-stream"]:checked')?.value || "no"
  };
  btnSubmitAbyss.disabled = true;
  try {
    const saved = await saveOrder({ service: "abyss", gameUsername: userVal, gameUid: uidVal, details }, { slipFile: selectedAbyssSlipFile });
    alert(`✅ ส่งคำสั่งซื้อเคลียร์ Abyss สำเร็จ!\n\nรหัสออเดอร์: ${saved.order.orderNumber}\nเป้าหมาย: ${details.package}\n\nระบบบันทึกข้อมูลแล้ว กรุณาติดต่อ Facebook: Do Zo Genshin`);
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateAbyssSubmitState();
  }
});

exploreForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedExplore) { alert("กรุณาเลือกพื้นที่ / เป้าหมาย"); return; }
  if (!hasExploreSlip || !selectedExploreSlipFile) { document.getElementById("explore-slip-error")?.classList.add("show"); return; }
  const userVal = document.getElementById("explore-user")?.value.trim();
  const uidVal = document.getElementById("explore-id")?.value.trim();
  if (!userVal || !uidVal) { alert("กรุณากรอก Username และ UID ให้ครบ"); return; }

  const details = {
    package: selectedExplore.label,
    detail: document.getElementById("explore-detail")?.value.trim() || "",
    prohibitions: document.getElementById("explore-prohibitions")?.value.trim() || "",
    stream: document.querySelector('input[name="explore-stream"]:checked')?.value || "no"
  };
  btnSubmitExplore.disabled = true;
  try {
    const saved = await saveOrder({ service: "explore", gameUsername: userVal, gameUid: uidVal, details }, { slipFile: selectedExploreSlipFile });
    alert(`✅ ส่งคำสั่งซื้อสำรวจแผนที่สำเร็จ!\n\nรหัสออเดอร์: ${saved.order.orderNumber}\nพื้นที่: ${details.package}\n\nระบบบันทึกข้อมูลแล้ว กรุณาติดต่อ Facebook: Do Zo Genshin`);
  } catch (error) {
    await handleOrderError(error);
  } finally {
    updateExploreSubmitState();
  }
});

// ---------- Admin / Staff panels ----------
const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่"
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
    const files = [privateFileLink(o.slipPath, "ดูสลิป"), privateFileLink(o.attachmentPath, "ดูภาพวัสดุ")].filter(Boolean).join(" · ");
    const assignedLabel = o.assignedStaffName
      ? `<div class="assign-current">${escapeHtml(o.assignedStaffName)}</div>`
      : `<div class="assign-current muted">ยังไม่มอบหมาย</div>`;
    return `<tr class="${o.assignedStaffId ? "" : "row-unassigned"}">
      <td>${escapeHtml(formatTime(o.createdAt))}</td>
      <td><span class="svc-chip">${escapeHtml(SERVICE_LABEL[o.service] || o.service)}</span></td>
      <td class="cell-detail">${escapeHtml(o.summary || "-")}<br><small>${files}</small></td>
      <td>
        <div>${escapeHtml(o.customerEmail || "-")}</div>
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
    const files = [privateFileLink(o.slipPath, "ดูสลิป"), privateFileLink(o.attachmentPath, "ดูภาพวัสดุ")].filter(Boolean).join(" · ");
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
        <span>ลูกค้า: ${escapeHtml(o.customerEmail || "-")}</span>
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
  const container = document.getElementById("customer-history-list");
  if (!container) return;
  try {
    const orders = await loadOrders();
    if (!orders.length) {
      container.innerHTML = `<div class="empty-state glass"><p>ยังไม่มีประวัติการสั่งซื้อ</p><button class="btn-service" data-goto="home">ไปเลือกบริการ</button></div>`;
      container.querySelector("[data-goto]")?.addEventListener("click", () => showView("home"));
      return;
    }
    container.innerHTML = orders.map(o => {
      const status = STATUS_LABEL[o.status] || o.status || "รอดำเนินการ";
      const files = [privateFileLink(o.slipPath, "ดูสลิป"), privateFileLink(o.attachmentPath, "ดูภาพวัสดุ")].filter(Boolean).join(" · ");
      return `<article class="history-card glass">
        <div class="history-card-head">
          <h3>${escapeHtml(SERVICE_LABEL[o.service] || o.service)} <span class="order-number">#${escapeHtml(o.orderNumber)}</span></h3>
          <span class="status-badge status-${escapeHtml(o.status || "pending")}">${escapeHtml(status)}</span>
        </div>
        <p>${escapeHtml(o.summary || "-")}</p>
        <div class="history-meta"><span>UID: ${escapeHtml(o.uid || "-")}</span><span>${escapeHtml(formatTime(o.createdAt))}</span></div>
        ${files ? `<div class="history-files">${files}</div>` : ""}
      </article>`;
    }).join("");
  } catch (error) {
    container.innerHTML = `<div class="empty-state glass"><p>${escapeHtml(error.message || "โหลดประวัติไม่สำเร็จ")}</p></div>`;
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

// ---------- Start ----------
window.addEventListener("DOMContentLoaded", () => {
  startLoading();
});
