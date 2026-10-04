const { sequelize, User, Trial } = require('./db');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('🌱 Database synced and cleared.');

  // Seed Hospital 1 — Apollo Research Institute
  const hospital1 = await User.create({
    walletAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    role: 'HOSPITAL',
    name: 'Dr. Anil Mehta',
    orgName: 'Apollo Research Institute',
    publicKey: '0x04e6c9861619a9d7010f3c64c7ad3f0e8f3a38a7c2fe6ad4771444bfd8c973549fb304e2840cf0e3dff90e54df89f927e1f7c8ec1ab0fa0f55cf6e7a2b972e21e7',
  });

  // Seed Hospital 2 — Max Healthcare
  const hospital2 = await User.create({
    walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    role: 'HOSPITAL',
    name: 'Dr. Priya Singh',
    orgName: 'Max Healthcare Genomic Center',
    publicKey: '0x04b89381710fe587399db733055928d712f6a8e52a9203a9f02901dbd35688bca87b649a21b44ecb2f90119b98ecfae06e3e157297eefc404cf7121bbcf02b9f31',
  });

  // Seed Researcher
  const researcher1 = await User.create({
    walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    role: 'RESEARCHER',
    name: 'Dr. Kavya Reddy',
    orgName: 'Tata Medical Research Foundation',
  });

  // Seed Trial 1
  await Trial.create({
    eventId: 101,
    title: 'Phase III Type-2 Diabetes Metabolism Study',
    description: 'Investigating the efficacy of a novel insulin sensitizer in patients with early-stage T2DM.',
    researcherId: researcher1.id,
    criteriaJson: JSON.stringify({
      min_age: 18, max_age: 65, required_sex: 0,
      max_hba1c_scaled: 650, min_bmi_scaled: 1850, max_bmi_scaled: 2800,
      max_systolic_bp: 135, max_diastolic_bp: 88,
      excludePregnancy: true, excludeCancer: true,
    }),
  });

  // Seed Trial 2
  await Trial.create({
    eventId: 202,
    title: 'Cardiovascular Health & Longevity Cohort',
    description: 'Long-term cohort study tracking cardiovascular outcomes in middle-aged adults.',
    researcherId: researcher1.id,
    criteriaJson: JSON.stringify({
      min_age: 30, max_age: 70, required_sex: 0,
      max_hba1c_scaled: 600, min_bmi_scaled: 1900, max_bmi_scaled: 2600,
      max_systolic_bp: 125, max_diastolic_bp: 82,
      excludePregnancy: true, excludeCancer: true,
    }),
  });

  console.log('✅ Seeded 2 hospitals, 1 researcher, 2 clinical trials.');
}

seed().catch(console.error);
