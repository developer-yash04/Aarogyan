import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import initACVM from '@noir-lang/acvm_js';
import initNoirC from '@noir-lang/noirc_abi';
import acvm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
import noirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';
import circuit from './circuits.json';

let isInitialized = false;

self.onmessage = async (event: MessageEvent) => {
  try {
    const { inputs } = event.data;
    self.postMessage({ status: 'generating' });

    // Initialize WebAssembly runtimes required for browser proving
    if (!isInitialized) {
      await Promise.all([
        initACVM(fetch(acvm)),
        initNoirC(fetch(noirc))
      ]);
      isInitialized = true;
    }

    const backend = new BarretenbergBackend(circuit as any);
    const noir = new Noir(circuit as any);

    // Execute the circuit with your clinical trial inputs
    const { witness } = await noir.execute(inputs);
    
    // Generate the ZK proof
    const proofPayload = await backend.generateProof(witness);

    self.postMessage({ 
        status: 'success', 
        proof: proofPayload.proof
    });

  } catch (error: any) {
    console.error("CRITICAL WORKER ERROR:", error);
    self.postMessage({ status: 'error', error: error.message || error.toString() });
  }
};