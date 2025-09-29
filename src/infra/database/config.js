require("dotenv").config()

const config = {
    development: {
        dialect: "mysql",
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "circle_app_db",
        logging: process.env.ENABLE_LOGGING === "true" ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: false,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            charset: "utf8mb4",
            connectTimeout: 60000,
        },
    },
    production: {
        dialect: "mysql",
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "circle_app_db",
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: false,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timezone: process.env.TIMEZONE || "UTC",
            ssl:
                process.env.DB_SSL === "true"
                    ? {
                          require: true,
                          rejectUnauthorized: false,
                      }
                    : false,
        },
    },
    test: {
        dialect: "mysql",
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USERNAME || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "circle_app_db_test",
        logging: false,
        pool: {
            max: 1,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: false,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            charset: "utf8mb4",
            connectTimeout: 60000,
        },
    },
}

module.exports = config
