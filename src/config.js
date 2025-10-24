module.exports = {
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    google: {
        secretName: process.env.GOOGLE_API_SECRET_NAME || 'mvp-google-maps-api-key',
        region: 'eu-west-1'
    }
};
