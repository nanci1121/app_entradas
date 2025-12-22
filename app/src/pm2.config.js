module.exports = {
    apps: [{
        name: 'Server Entradas',
        script: 'index.js',
        env: {
            PORT: 3000,
            PGUSER: 'vmv',
            PGHOST: '10.192.92.52',
            PGDATABASE: 'firstapi',
            PGPASSWORD: 'vmv',
            PGPORT: 5432,
            JWT_KEY: 'locomia'
        }
    }]
}