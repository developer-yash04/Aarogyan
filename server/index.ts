const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Trial, Credential } = require('./db');

const app = express();

app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'aarogyan-dev-secret-do-not-use-in-production';

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Authenticate JWT
// ─────────────────────────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
    }
    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Routes (SIWE — Sign In with Ethereum)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/auth/nonce', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `Sign in to Aarogyan\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
  res.json({ message, nonce });
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { message, signature, address } = req.body;
    if (!message || !signature || !address) {
      return res.status(400).json({ error: 'message, signature, and address are required' });
    }

    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    let user = await User.findOne({ where: { walletAddress: address.toLowerCase() } });

    if (!user) {
      user = await User.create({
        walletAddress: address.toLowerCase(),
        role: 'PATIENT',
        name: `Patient ${address.slice(0, 6)}`,
      });
    }

    const token = jwt.sign(
      { id: user.id, address: user.walletAddress, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token, role: user.role, name: user.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, address: user.walletAddress, role: user.role, name: user.name, orgName: user.orgName });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trials Routes
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/trials', async (req, res) => {
  const trials = await Trial.findAll({
    where: { isActive: true },
    include: [{ model: User, as: 'Researcher', attributes: ['name', 'orgName'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(trials.map(t => {
    const data = t.toJSON();
    data.criteria = JSON.parse(data.criteriaJson);
    return data;
  }));
});

app.post('/api/trials', authenticate, requireRole('RESEARCHER'), async (req, res) => {
  try {
    const { eventId, title, description, criteria } = req.body;
    const trial = await Trial.create({
      eventId,
      title,
      description,
      researcherId: req.user.id,
      criteriaJson: JSON.stringify(criteria),
    });
    res.json({ success: true, trial });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Hospital Routes
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/hospital/issue-credential', authenticate, requireRole('HOSPITAL'), async (req, res) => {
  try {
    const { patientWalletAddress, healthData } = req.body;

    if (!patientWalletAddress || !healthData) {
      return res.status(400).json({ error: 'patientWalletAddress and healthData are required' });
    }

    let patient = await User.findOne({ where: { walletAddress: patientWalletAddress.toLowerCase() } });
    if (!patient) {
      patient = await User.create({
        walletAddress: patientWalletAddress.toLowerCase(),
        role: 'PATIENT',
        name: `Patient ${patientWalletAddress.slice(0, 6)}`,
      });
    }

    const issuer = await User.findByPk(req.user.id);

    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    const credentialBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: issuedAt,
      _aarogyanAttestation: {
        version: '1.0',
        issuerWallet: issuer.walletAddress,
        issuerOrg: issuer.orgName,
        issuerPublicKey: issuer.publicKey,
        patientWallet: patient.walletAddress,
        issuedAt,
        expiresAt,
      },
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            birthDate: healthData.birthDate,
            gender: healthData.sex === 1 ? 'male' : healthData.sex === 2 ? 'female' : 'unknown',
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: { coding: [{ system: 'http://loinc.org', code: '4548-4', display: 'Hemoglobin A1c' }] },
            valueQuantity: { value: healthData.hba1cScaled / 100, unit: '%' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: { coding: [{ system: 'http://loinc.org', code: '39156-5', display: 'Body mass index' }] },
            valueQuantity: { value: healthData.bmiScaled / 100, unit: 'kg/m2' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
            component: [
              { code: { coding: [{ code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: healthData.systolicBp, unit: 'mmHg' } },
              { code: { coding: [{ code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: healthData.diastolicBp, unit: 'mmHg' } },
            ],
          },
        },
      ],
    };

    const HOSPITAL_TEST_PRIVATE_KEYS = {
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    };

    const privKey = HOSPITAL_TEST_PRIVATE_KEYS[issuer.walletAddress];
    let issuerSignature = 'UNSIGNED_DEV_MODE';
    if (privKey) {
      const wallet = new ethers.Wallet(privKey);
      const canonicalMessage = JSON.stringify(credentialBundle.entry) + issuedAt + patient.walletAddress;
      issuerSignature = await wallet.signMessage(canonicalMessage);
    }

    credentialBundle._aarogyanAttestation.issuerSignature = issuerSignature;

    const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credentialBundle)));
    await Credential.create({
      issuerId: issuer.id,
      patientId: patient.id,
      credentialHash,
      issuerSignature,
      expiresAt: new Date(expiresAt),
    });

    res.json({
      success: true,
      credentialBundle,
      fileName: `aarogyan-credential-${patient.walletAddress.slice(0, 8)}-${Date.now()}.json`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hospital/decrypt', authenticate, requireRole('HOSPITAL'), async (req, res) => {
  try {
    const { encryptedPayload } = req.body;
    if (!encryptedPayload) return res.status(400).json({ error: 'encryptedPayload is required' });

    res.json({
      success: true,
      message: 'Contact decryption successful (demo mode)',
      contact: {
        note: 'In full ECIES, the patient ephemeral pub key must be prepended to the ciphertext.',
        payload: encryptedPayload.slice(0, 80) + '...',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Aarogyan API Server running on http://localhost:${PORT}`);
  console.log(`   Database: SQLite via Sequelize`);
});
