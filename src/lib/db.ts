import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_UID!,
  password: process.env.DB_PWD!,
  options: {
    encrypt: false, // SQL Server 2008 may not support modern TLS
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 60000, // 60 seconds for complex queries
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function query<T = any>(
  queryString: string,
  params?: Record<string, any>
): Promise<sql.IResult<T>> {
  const conn = await getConnection();
  const request = conn.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  return request.query(queryString);
}

export { sql };
