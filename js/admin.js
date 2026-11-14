/* ============================================
   Dozo Genshin — admin
   ============================================ */
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

/** Compact status pill with mini progress steps (pending → doing → done) */
function statusBadgeHtml(st) {
  const s = st || "pending";
  const label = STATUS_LABEL[s] || s;
  if (s === "cancel") {
    return `<span class="status-badge status-cancel">${escapeHtml(label)}</span>`;
  }
  const steps = ["pending", "doing", "done"];
  const idx = Math.max(0, steps.indexOf(s));
  const dots = steps
    .map((key, i) => {
      let cls = "status-dot";
      if (i < idx) cls += " is-done";
      else if (i === idx) cls += " is-current";
      return `<span class="${cls}" data-step="${key}"></span>`;
    })
    .join("");
  return `<span class="status-badge status-${escapeHtml(s)} status-with-steps">
    <span class="status-steps" aria-hidden="true">${dots}</span>
    <span class="status-label">${escapeHtml(label)}</span>
  </span>`;
}

function emptyStateHtml(title, subtitle = "") {
  return `<div class="empty-state glass empty-state-rich">
    <div class="empty-emblem" aria-hidden="true">
      <span class="empty-orbit"></span>
      <span class="empty-letter">D</span>
    </div>
    <p class="empty-title">${escapeHtml(title)}</p>
    ${subtitle ? `<p class="empty-sub">${escapeHtml(subtitle)}</p>` : ""}
  </div>`;
}

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
    const detailsHtml = formatOrderDetailsHtml(o);
    return `<tr class="order-row ${o.assignedStaffId ? "" : "row-unassigned"}" data-order-row="${escapeHtml(o.id)}">
      <td>${escapeHtml(formatTime(o.createdAt))}</td>
      <td><span class="svc-chip">${escapeHtml(SERVICE_LABEL[o.service] || o.service)}</span></td>
      <td class="cell-detail">
        <div class="detail-summary">${escapeHtml(o.summary || "-")}</div>
        ${files ? `<small class="detail-file-links">${files}</small>` : ""}
        <button type="button" class="btn-toggle-detail" data-toggle-detail="${escapeHtml(o.id)}" aria-expanded="false">
          ดูรายละเอียดทั้งหมด
        </button>
      </td>
      <td>
        <div>${escapeHtml(o.facebookName || o.customerDisplayName || o.customerEmail || "ไม่ระบุ")}</div>
        <small class="muted">UID: ${escapeHtml(o.uid || "-")}</small>
      </td>
      <td>
        ${assignedLabel}
        ${staffAssignSelectHtml(o)}
      </td>
      <td>
        ${statusBadgeHtml(st)}
        ${statusSelectHtml(o.id, st)}
      </td>
    </tr>
    <tr class="order-detail-row hidden" data-detail-for="${escapeHtml(o.id)}">
      <td colspan="6">${detailsHtml}</td>
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

  tbody.querySelectorAll("button[data-toggle-detail]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleDetail;
      const detailRow = tbody.querySelector(`tr[data-detail-for="${id}"]`);
      if (!detailRow) return;
      const open = detailRow.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "ซ่อนรายละเอียด" : "ดูรายละเอียดทั้งหมด";
      btn.classList.toggle("is-open", open);
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
    const detailsHtml = formatOrderDetailsHtml(o);
    return `<article class="staff-job-card glass status-border-${escapeHtml(st)}">
      <div class="staff-job-head">
        <div>
          <h3>${escapeHtml(SERVICE_LABEL[o.service] || o.service)}
            <span class="order-number">#${escapeHtml(o.orderNumber)}</span>
          </h3>
          <p class="staff-job-summary">${escapeHtml(o.summary || "-")}</p>
        </div>
        ${statusBadgeHtml(st)}
      </div>
      <div class="staff-job-meta">
        <span>ลูกค้า: ${escapeHtml(o.facebookName || o.customerDisplayName || o.customerEmail || "ไม่ระบุ")}</span>
        <span>UID: ${escapeHtml(o.uid || "-")}</span>
        <span>Username: ${escapeHtml(o.gameUsername || "-")}</span>
        <span>${escapeHtml(formatTime(o.createdAt))}</span>
      </div>
      ${files ? `<div class="history-files">${files}</div>` : ""}
      <details class="staff-order-details">
        <summary>ดูรายละเอียดที่ลูกค้ากรอกทั้งหมด</summary>
        ${detailsHtml}
      </details>
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

/** cache คิวสาธารณะ — ใช้กรอง/ค้นหาฝั่ง client */
let publicQueueCache = [];

function getQueueSearchQuery() {
  return (document.getElementById("queue-search")?.value || "").trim().toLowerCase();
}

function getQueueStatusFilter() {
  return document.getElementById("queue-status-filter")?.value || "all";
}

function filterPublicQueue(orders) {
  const q = getQueueSearchQuery();
  const statusFilter = getQueueStatusFilter();
  return orders.filter((o) => {
    const st = o.status || "pending";
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (!q) return true;
    const hay = [
      o.orderNumber != null ? String(o.orderNumber) : "",
      o.orderNumber != null ? `#${o.orderNumber}` : "",
      o.facebookName || "",
      o.gameUsername || "",
      o.summary || "",
      SERVICE_LABEL[o.service] || o.service || "",
      STATUS_LABEL[st] || st,
      o.totalPrice != null ? String(o.totalPrice) : "",
    ]
      .join(" ")
      .toLowerCase();
    // รองรับค้นหาแบบตัดช่องว่าง / บางส่วนของเลขคิว
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every((t) => hay.includes(t));
  });
}

function paintPublicQueueTable(orders) {
  const tbody = document.getElementById("queue-tbody");
  const countEl = document.getElementById("queue-count");
  const hintEl = document.getElementById("queue-filter-hint");
  const clearBtn = document.getElementById("queue-search-clear");
  if (!tbody) return;

  const q = getQueueSearchQuery();
  const statusFilter = getQueueStatusFilter();
  const filtered = filterPublicQueue(orders);

  if (countEl) countEl.textContent = String(filtered.length);
  if (clearBtn) clearBtn.classList.toggle("hidden", !q);

  if (hintEl) {
    const filtering = q || statusFilter !== "all";
    if (!filtering) {
      hintEl.textContent = "";
    } else if (!filtered.length) {
      hintEl.textContent = "ไม่พบรายการตามเงื่อนไข";
    } else {
      hintEl.textContent = `แสดง ${filtered.length} จาก ${orders.length} รายการ`;
    }
  }

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell empty-cell-rich">
      <div class="empty-emblem" aria-hidden="true"><span class="empty-orbit"></span><span class="empty-letter">D</span></div>
      <p class="empty-title">ยังไม่มีออเดอร์ในคิว</p>
      <p class="empty-sub">เมื่อมีคนสั่งงาน คิวจะแสดงที่นี่แบบสาธารณะ</p>
    </td></tr>`;
    return;
  }
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell empty-cell-rich">
      <div class="empty-emblem" aria-hidden="true"><span class="empty-orbit"></span><span class="empty-letter">D</span></div>
      <p class="empty-title">ไม่พบคิวที่ตรงเงื่อนไข</p>
      <p class="empty-sub">ลองใช้เลขออเดอร์ (#1) หรือชื่อเฟส${q ? ` — ค้นหา “${escapeHtml(q)}”` : ""}${statusFilter !== "all" ? ` / ${escapeHtml(STATUS_LABEL[statusFilter] || statusFilter)}` : ""}</p>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((o) => {
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
        <td>${statusBadgeHtml(st)}</td>
      </tr>`;
    })
    .join("");
}

async function renderCustomerHistory() {
  const tbody = document.getElementById("queue-tbody");
  const countEl = document.getElementById("queue-count");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="empty-cell empty-cell-rich">
    <div class="empty-emblem is-loading" aria-hidden="true"><span class="empty-orbit"></span><span class="empty-letter">D</span></div>
    <p class="empty-title">กำลังโหลดคิว...</p>
  </td></tr>`;
  try {
    const orders = await DozoAPI.listPublicQueue();
    publicQueueCache = Array.isArray(orders) ? orders : [];
    paintPublicQueueTable(publicQueueCache);
  } catch (error) {
    publicQueueCache = [];
    if (countEl) countEl.textContent = "-";
    const hintEl = document.getElementById("queue-filter-hint");
    if (hintEl) hintEl.textContent = "";
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

async function renderAdminPromo() {
  const statusEl = document.getElementById("promo-status-value");
  const messageEl = document.getElementById("promo-management-message");
  const grid = document.getElementById("promo-discount-grid");
  if (!grid) return;

  try {
    const cfg = await DozoAPI.getConfig();
    const pct = setFarmGemDiscountPercent(cfg.farmGemDiscountPercent);
    if (statusEl) {
      statusEl.textContent =
        pct > 0 ? `เปิดโปรลดราคา ${pct}%` : "ปิดโปร — ใช้ราคาปกติ";
      statusEl.classList.toggle("is-active", pct > 0);
    }
    grid.querySelectorAll(".promo-discount-btn").forEach((btn) => {
      const val = Number(btn.dataset.discount);
      btn.classList.toggle("is-selected", val === pct);
      btn.disabled = false;
    });
    if (messageEl && !messageEl.dataset.keep) messageEl.textContent = "";
  } catch (error) {
    if (statusEl) statusEl.textContent = "โหลดสถานะไม่สำเร็จ";
    if (messageEl) messageEl.textContent = error.message || "โหลดค่าลดราคาไม่สำเร็จ";
  }
}

async function setAdminFarmDiscount(percent) {
  const messageEl = document.getElementById("promo-management-message");
  const grid = document.getElementById("promo-discount-grid");
  const statusEl = document.getElementById("promo-status-value");
  const buttons = grid ? [...grid.querySelectorAll(".promo-discount-btn")] : [];
  buttons.forEach((btn) => { btn.disabled = true; });
  if (messageEl) {
    messageEl.dataset.keep = "1";
    messageEl.textContent = "กำลังบันทึก...";
  }
  try {
    const result = await DozoAPI.setFarmGemDiscount(percent);
    const pct = setFarmGemDiscountPercent(result.farmGemDiscountPercent ?? percent);
    if (statusEl) {
      statusEl.textContent =
        pct > 0 ? `เปิดโปรลดราคา ${pct}%` : "ปิดโปร — ใช้ราคาปกติ";
      statusEl.classList.toggle("is-active", pct > 0);
    }
    buttons.forEach((btn) => {
      const val = Number(btn.dataset.discount);
      btn.classList.toggle("is-selected", val === pct);
    });
    if (typeof renderPackages === "function") renderPackages();
    if (messageEl) {
      messageEl.textContent =
        result.message ||
        (pct > 0 ? `เปิดลดราคาฟาร์มเจม ${pct}% แล้ว` : "ปิดโปรโมชันแล้ว");
    }
  } catch (error) {
    if (messageEl) messageEl.textContent = error.message || "บันทึกไม่สำเร็จ";
  } finally {
    buttons.forEach((btn) => { btn.disabled = false; });
    if (messageEl) {
      setTimeout(() => {
        delete messageEl.dataset.keep;
      }, 2500);
    }
  }
}

document.getElementById("promo-discount-grid")?.addEventListener("click", (e) => {
  const btn = e.target.closest?.(".promo-discount-btn");
  if (!btn || btn.disabled) return;
  const percent = Number(btn.dataset.discount);
  if (!Number.isFinite(percent)) return;
  setAdminFarmDiscount(percent);
});

async function renderAdminAll() {
  await ensureStaffList();
  await renderAdminOrders();
  await renderAdminCustomers();
  await renderAdminTeam();
  await renderAdminPromo();
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
    if (tab.dataset.adminTab === "promo") renderAdminPromo();
  });
});


// คลิกค่าที่คัดลอกได้ (ID ล็อกอิน / รหัสผ่าน / UID)
async function copyDetailValue(el) {
  const value = el?.getAttribute("data-copy") || "";
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    el.classList.add("is-copied");
    const hint = el.querySelector(".detail-copy-hint");
    const prev = hint?.textContent;
    if (hint) hint.textContent = "คัดลอกแล้ว";
    clearTimeout(el._copyTimer);
    el._copyTimer = setTimeout(() => {
      el.classList.remove("is-copied");
      if (hint && prev) hint.textContent = prev;
    }, 1200);
  } catch (error) {
    console.error("copy failed", error);
    alert("คัดลอกไม่สำเร็จ — ลองเลือกข้อความเอง");
  }
}

document.addEventListener("click", (e) => {
  const el = e.target.closest?.(".detail-copyable");
  if (!el) return;
  e.preventDefault();
  copyDetailValue(el);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest?.(".detail-copyable");
  if (!el) return;
  e.preventDefault();
  copyDetailValue(el);
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

// ค้นหา / กรองคิวสาธารณะ (client-side บน cache)
let queueSearchTimer = null;
document.getElementById("queue-search")?.addEventListener("input", () => {
  clearTimeout(queueSearchTimer);
  queueSearchTimer = setTimeout(() => {
    paintPublicQueueTable(publicQueueCache);
  }, 120);
});
document.getElementById("queue-search")?.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.target.value = "";
    paintPublicQueueTable(publicQueueCache);
  }
});
document.getElementById("queue-search-clear")?.addEventListener("click", () => {
  const input = document.getElementById("queue-search");
  if (input) input.value = "";
  paintPublicQueueTable(publicQueueCache);
  input?.focus();
});
document.getElementById("queue-status-filter")?.addEventListener("change", () => {
  paintPublicQueueTable(publicQueueCache);
});

