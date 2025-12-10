import { config } from 'dotenv';
import { Client } from 'pg';

config();

async function testConnection() {
  console.log('🔍 Probando conexión a Neon.tech...\n');
  
  const connectionString = process.env.DATABASE_URL;
  console.log('Connection string:', connectionString?.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\n📡 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conexión exitosa!');
    
    // Verificar versión de PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log('\n📊 Versión de PostgreSQL:');
    console.log(versionResult.rows[0].version);
    
    // Listar tablas
    console.log('\n📋 Tablas en la base de datos:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('ℹ️ No hay tablas en la base de datos.');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Contar usuarios si existe la tabla
    try {
      const usersCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`\n👥 Usuarios en la tabla: ${usersCount.rows[0].count}`);
    } catch (error) {
      console.log('ℹ️ La tabla users no existe aún.');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error de conexión:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Detalle:', error.detail);
    
    // Consejos de solución
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que la URL de conexión sea correcta');
    console.log('2. Asegúrate de que la base de datos existe en Neon.tech');
    console.log('3. Verifica las credenciales en el dashboard de Neon');
    console.log('4. Asegúrate de que el proyecto no esté suspendido');
    
  } finally {
    await client.end();
    console.log('\n🔒 Conexión cerrada.');
  }
}

testConnection();