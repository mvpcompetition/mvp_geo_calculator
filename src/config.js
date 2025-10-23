module.exports = {
    database: {
        host: process.env.DB_HOST || 'mvp-database.c3qrae0mo5vn.eu-north-1.rds.amazonaws.com',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'Bettingexpert2024',
        database: process.env.DB_NAME || 'mvp',
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    google: {
        secretName: process.env.GOOGLE_API_SECRET_NAME || 'mvp-google-maps-api-key',
        region: process.env.AWS_REGION || 'eu-north-1'
    }
};
