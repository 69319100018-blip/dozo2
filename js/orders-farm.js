/* ============================================
   Dozo Genshin — orders-farm
   ============================================ */
// ---------- Packages ----------
function renderPackages() {
  packageGrid.innerHTML = "";
  selectedPackage = null;
  hasSlip = false;
  selectedFarmSlipFile = null;
  if (slipUpload) slipUpload.value = "";
  if (slipPreview?.dataset.objectUrl) {
    URL.revokeObjectURL(slipPreview.dataset.objectUrl);
    delete slipPreview.dataset.objectUrl;
  }
  if (slipPreview) slipPreview.src = "";
  slipPreview?.classList.add("hidden");
  if (uploadPlaceholder) uploadPlaceholder.style.display = "block";
  const farmMapDrive = document.getElementById("farm-map-drive");
  if (farmMapDrive) farmMapDrive.value = "";
  document.getElementById("farm-map-error")?.classList.remove("show");
  updateTotal();
  updateSubmitState();

  const packages = getActivePackages();
  const memberMode = isMemberUser();
  const discountPct = getFarmGemDiscountPercent();
  packages.forEach((pkg, idx) => {
    const el = document.createElement("div");
    el.className = "package-item";
    el.dataset.index = idx;
    const listPrice = pkg.listPrice != null ? pkg.listPrice : pkg.price;
    const hasPromo = discountPct > 0 && listPrice !== pkg.price;
    const priceHtml = hasPromo
      ? `<span class="price price-promo">
          <small class="price-was">${listPrice} ฿</small>
          <span class="price-now">${pkg.price} ฿</span>
          <small class="promo-tag">-${discountPct}%</small>
          ${memberMode ? '<small class="mem-tag">สมาชิก</small>' : ""}
        </span>`
      : `<span class="price">${pkg.price} ฿${memberMode ? '<small class="mem-tag">สมาชิก</small>' : ""}</span>`;
    el.innerHTML = `
      <span class="gems">${pkg.gems.toLocaleString()} เจม</span>
      ${priceHtml}
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

  // ป้ายโปรโมชันเหนือกริดแพ็กเกจ (ถ้ามี)
  let banner = document.getElementById("farm-promo-banner");
  if (!banner && packageGrid?.parentElement) {
    banner = document.createElement("div");
    banner.id = "farm-promo-banner";
    banner.className = "farm-promo-banner";
    packageGrid.parentElement.insertBefore(banner, packageGrid);
  }
  if (banner) {
    if (discountPct > 0) {
      banner.hidden = false;
      banner.innerHTML = `<span class="farm-promo-badge">โปรโมชัน</span> ลดราคาฟาร์มเจม <strong>${discountPct}%</strong> ทุกแพ็กเกจ`;
    } else {
      banner.hidden = true;
      banner.innerHTML = "";
    }
  }
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

    // โหลดเปอร์เซ็นต์ลดราคาฟาร์มเจมจากแอดมิน แล้วรีเรนเดอร์แพ็กเกจ
    const prevDiscount = getFarmGemDiscountPercent();
    const nextDiscount = setFarmGemDiscountPercent(cfg.farmGemDiscountPercent);
    if (prevDiscount !== nextDiscount && typeof renderPackages === "function") {
      renderPackages();
    }

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
  if (!file) return;
  if (!file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    selectedFarmSlipFile = null;
    hasSlip = false;
    if (slipPreview.dataset.objectUrl) {
      URL.revokeObjectURL(slipPreview.dataset.objectUrl);
      delete slipPreview.dataset.objectUrl;
    }
    slipPreview.src = "";
    slipPreview.classList.add("hidden");
    uploadPlaceholder.style.display = "block";
    slipError.textContent = file.size
      ? "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP"
      : "ไฟล์ภาพว่างเปล่าหรืออ่านไม่ได้";
    slipError.classList.add("show");
    updateSubmitState();
    return;
  }

  selectedFarmSlipFile = file;
  if (slipPreview.dataset.objectUrl) URL.revokeObjectURL(slipPreview.dataset.objectUrl);
  slipPreview.dataset.objectUrl = URL.createObjectURL(file);
  slipPreview.src = slipPreview.dataset.objectUrl;
  slipPreview.classList.remove("hidden");
  uploadPlaceholder.style.display = "none";
  hasSlip = true;
  slipError.textContent = "ต้องอัปโหลดสลิปก่อนจึงจะกดสั่งซื้อได้";
  slipError.classList.remove("show");
  updateSubmitState();
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

const farmMapDriveInput = document.getElementById("farm-map-drive");
farmMapDriveInput?.addEventListener("input", () => {
  document.getElementById("farm-map-error")?.classList.remove("show");
  updateSubmitState();
});

function getFarmMapDriveUrl() {
  return (document.getElementById("farm-map-drive")?.value || "").trim();
}

function updateSubmitState() {
  const hasMapLink = isValidGoogleDriveUrl(getFarmMapDriveUrl());
  const canSubmit = !!selectedPackage && hasMapLink && hasSlip;
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
  const mapDriveUrl = getFarmMapDriveUrl();
  if (!isValidGoogleDriveUrl(mapDriveUrl)) {
    document.getElementById("farm-map-error")?.classList.add("show");
    return;
  }
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
    mapDriveUrl,
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
      slipFile: selectedFarmSlipFile
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

