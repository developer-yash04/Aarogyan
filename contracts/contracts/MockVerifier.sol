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

    function verify(bytes calldata /* proof */, bytes32[] calldata /* publicInputs */) external view returns (bool) {
        return shouldVerify;
    }

    function setShouldVerify(bool _val) external {
        shouldVerify = _val;
    }
}