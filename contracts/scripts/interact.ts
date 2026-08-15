import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();
    const aarogyanAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const aarogyan = await ethers.getContractAt(
    "Aarogyan",
    aarogyanAddress
);

const nullifier = ethers.id("patient-123");

const isUsed = await aarogyan.usedNullifiers(nullifier);

console.log("Is nullifier used?", isUsed);
const tx = await aarogyan.submitProof(nullifier);
await tx.wait();

const isUsedAfter = await aarogyan.usedNullifiers(nullifier);

console.log("Is nullifier used after submission?", isUsedAfter);

try {
    await aarogyan.submitProof.staticCall(nullifier);
    console.log("ERROR: duplicate was accepted!");
} catch (error) {
    console.log("Second submission rejected: Nullifier already used");
}
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
