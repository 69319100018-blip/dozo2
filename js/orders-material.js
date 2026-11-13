/* ============================================
   Dozo Genshin — orders-material
   ============================================ */
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
    if (!file) return;
    if (!file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onChange(false, null);
      if (preview?.dataset.objectUrl) {
        URL.revokeObjectURL(preview.dataset.objectUrl);
        delete preview.dataset.objectUrl;
      }
      if (preview) preview.src = "";
      preview?.classList.add("hidden");
      if (placeholder) placeholder.style.display = "block";
      if (error) {
        error.textContent = file.size
          ? "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP"
          : "ไฟล์ภาพว่างเปล่าหรืออ่านไม่ได้";
        error.classList.add("show");
      }
      return;
    }

    if (preview) {
      if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
      preview.dataset.objectUrl = URL.createObjectURL(file);
      preview.src = preview.dataset.objectUrl;
      preview.classList.remove("hidden");
    }
    if (placeholder) placeholder.style.display = "none";
    onChange(true, file);
    if (error) {
      error.textContent = "ต้องอัปโหลดภาพก่อนจึงจะกดสั่งซื้อได้";
      error.classList.remove("show");
    }
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
  const facebookName = document.getElementById("mat-facebook-name")?.value.trim() || "";
  if (!facebookName || facebookName.length < 2) { alert("กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน"); return; }

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
      facebookName,
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

