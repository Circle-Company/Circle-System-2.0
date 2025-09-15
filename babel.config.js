module.exports = function (api) {
    api.cache(true)
    return {
        presets: [],
        plugins: [
            [
                "module-resolver",
                {
                    alias: {
                        "@": "./src",
                    },
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            ],
        ],
    }
}
