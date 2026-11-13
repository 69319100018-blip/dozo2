/* ============================================
   Dozo Genshin — utils
   ============================================ */
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

const AUTH_METHOD_LABEL = {
  hoyoverse: "Hoyoverse",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

function detailRow(label, value, { mono = false, secret = false, copy = false } = {}) {
  if (value == null || value === "") return "";
  const text = String(value);
  const cls = [
    mono ? "detail-mono" : "",
    secret ? "detail-secret" : "",
    copy ? "detail-copyable" : "",
  ].filter(Boolean).join(" ");
  const copyAttr = copy
    ? ` data-copy="${escapeHtml(text)}" title="คลิกเพื่อคัดลอก" role="button" tabindex="0"`
    : "";
  const copyHint = copy ? `<span class="detail-copy-hint" aria-hidden="true">คัดลอก</span>` : "";
  return `<div class="detail-row">
    <span class="detail-label">${escapeHtml(label)}</span>
    <span class="detail-value${cls ? ` ${cls}` : ""}"${copyAttr}>${escapeHtml(text)}${copyHint}</span>
  </div>`;
}

/** แสดงรายละเอียดที่ลูกค้ากรอกทั้งหมด (สำหรับแอดมิน / ลูกทีม) */
function formatOrderDetailsHtml(o) {
  const d = o?.details && typeof o.details === "object" ? o.details : {};
  const service = o?.service || "";
  const parts = [];

  // บัญชีเกม / ล็อกอิน — ข้อมูลสำคัญที่ต้องใช้ทำงาน
  const accountBlock = [
    detailRow("ชื่อในเกม", d.gameName || o.gameUsername),
    detailRow("UID", o.uid || d.uid, { mono: true, copy: true }),
    detailRow("เซิร์ฟเวอร์", d.server),
    detailRow("AR", d.ar != null ? String(d.ar) : null),
    detailRow("วิธีสมัคร", AUTH_METHOD_LABEL[d.authMethod] || d.authMethod),
    detailRow("ID ล็อกอิน", d.loginId, { mono: true, copy: true }),
    detailRow("รหัสผ่าน", d.gamePass, { mono: true, secret: true, copy: true }),
  ].filter(Boolean).join("");

  if (accountBlock) {
    parts.push(`<div class="detail-section"><div class="detail-section-title">บัญชีเกม</div>${accountBlock}</div>`);
  }

  // ตามประเภทบริการ
  if (service === "farm-gem") {
    const farmRows = [
      detailRow("จำนวนเจม", d.gems != null ? `${Number(d.gems).toLocaleString("en-US")} เจม` : null),
      detailRow("งานเร่ง", d.rush === true ? "ใช่ (+30%)" : d.rush === false ? "ไม่" : null),
      detailRow("ไม่นับเจมประจำวัน", d.noDailyGems ? "ใช่ (+20฿)" : null),
      detailRow("ไม่นับอบิส/โรงละคร", d.noAbyssTheaterGems ? "ใช่ (+50฿)" : null),
      detailRow("ตีมอน", d.combat === "cannot" ? "ตีมอนไม่ไหว (+50฿)" : d.combat === "can" ? "ตีมอนได้" : null),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ค่าบริการเพิ่ม", d.extraFees ? `${d.extraFees}฿` : null),
      detailRow("ราคาสมาชิก", d.memberPrice ? "ใช่" : null),
    ].filter(Boolean).join("");
    if (farmRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียดฟาร์มเจม</div>${farmRows}</div>`);
  } else if (service === "material") {
    const matRows = [
      detailRow("ประเภทวัสดุ", d.materialType || d.package),
      detailRow("ใช้กับ", d.forCharacter || d.character),
      detailRow("รายละเอียดที่ต้องการ", d.note),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
    ].filter(Boolean).join("");
    if (matRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียดหาวัสดุ</div>${matRows}</div>`);
  } else if (service === "build-char") {
    const levelPart = [d.levelFrom, d.levelTo].filter(Boolean).join(" → ");
    const buildRows = [
      detailRow("ตัวละคร", d.character),
      detailRow("เป้าหมาย", d.goal || d.package),
      detailRow("เลเวล", levelPart || null),
      detailRow("Talent", d.talent),
      detailRow("หมายเหตุ", d.note || d.detail),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
    ].filter(Boolean).join("");
    if (buildRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียดปั้นตัวละคร</div>${buildRows}</div>`);
  } else if (service === "abyss") {
    const abyssRows = [
      detailRow("เป้าหมาย", d.package || d.packageId),
      detailRow("รายละเอียดเพิ่ม", d.detail || d.note),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
    ].filter(Boolean).join("");
    if (abyssRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียด Abyss</div>${abyssRows}</div>`);
  } else if (service === "explore") {
    const exploreRows = [
      detailRow("เมือง", d.package),
      detailRow("จำนวนพื้นที่", d.areaCount != null && d.areaMax != null ? `${d.areaCount}/${d.areaMax}` : d.areaCount),
      detailRow("เปอร์เซ็นต์", d.percent != null ? `${d.percent}%` : null),
      detailRow("รายละเอียดเพิ่ม", d.detail || d.note),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
    ].filter(Boolean).join("");
    if (exploreRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียดสำรวจแผนที่</div>${exploreRows}</div>`);
  } else if (service === "oculus") {
    let itemsText = null;
    if (Array.isArray(d.items) && d.items.length) {
      itemsText = d.items
        .map((it) => `${it.label || it.type || "Oculus"} × ${it.remaining ?? it.count ?? "?"}`)
        .join(", ");
    }
    const oculusRows = [
      detailRow("รายการ", itemsText),
      detailRow("ไม่มีเข็มทิศ", d.noCompass ? "ใช่ (+20฿)" : null),
      detailRow("ไม่ได้ทำสัญลักษณ์", d.noMarkers ? "ใช่ (+20฿)" : null),
      detailRow("หมายเหตุ", d.note || d.detail),
      detailRow("ข้อห้าม", d.prohibitions),
    ].filter(Boolean).join("");
    if (oculusRows) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียด Oculus</div>${oculusRows}</div>`);
  } else {
    // fallback: แสดง key ที่รู้จัก
    const generic = [
      detailRow("แพ็กเกจ", d.package),
      detailRow("รายละเอียด", d.detail || d.note),
      detailRow("ข้อห้าม", d.prohibitions),
      detailRow("ถ่ายทอดสด", d.stream === "yes" ? "ต้องการ" : d.stream === "no" ? "ไม่ต้องการ" : null),
    ].filter(Boolean).join("");
    if (generic) parts.push(`<div class="detail-section"><div class="detail-section-title">รายละเอียด</div>${generic}</div>`);
  }

  // ลูกค้า / ชำระเงิน
  const customerBlock = [
    detailRow("ชื่อเฟส", o.facebookName),
    detailRow("อีเมลสมาชิก", o.customerEmail),
    detailRow("ชื่อแสดง", o.customerDisplayName),
    detailRow("ยอดชำระ", o.totalPrice != null ? `${o.totalPrice}฿` : null),
    detailRow("รหัสออเดอร์", o.orderNumber != null ? `#${o.orderNumber}` : null),
  ].filter(Boolean).join("");
  if (customerBlock) {
    parts.push(`<div class="detail-section"><div class="detail-section-title">ลูกค้า & ชำระเงิน</div>${customerBlock}</div>`);
  }

  const files = orderFilesHtml(o);
  if (files) {
    parts.push(`<div class="detail-section"><div class="detail-section-title">ไฟล์แนบ</div><div class="detail-files">${files}</div></div>`);
  }

  if (!parts.length) {
    return `<div class="detail-empty">ไม่มีรายละเอียดเพิ่มเติม</div>`;
  }
  return `<div class="order-details-panel">${parts.join("")}</div>`;
}

async function handleOrderError(error) {
  console.error(error);
  alert(error?.message || "บันทึกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
}

