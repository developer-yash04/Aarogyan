const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'aarogyan.sqlite'),
  logging: false,
});

const User = sequelize.define('User', {
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false, // 'PATIENT' | 'HOSPITAL' | 'RESEARCHER'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  orgName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  publicKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Credential = sequelize.define('Credential', {
  credentialHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  issuerSignature: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

const Trial = sequelize.define('Trial', {
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  criteriaJson: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

User.hasMany(Credential, { as: 'IssuedCredentials', foreignKey: 'issuerId' });
Credential.belongsTo(User, { as: 'Issuer', foreignKey: 'issuerId' });

User.hasMany(Credential, { as: 'ReceivedCredentials', foreignKey: 'patientId' });
Credential.belongsTo(User, { as: 'Patient', foreignKey: 'patientId' });

User.hasMany(Trial, { foreignKey: 'researcherId' });
Trial.belongsTo(User, { as: 'Researcher', foreignKey: 'researcherId' });

module.exports = { sequelize, User, Credential, Trial };
