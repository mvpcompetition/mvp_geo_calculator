module.exports = {
    database: {
        host: process.env.DB_HOST || 'mvp-admin-cluster.cluster-cxguyyacuvle.eu-west-1.rds.amazonaws.com',
        user: process.env.DB_USER || 'mvpappadmin',
        password: process.env.DB_PASSWORD || 'Ibahdn2007',
        database: process.env.DB_NAME || 'dbMvp',
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    google: {
        secretName: process.env.GOOGLE_API_SECRET_NAME || 'mvp-google-maps-api-key',
        region: 'eu-north-1'
    }
};
