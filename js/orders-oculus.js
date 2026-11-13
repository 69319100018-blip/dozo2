/* ============================================
   Dozo Genshin — orders-oculus
   ============================================ */
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

