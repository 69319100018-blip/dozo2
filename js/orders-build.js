/* ============================================
   Dozo Genshin — orders-build
   ============================================ */
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

