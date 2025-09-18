import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
    test: {
        globals: true,
        environment: "happy-dom",
        setupFiles: ["./src/test.setup.ts"],
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: [
            "node_modules",
            "dist",
            ".git",
            ".cache",
            "**/coverage/**",
            "**/.nyc_output/**",
            "**/cypress/**",
            "**/test-results/**",
            "**/playwright-report/**",
            "**/android/**",
            "**/ios/**",
        ],
        testTransformMode: {
            web: [".ts", ".tsx"],
        },
        pool: "forks",
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    define: {
        __DEV__: true,
    },
})
