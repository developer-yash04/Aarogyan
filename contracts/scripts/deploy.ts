import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();
    const verifier = await ethers.deployContract("MockVerifier", [true]);
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    const aarogyan = await ethers.deployContract("Aarogyan", [
    verifierAddress
    ]);
    await aarogyan.waitForDeployment();

    console.log("MockVerifier deployed to:", await verifier.getAddress());
    console.log("Aarogyan deployed to:", await aarogyan.getAddress());

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});