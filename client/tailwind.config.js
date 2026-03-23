export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        appbg: "#F9FAFB",
        line: "#E5E7EB",
        text: "#111827",
        muted: "#6B7280",
        brand: "#2563EB",
        safe: "#15803D",
        fraud: "#DC2626",
        suspicious: "#B45309"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)"
      }
    }
  },
  plugins: []
};
