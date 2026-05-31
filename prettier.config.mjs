/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "**/*.svg",
      options: {
        parser: "html",
      },
    },
  ],
};

export default config;
