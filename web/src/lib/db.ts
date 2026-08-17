import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL çevre değişkeni tanımlı değil.');
}

const pool = new Pool({
  connectionString,
  // Docker container'lar arası ağ geçişlerinde kararlılık için ufak bir bekleme ve sınır ayarı
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
