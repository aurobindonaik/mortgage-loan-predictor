module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { red: "#c20f2f" }
      },
      boxShadow: {
        card: "0 18px 45px rgba(15,23,42,0.16)"
      }
    }
  },
  plugins: []
};
