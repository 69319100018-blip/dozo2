/* ============================================
   Dozo Genshin — auth
   ============================================ */
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

