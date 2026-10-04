// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUltraVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

contract Aarogyan {
    IUltraVerifier public immutable verifier;

    // Mapping to prevent double-spending and replay attacks (PRD §7.4 & §13)
    mapping(bytes32 => bool) public usedNullifiers;

    // Event emitted when an eligibility match is successfully verified on-chain (PRD §7.5)
    event MatchRegistered(
        address indexed user,
        bytes32 indexed nullifier,
        uint256 indexed eventId,
        uint256 timestamp
    );

    constructor(address verifierAddress) {
        require(verifierAddress != address(0), "Invalid verifier address");
        verifier = IUltraVerifier(verifierAddress);
    }

    /// @notice Submit a zero-knowledge proof for a clinical trial or health match
    /// @param nullifier Unique cryptographic nullifier hash derived from user secret and event ID
    /// @param proof The zero-knowledge proof generated client-side
    /// @param publicInputs The public inputs verified by the ZK circuit
    /// @param eventId The trial or event identifier
    function submitProof(
        bytes32 nullifier,
        bytes calldata proof,
        bytes32[] calldata publicInputs,
        uint256 eventId
    ) public returns (bool) {
        require(!usedNullifiers[nullifier], "Nullifier already used");

        // Validate Public Inputs Structure
        require(publicInputs.length >= 4, "Invalid public inputs");
        
        bool isValid = verifier.verify(proof, publicInputs);
        require(isValid, "Invalid proof");

        usedNullifiers[nullifier] = true;

        emit MatchRegistered(msg.sender, nullifier, eventId, block.timestamp);
        return true;
    }
}