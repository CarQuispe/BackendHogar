import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // 1. Crear sedes
  const sedePrincipal = await prisma.sede.upsert({
    where: { name: 'Casa de Acogida Principal' },
    update: {},
    create: {
      name: 'Casa de Acogida Principal',
      type: 'CASA_ACOGIDA',
      address: 'Av. Principal 123',
      comuna: 'Santiago',
      region: 'Metropolitana',
      phone: '+56 2 2345 6789',
      maxCapacity: 30,
      currentCapacity: 0,
    },
  });

  const sedeNorte = await prisma.sede.upsert({
    where: { name: 'Centro de Día Norte' },
    update: {},
    create: {
      name: 'Centro de Día Norte',
      type: 'CENTRO_DIA',
      address: 'Calle Norte 456',
      comuna: 'Providencia',
      region: 'Metropolitana',
      phone: '+56 2 9876 5432',
      maxCapacity: 25,
      currentCapacity: 0,
    },
  });

  console.log('🏠 Sedes creadas:', sedePrincipal.name, sedeNorte.name);

  // 2. Hash para contraseñas
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const directorPassword = await bcrypt.hash('Directora123!', salt);

  // 3. Crear usuarios
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@casadeacogida.cl' },
    update: {},
    create: {
      email: 'admin@casadeacogida.cl',
      passwordHash: adminPassword,
      name: 'Administrador',
      lastName: 'Sistema',
      rut: '12345678-9',
      phone: '+56 9 8765 4321',
      role: 'ADMIN',
      sedeId: sedePrincipal.id,
    },
  });

  const directorUser = await prisma.user.upsert({
    where: { email: 'directora@casadeacogida.cl' },
    update: {},
    create: {
      email: 'directora@casadeacogida.cl',
      passwordHash: directorPassword,
      name: 'María',
      lastName: 'González',
      rut: '98765432-1',
      phone: '+56 9 1234 5678',
      role: 'DIRECTORA',
      sedeId: sedePrincipal.id,
    },
  });

  const psychologistUser = await prisma.user.upsert({
    where: { email: 'psicologa@casadeacogida.cl' },
    update: {},
    create: {
      email: 'psicologa@casadeacogida.cl',
      passwordHash: directorPassword,
      name: 'Ana',
      lastName: 'Martínez',
      rut: '87654321-2',
      phone: '+56 9 2345 6789',
      role: 'PSICOLOGA',
      sedeId: sedePrincipal.id,
    },
  });

  console.log('👥 Usuarios creados:', adminUser.email, directorUser.email);

  // 4. Crear residentes de ejemplo
  const resident1 = await prisma.resident.create({
    data: {
      rut: '11222333-4',
      firstName: 'Juan',
      lastName: 'Pérez',
      birthDate: new Date('1990-05-15'),
      gender: 'MASCULINO',
      phone: '+56 9 5555 4444',
      admissionDate: new Date('2024-01-15'),
      admissionReason: 'Situación de calle',
      status: 'ACTIVO',
      sedeId: sedePrincipal.id,
      responsibleId: directorUser.id,
      createdById: directorUser.id,
    },
  });

  const resident2 = await prisma.resident.create({
    data: {
      rut: '22333444-5',
      firstName: 'María',
      lastName: 'López',
      birthDate: new Date('1985-08-22'),
      gender: 'FEMENINO',
      phone: '+56 9 6666 7777',
      admissionDate: new Date('2024-02-10'),
      admissionReason: 'Violencia intrafamiliar',
      status: 'ACTIVO',
      sedeId: sedePrincipal.id,
      responsibleId: directorUser.id,
      createdById: directorUser.id,
    },
  });

  console.log('👤 Residentes creados:', resident1.firstName, resident2.firstName);

  // 5. Crear contactos de emergencia
  await prisma.contact.create({
    data: {
      residentId: resident1.id,
      name: 'Carlos Pérez',
      relationship: 'Hermano',
      phone: '+56 9 8888 9999',
      isEmergencyContact: true,
      notes: 'Contacto principal',
    },
  });

  // 6. Crear nota psicológica de ejemplo
  await prisma.psychologicalNote.create({
    data: {
      residentId: resident1.id,
      psychologistId: psychologistUser.id,
      sessionDate: new Date('2024-12-01'),
      sessionType: 'INDIVIDUAL',
      content: 'Primera sesión de evaluación. Paciente muestra signos de ansiedad moderada.',
      diagnosis: 'Trastorno de ansiedad',
      recommendations: 'Sesiones semanales y ejercicios de respiración',
      nextSession: new Date('2024-12-08'),
    },
  });

  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });