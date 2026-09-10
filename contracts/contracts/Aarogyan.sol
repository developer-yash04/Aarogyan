// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVerifier {
    function verifyProof() external view returns (bool);
}

contract Aarogyan {

    IVerifier public verifier;

    mapping(bytes32 => bool) public usedNullifiers;

    constructor(address verifierAddress) {
        verifier = IVerifier(verifierAddress);
    }

    function submitProof(bytes32 nullifier) public {

        require(
            verifier.verifyProof(),
            "Invalid proof"
        );

        require(
            !usedNullifiers[nullifier],
            "Nullifier already used"
        );

        usedNullifiers[nullifier] = true;
    }
}