require("dotenv").config()

const config = {
    development: {
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db",
        logging: process.env.ENABLE_LOGGING === "true" ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            connectTimeout: 60000,
        },
    },
    production: {
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db",
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            connectTimeout: 60000,
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
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "admin",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "circle_db_test",
        logging: false,
        pool: {
            max: 1,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,
            paranoid: false,
            freezeTableName: true,
        },
        dialectOptions: {
            connectTimeout: 60000,
        },
    },
}

module.exports = config
