(function () {
  if (typeof io === "undefined") {
    console.error("Socket.io not loaded");
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("online-teachers-list");
    const toastContainer = document.getElementById("toast-container");

    /* -------- Normalize Teachers Map (ID -> info) -------- */
    const rawMap = window.__TEACHERS_MAP || {};
    const tMap = {};
    Object.keys(rawMap).forEach(k => {
      tMap[String(k)] = rawMap[k];
    });

    /* -------- Initialize Socket -------- */
    const socket = io({
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    /* -------- CONNECTION -------- */
    socket.on("connect", () => {
      console.log("✅ Admin socket connected:", socket.id);

      // VERY IMPORTANT: register as admin
      socket.emit("who", { role: "admin" });

      if (container) {
        container.innerHTML = `
          <p style="text-align:center; color:#64748b; font-size:0.85rem; padding:20px;">
            Connected. Waiting for live updates...
          </p>`;
      }
    });

    socket.on("disconnect", () => {
      console.warn("❌ Admin socket disconnected");
      if (container) {
        container.innerHTML = `
          <p style="text-align:center; color:#94a3b8; font-size:0.85rem; padding:20px;">
            Disconnected from server
          </p>`;
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    /* -------- ONLINE TEACHERS (SERVER MATCH) -------- */
    socket.on("onlineTeachers:update", (payload = {}) => {
      if (!container) return;

      const ids = payload.ids || [];
      container.innerHTML = "";

      if (ids.length === 0) {
        container.innerHTML = `
          <p style="text-align:center; color:#94a3b8; font-size:0.85rem; padding:20px;">
            No teachers online
          </p>`;
        return;
      }

      ids.forEach((id) => {
        const info = tMap[String(id)];
        const name = info?.name || `Teacher (${String(id).slice(0, 5)})`;
        const sub = info?.subject || "Faculty Member";

        const div = document.createElement("div");
        div.className = "online-item";
        div.innerHTML = `
          <div class="status-dot"></div>
          <div>
            <div class="teacher-name" style="font-weight:600;">${name}</div>
            <div class="teacher-sub" style="font-size:0.75rem; color:#64748b;">${sub}</div>
          </div>
        `;

        container.appendChild(div);
      });
    });

    /* -------- TOAST UTILITY -------- */
    function showToast(title, msg) {
      if (!toastContainer) return;

      const toast = document.createElement("div");
      toast.className = "toast-card";
      toast.innerHTML = `
        <strong>${title}</strong>
        <div style="font-size:0.8rem; opacity:0.85;">${msg}</div>
      `;

      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        setTimeout(() => toast.remove(), 500);
      }, 4500);
    }

    /* -------- LIVE ATTENDANCE -------- */
    socket.on("attendance:update", (data = {}) => {
      if (!data.teacherName) return;

      showToast(
        "Live Attendance",
        `${data.teacherName} marked attendance for ${data.className || "class"}`
      );
    });

  });
})();
