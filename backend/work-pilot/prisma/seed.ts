import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// ✅ Vérification que DATABASE_URL existe
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquant dans .env');
  process.exit(1);
}

// ✅ Création du driver adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const EMAIL = 'nmarsouel@gmail.com';
  const MOT_DE_PASSE = 'Admin123!';

  console.log('Hashage du mot de passe...');
  const motDePasseHache = await bcrypt.hash(MOT_DE_PASSE, 12);

  console.log('Création / mise à jour du super admin...');
  const superAdmin = await prisma.utilisateur.upsert({
    where: { email: EMAIL },
    update: {
      roleGlobal: 'admin',
      statut: 'actif',
    },
    create: {
      nom: 'Ngouadjio',
      prenom: 'Marsouel',
      email: EMAIL,
      motDePasse: motDePasseHache,
      roleGlobal: 'admin',
      statut: 'actif',
    },
  });

  console.log('Super admin créé / mis à jour :');
  console.log(`Email : ${superAdmin.email}`);
  console.log(`Rôle  : ${superAdmin.roleGlobal}`);
  console.log(`MDP   : ${MOT_DE_PASSE}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
