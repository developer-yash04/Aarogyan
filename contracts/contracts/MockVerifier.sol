// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockVerifier {

    bool public shouldVerify;

    constructor(bool initialValue) {
        shouldVerify = initialValue;
    }

    function verifyProof() public view returns (bool) {
        return shouldVerify;
    }
}