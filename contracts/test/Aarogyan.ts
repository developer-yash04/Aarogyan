import { expect } from "chai";
import { network } from "hardhat";

describe("Aarogyan", function () {

    it("should accept a valid proof and store the nullifier", async function () {

        const { ethers } = await network.connect();

        // Deploy MockVerifier
        const MockVerifier =
            await ethers.deployContract("MockVerifier", [true]);

        // Deploy Aarogyan
        const aarogyan =
            await ethers.deployContract("Aarogyan", [
                await MockVerifier.getAddress()
            ]);

        // Create a test nullifier
        const nullifier = ethers.id("patient-123");

        // Submit the proof
        await aarogyan.submitProof(nullifier);

        // Check that the nullifier was stored
        expect(
            await aarogyan.usedNullifiers(nullifier)
        ).to.equal(true);
    });

    it("should reject a duplicate nullifier", async function () {

    const { ethers } = await network.connect();

    const MockVerifier =
        await ethers.deployContract("MockVerifier", [true]);

    const aarogyan =
        await ethers.deployContract("Aarogyan", [
            await MockVerifier.getAddress()
        ]);

    const nullifier = ethers.id("patient-123");

    // First submission should succeed
    await aarogyan.submitProof(nullifier);

    // Second submission should fail
    await expect(
        aarogyan.submitProof(nullifier)
    ).to.be.revertedWith("Nullifier already used");
});

    

});