/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontSize: {
                '4xs': ['0.5625rem', { lineHeight: '0.75rem' }], // 9px / 12px
                '3xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px / 14px
                '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }], // 11px / 15px
            },
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
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                modalEnter: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'scale3d(0.95, 0.95, 1) translate3d(0, 10px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' 
                    },
                },
                popoverEnter: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'scale3d(0.96, 0.96, 1) translate3d(0, -6px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' 
                    },
                },
                scaleUp: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'scale3d(0.96, 0.96, 1) translate3d(0, 6px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)' 
                    },
                },
                slideUp: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translate3d(0, 14px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translate3d(0, 0, 0)' 
                    },
                },
                slideDown: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translate3d(0, -10px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translate3d(0, 0, 0)' 
                    },
                },
                slideInRight: {
                    '0%': { transform: 'translate3d(100%, 0, 0)' },
                    '100%': { transform: 'translate3d(0, 0, 0)' },
                },
                slideInLeft: {
                    '0%': { transform: 'translate3d(-100%, 0, 0)' },
                    '100%': { transform: 'translate3d(0, 0, 0)' },
                },
                accordionDown: {
                    '0%': { 
                        opacity: '0', 
                        transform: 'translate3d(0, -6px, 0)' 
                    },
                    '100%': { 
                        opacity: '1', 
                        transform: 'translate3d(0, 0, 0)' 
                    },
                },
                shimmer: {
                    '0%': { transform: 'translate3d(-100%, 0, 0)' },
                    '100%': { transform: 'translate3d(100%, 0, 0)' },
                },
                laserScan: {
                    '0%': { top: '4%' },
                    '50%': { top: '92%' },
                    '100%': { top: '4%' },
                },
                subtlePulse: {
                    '0%, 100%': { opacity: '1', transform: 'scale3d(1, 1, 1)' },
                    '50%': { opacity: '0.85', transform: 'scale3d(0.985, 0.985, 1)' },
                },
                badgePop: {
                    '0%': { transform: 'scale3d(0.8, 0.8, 1)', opacity: '0' },
                    '60%': { transform: 'scale3d(1.08, 1.08, 1)' },
                    '100%': { transform: 'scale3d(1, 1, 1)', opacity: '1' },
                }
            },
            animation: {
                fadeIn: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                fadeOut: 'fadeOut 0.15s ease-in forwards',
                'fade-out': 'fadeOut 0.15s ease-in forwards',
                modalEnter: 'modalEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'modal-enter': 'modalEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'zoom-in-95': 'modalEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'zoom-in-50': 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                popoverEnter: 'popoverEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'popover-enter': 'popoverEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                scaleUp: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                slideUp: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-up': 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                slideDown: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-down': 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slideInRight 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-left': 'slideInLeft 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'accordion-down': 'accordionDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                shimmer: 'shimmer 1.8s infinite linear',
                'laser-scan': 'laserScan 2.4s ease-in-out infinite',
                'pulse-subtle': 'subtlePulse 2.5s ease-in-out infinite',
                'badge-pop': 'badgePop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            },
            transitionTimingFunction: {
                'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'smooth-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
            }
        },
    },
    plugins: [],
};
