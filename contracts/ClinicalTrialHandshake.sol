// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}

contract ClinicalTrialHandshake {
    IVerifier public immutable verifier;
    
    // Mapping to track used nullifiers and prevent double-registration (Sybil resistance)
    mapping(bytes32 => bool) public nullifiers;

    event ParticipantRegistered(bytes32 indexed nullifier);

    constructor(address _verifierAddress) {
        verifier = IVerifier(_verifierAddress);
    }

    function registerPatient(
        bytes calldata proof, 
        bytes32[] calldata publicInputs, 
        bytes32 nullifier
    ) external {
        // 1. Ensure this nullifier hasn't been used yet (Post-Match Handshake protection)
        require(!nullifiers[nullifier], "Patient already registered for this trial!");

        // 2. Verify the Zero-Knowledge proof on-chain
        bool isValid = verifier.verify(proof, publicInputs);
        require(isValid, "Invalid ZK Proof: Criteria not met!");

        // 3. Mark nullifier as used
        nullifiers[nullifier] = true;

        emit ParticipantRegistered(nullifier);
    }
}