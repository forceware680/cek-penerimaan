
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_UID,
  password: process.env.DB_PWD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function checkColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM AsetMaster90.INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ObjekPersediaanPLU'
        `);
        console.log('Columns in AsetMaster90.dbo.ObjekPersediaanPLU:');
        result.recordset.forEach(col => {
            console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''}) NULL:${col.IS_NULLABLE}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking columns:', error);
        process.exit(1);
    }
}

checkColumns();
