import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Hardhat Ignition module for Aarogyan — deploys MockVerifier then Aarogyan
// In production, replace MockVerifier with the real UltraHonk Solidity verifier
// generated via: bb write_vk -b circuit.bytecode && bb write_solidity_verifier
const AarogyanModule = buildModule("AarogyanModule", (m) => {
  // Parameter: set to false in production to require a real proof
  const shouldVerify = m.getParameter("shouldVerify", true);

  const mockVerifier = m.contract("MockVerifier", [shouldVerify]);
  const aarogyan = m.contract("Aarogyan", [mockVerifier]);

  return { mockVerifier, aarogyan };
});

export default AarogyanModule;
