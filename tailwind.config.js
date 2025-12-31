/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'inter': 'Inter, sans-serif',
                'inconsola': 'Inconsola, monospace',
            },
            colors: {
                'main': '#010409',
                'secondary': '#0D1117',
                'line': '#252B32',
                'green': '#46EB82',
                'red': '#EB4648',
            }
        },
    },
    plugins: [],
}