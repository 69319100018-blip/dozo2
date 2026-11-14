/* Browser-side API client. All requests stay on this site's own domain. */
(() => {
  "use strict";

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  }

  let blobClientPromise;
  function getBlobClient() {
    blobClientPromise ||= import("https://esm.sh/@vercel/blob@2.9.0/client?bundle");
    return blobClientPromise;
  }

  window.DozoAPI = {
    async getConfig() {
      return request("/api/config", { method: "GET" });
    },

    setFarmGemDiscount(farmGemDiscountPercent) {
      return request("/api/config", {
        method: "PATCH",
        body: JSON.stringify({ farmGemDiscountPercent }),
      });
    },

    async me() {
      const result = await request("/api/auth", { method: "GET" });
      return result.user || null;
    },

    login({ email, password }) {
      return request("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", email, password }),
      });
    },

    register({ email, password, displayName }) {
      return request("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "register", email, password, displayName }),
      });
    },

    logout() {
      return request("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      });
    },

    upgradeMember({ slipPath }) {
      return request("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "upgrade-member", slipPath }),
      });
    },

    async listOrders() {
      const result = await request("/api/orders", { method: "GET" });
      return result.orders || [];
    },

    async listPublicQueue() {
      const result = await request("/api/orders?queue=1", { method: "GET" });
      return result.orders || [];
    },

    createOrder(order) {
      return request("/api/orders", {
        method: "POST",
        body: JSON.stringify(order),
      });
    },

    updateOrderStatus(id, status) {
      return request(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    assignOrder(id, assignedStaffId) {
      return request(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedStaffId }),
      });
    },

    listTeam() {
      return request("/api/team", { method: "GET" });
    },

    updateTeamMember(payload) {
      return request("/api/team", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    async uploadFile(file, purpose) {
      if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("รองรับเฉพาะไฟล์ JPG, PNG และ WEBP");
      }

      const { pathname } = await request("/api/upload", {
        method: "POST",
        body: JSON.stringify({ action: "prepare", purpose, contentType: file.type }),
      });
      const { uploadPresigned } = await getBlobClient();
      try {
        const blob = await uploadPresigned(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ purpose, contentType: file.type }),
          contentType: file.type,
          multipart: file.size > 100 * 1024 * 1024,
        });
        return { success: true, pathname: blob.pathname, size: file.size, contentType: file.type };
      } catch (error) {
        console.error("Direct image upload failed", error);
        throw new Error(error?.message || "อัปโหลดภาพไม่สำเร็จ กรุณาลองใหม่");
      }
    },

    fileUrl(pathname) {
      return `/api/upload?pathname=${encodeURIComponent(pathname)}`;
    },
  };
})();
