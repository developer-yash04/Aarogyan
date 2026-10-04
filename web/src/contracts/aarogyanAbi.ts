export const AAROGYAN_ABI = [
  "function submitProof(bytes32 nullifier, bytes calldata proof, bytes32[] calldata publicInputs, uint256 eventId) public returns (bool)",
  "function submitProof(bytes32 nullifier) public returns (bool)",
  "function usedNullifiers(bytes32 nullifier) public view returns (bool)",
  "event MatchRegistered(address indexed user, bytes32 indexed nullifier, uint256 indexed eventId, uint256 timestamp)"
];

// Default local / testnet contract address (configurable in UI)
export const DEFAULT_AAROGYAN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
