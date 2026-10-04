import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const { ethers } = await network.connect();
    const networkName = network.name ?? "hardhatMainnet";

    console.log(`\n🚀 Deploying Aarogyan contracts to network: ${networkName}`);
    console.log("─".repeat(60));

    // 1. Deploy UltraVerifier
    console.log("\n📋 Deploying UltraVerifier...");
    const verifier = await ethers.deployContract("UltraVerifier", []);
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`   ✅ UltraVerifier deployed: ${verifierAddress}`);

    // 2. Deploy Aarogyan with verifier address
    console.log("\n📋 Deploying Aarogyan...");
    const aarogyan = await ethers.deployContract("Aarogyan", [verifierAddress]);
    await aarogyan.waitForDeployment();
    const aarogyanAddress = await aarogyan.getAddress();
    console.log(`   ✅ Aarogyan deployed:     ${aarogyanAddress}`);

    // 3. Write addresses to deployments.json for frontend
    const deployments = {
        network: networkName,
        deployedAt: new Date().toISOString(),
        contracts: {
            MockVerifier: verifierAddress,
            Aarogyan: aarogyanAddress,
        },
    };

    const deploymentsPath = path.join(__dirname, "..", "deployments.json");
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

    // Also write to web/src/contracts for auto-pickup by frontend
    const webDeploymentsPath = path.join(
        __dirname, "..", "..", "web", "src", "contracts", "deployments.json"
    );
    fs.writeFileSync(webDeploymentsPath, JSON.stringify(deployments, null, 2));

    console.log("\n" + "─".repeat(60));
    console.log("🎉 Deployment complete!");
    console.log(`   MockVerifier : ${verifierAddress}`);
    console.log(`   Aarogyan     : ${aarogyanAddress}`);
    console.log("─".repeat(60) + "\n");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
});