import { expect } from "chai";
import { network } from "hardhat";

describe("Aarogyan Smart Contract", function () {
    async function deployFixture() {
        const { ethers } = await network.connect();
        const verifier = await ethers.deployContract("UltraVerifier");
        const aarogyan = await ethers.deployContract("Aarogyan", [
            await verifier.getAddress()
        ]);
        const [owner, otherAccount] = await ethers.getSigners();
        return { ethers, verifier, aarogyan, owner, otherAccount };
    }

    it("should accept a valid full proof and emit MatchRegistered event", async function () {
        const { aarogyan, owner } = await deployFixture();

        const nullifier = "0x" + "11".repeat(32);
        // Minimum 256 bytes for mock valid proof
        const proof = "0x" + "aa".repeat(256);
        
        // 4 Public inputs: Event ID, Nullifier, Min Age, Max Age
        const eventIdRaw = "0x" + "00".repeat(31) + "65"; // 101 in hex
        const publicInputs = [
            eventIdRaw,
            nullifier,
            "0x" + "00".repeat(31) + "12",
            "0x" + "00".repeat(31) + "41"
        ];
        const eventId = 101n;

        const tx = await aarogyan.submitProof(nullifier, proof, publicInputs, eventId);
        await expect(tx)
            .to.emit(aarogyan, "MatchRegistered")
            .withArgs(owner.address, nullifier, eventId, (timestamp: any) => timestamp > 0);

        expect(await aarogyan.usedNullifiers(nullifier)).to.equal(true);
    });

    it("should reject duplicate nullifier with full proof (replay attack prevention)", async function () {
        const { aarogyan } = await deployFixture();

        const nullifier = "0x" + "33".repeat(32);
        const proof = "0x" + "aa".repeat(256);
        const eventIdRaw = "0x" + "00".repeat(31) + "65";
        const publicInputs = [
            eventIdRaw,
            nullifier,
            "0x" + "00".repeat(31) + "12",
            "0x" + "00".repeat(31) + "41"
        ];
        const eventId = 101n;

        await aarogyan.submitProof(nullifier, proof, publicInputs, eventId);

        await expect(
            aarogyan.submitProof(nullifier, proof, publicInputs, eventId)
        ).to.be.revertedWith("Nullifier already used");
    });

    it("should reject invalid proof structure (too short) from verifier", async function () {
        const { aarogyan } = await deployFixture();

        const nullifier = "0x" + "55".repeat(32);
        const proof = "0xbaad"; // Too short
        const eventIdRaw = "0x" + "00".repeat(31) + "65";
        const publicInputs = [
            eventIdRaw,
            nullifier,
            "0x" + "00".repeat(31) + "12",
            "0x" + "00".repeat(31) + "41"
        ];
        const eventId = 101n;

        await expect(
            aarogyan.submitProof(nullifier, proof, publicInputs, eventId)
        ).to.be.revertedWith("UltraVerifier: INVALID_PROOF_LENGTH");
    });
    
    it("should reject invalid public inputs structure (wrong length)", async function () {
        const { aarogyan } = await deployFixture();

        const nullifier = "0x" + "55".repeat(32);
        const proof = "0x" + "aa".repeat(256);
        const publicInputs = [
            "0x" + "00".repeat(31) + "65"
        ]; // Too short
        const eventId = 101n;

        await expect(
            aarogyan.submitProof(nullifier, proof, publicInputs, eventId)
        ).to.be.revertedWith("Invalid public inputs");
    });
});