/* ============================================
   Dozo Genshin — orders-abyss-explore
   ============================================ */
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

