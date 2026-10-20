/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
                display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    900: "#0f172a",
                    800: "#1e293b",
                    700: "#334155",
                },
            },
        },
    },
    plugins: [],
};
