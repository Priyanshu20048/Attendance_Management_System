// utils/validClasses.js

// ✅ Generate all valid classes: 1A–12D
const validClasses = [];

for (let i = 1; i <= 12; i++) {
  ["A", "B", "C", "D"].forEach((sec) => {
    validClasses.push(i + sec);
  });
}

module.exports = validClasses;
