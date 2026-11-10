/* ============================================
   PromptPay QR payload + renderer (browser)
   สร้าง QR ตามยอดเงินอัตโนมัติ (Dynamic PromptPay)
   ============================================ */

(function (global) {
  "use strict";

  function formatTarget(id) {
    const digits = String(id || "").replace(/\D/g, "");
    if (!digits) return null;

    // เบอร์มือถือ 10 หลัก → 0066xxxxxxxxx
    if (digits.length === 10 && digits.startsWith("0")) {
      return "0066" + digits.slice(1);
    }
    // เบอร์ที่ใส่ 66 นำหน้าแล้ว
    if (digits.length === 11 && digits.startsWith("66")) {
      return "00" + digits;
    }
    // เลขบัตรประชาชน / ภาษี 13 หลัก
    if (digits.length === 13) {
      return digits;
    }
    // e-Wallet / อื่นๆ ที่ยาวพอ
    if (digits.length >= 15) {
      return digits;
    }
    return null;
  }

  function tlv(tag, value) {
    const v = String(value);
    const len = String(v.length).padStart(2, "0");
    return tag + len + v;
  }

  // CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
  function crc16(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) {
        if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
        else crc = (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  /**
   * สร้าง EMVCo PromptPay payload
   * @param {string} targetId เบอร์/เลขบัตร/e-Wallet
   * @param {{ amount?: number }} options amount เป็นบาท (ทศนิยมได้)
   */
  function generatePayload(targetId, options = {}) {
    const target = formatTarget(targetId);
    if (!target) throw new Error("PromptPay ID ไม่ถูกต้อง");

    const amount =
      options.amount != null && Number.isFinite(Number(options.amount))
        ? Math.round(Number(options.amount) * 100) / 100
        : null;

    // Tag 29: Merchant Account Information (PromptPay)
    // AID 0016A000000677010111 = credit transfer
    const merchantInfo =
      tlv("00", "A000000677010111") +
      tlv(target.length === 13 ? "02" : "01", target);

    let payload = "";
    payload += tlv("00", "01"); // Payload Format Indicator
    // 12 = dynamic (มี amount), 11 = static
    payload += tlv("01", amount != null && amount > 0 ? "12" : "11");
    payload += tlv("29", merchantInfo);
    payload += tlv("53", "764"); // THB
    if (amount != null && amount > 0) {
      payload += tlv("54", amount.toFixed(2));
    }
    payload += tlv("58", "TH");
    payload += "6304"; // CRC placeholder
    payload += crc16(payload);
    return payload;
  }

  /** วาด QR ลงใน container (ใช้ QRCode จาก CDN ถ้ามี) */
  function renderQr(container, payload, amount) {
    if (!container) return;
    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "qr-dynamic-inner";

    const canvasHost = document.createElement("div");
    canvasHost.className = "qr-canvas-host";
    wrap.appendChild(canvasHost);

    const note = document.createElement("p");
    note.className = "qr-note";
    if (amount != null && amount > 0) {
      note.innerHTML =
        `สแกนเพื่อจ่าย <strong>${Number(amount).toLocaleString("th-TH")} ฿</strong><br/><span class="qr-sub">ยอดถูกใส่ใน QR อัตโนมัติ</span>`;
    } else {
      note.textContent = "สแกนเพื่อจ่ายผ่านพร้อมเพย์ (ระบุยอดเองในแอปธนาคาร)";
    }
    wrap.appendChild(note);

    container.appendChild(wrap);

    if (typeof global.QRCode === "function") {
      // qrcodejs
      // eslint-disable-next-line no-new
      new global.QRCode(canvasHost, {
        text: payload,
        width: 200,
        height: 200,
        colorDark: "#1a1208",
        colorLight: "#ffffff",
        correctLevel: global.QRCode.CorrectLevel.M,
      });
    } else if (global.qrcode && typeof global.qrcode.toCanvas === "function") {
      const canvas = document.createElement("canvas");
      canvasHost.appendChild(canvas);
      global.qrcode.toCanvas(canvas, payload, { width: 200, margin: 1 });
    } else {
      // fallback: ใช้ API สาธารณะสร้างรูป (เฉพาะกรณีไม่มีไลบรารี)
      const img = document.createElement("img");
      img.className = "qr-img";
      img.alt = "QR PromptPay";
      img.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
        encodeURIComponent(payload);
      canvasHost.appendChild(img);
    }
  }

  /**
   * อัปเดตทุกกล่อง .qr-box[data-qr] ตามยอด
   * @param {string} promptPayId
   * @param {number|null} amount
   */
  function updateAllQrBoxes(promptPayId, amount) {
    const boxes = document.querySelectorAll(".qr-box[data-qr]");
    if (!boxes.length) return;

    let payload;
    try {
      payload = generatePayload(promptPayId, {
        amount: amount != null && amount > 0 ? amount : undefined,
      });
    } catch (err) {
      boxes.forEach((box) => {
        box.innerHTML =
          `<p class="qr-note warn">ตั้งค่า PROMPTPAY_ID ไม่ถูกต้อง</p>`;
      });
      console.error(err);
      return;
    }

    boxes.forEach((box) => {
      const mode = box.dataset.qr; // "dynamic" | "static"
      const useAmount =
        mode === "dynamic" && amount != null && amount > 0 ? amount : null;
      const p =
        useAmount != null
          ? generatePayload(promptPayId, { amount: useAmount })
          : generatePayload(promptPayId, {});
      renderQr(box, p, useAmount);
    });
  }

  global.DozoPromptPay = {
    generatePayload,
    renderQr,
    updateAllQrBoxes,
    formatTarget,
  };
})(typeof window !== "undefined" ? window : globalThis);
