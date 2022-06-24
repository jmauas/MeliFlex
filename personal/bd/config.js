import 'dotenv/config';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port : 1433,
    database: process.env.DB_NAME,
    options: {
        instanceName: process.env.DB_INSTANCIA,
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 300000
    }
}

export { config };