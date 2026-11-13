/* ============================================
   Dozo Genshin — navigation
   ============================================ */
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

