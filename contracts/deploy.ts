const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ClinicalTrialHandshake contract...");

  const ClinicalTrialHandshake = await ethers.getContractFactory("ClinicalTrialHandshake");
  const handshake = await ClinicalTrialHandshake.deploy("0x0000000000000000000000000000000000000000"); // Pass mock verifier for now

  await handshake.waitForDeployment();
  console.log(`ClinicalTrialHandshake deployed to: ${await handshake.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});