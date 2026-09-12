(function () {
  // Safeguard: run only if socket.io is available
  if (typeof io === "undefined") {
    console.error("Socket.io not loaded (teacher)");
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      /* -------- Get Teacher ID -------- */
      // Preferred: meta tag from EJS
      // <meta name="teacher-id" content="<%= user._id %>">
      const meta = document.querySelector('meta[name="teacher-id"]');
      const teacherId = meta?.content || window.__TEACHER_ID || null;

      if (!teacherId) {
        console.warn("Teacher ID not found. Online status will not work.");
        return;
      }

      /* -------- Initialize Socket -------- */
      const socket = io({
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      /* -------- Announce Teacher Online -------- */
      function announceOnline() {
        socket.emit("who", {
          role: "teacher",
          id: String(teacherId),
        });
        // console.log("Teacher online:", teacherId);
      }

      /* -------- Connection Events -------- */
      socket.on("connect", () => {
        console.log("✅ Teacher socket connected:", socket.id);
        announceOnline();
      });

      socket.on("disconnect", () => {
        console.warn("❌ Teacher socket disconnected");
      });

      socket.on("connect_error", (err) => {
        console.error("Teacher socket error:", err.message);
      });

      /* -------- Reconnect Handling -------- */
      if (socket.io && socket.io.on) {
        socket.io.on("reconnect", () => {
          console.log("🔁 Teacher socket reconnected");
          announceOnline();
        });
      }

      /* -------- Attendance Updates (Admin Broadcast) -------- */
      // Server emits: io.to("admins").emit("attendance:update", data);
      // Teacher generally does not need this, but kept for future use
      socket.on("attendance:update", (data = {}) => {
        // Optional: show toast / refresh UI
        // console.log("Attendance update:", data);
      });

    } catch (e) {
      console.warn("teacher_socket error:", e?.message || e);
    }
  });
})();
