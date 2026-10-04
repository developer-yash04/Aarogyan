/**
 * Aarogyan ZK Proof Worker (PRD §7.3, §10)
 *
 * Runs inside a dedicated Web Worker thread so the main React thread
 * stays responsive during proving. Generates a real UltraHonk proof
 * via Barretenberg WASM and returns the proof + nullifier for on-chain
 * submission.
 *
 * Requires COOP/COEP headers (set in vite.config.ts) for SharedArrayBuffer.
 */
import { Noir } from "@noir-lang/noir_js";
import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import circuitData from "../circuits/aarogyan.json";

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type !== "GENERATE_PROOF") return;

  const startTime = performance.now();

  const post = (msg: object) => self.postMessage(msg);

  try {
    const { patient, criteria, eventId } = payload;

    // ─── Stage 1: Init Noir ACVM ────────────────────────────────────────────
    post({ type: "PROGRESS", percent: 10, message: "Initializing Noir ACVM engine..." });

    const noir = new Noir(circuitData as any);

    // ─── Stage 2: Build circuit inputs ─────────────────────────────────────
    post({ type: "PROGRESS", percent: 20, message: "Preparing patient credential inputs..." });

    const circuitInputs = {
      demographics_data: {
        age: Number(patient.demographics.age),
        sex: Number(patient.demographics.sex),
        region_id: String(patient.demographics.region_id),
        citizenship_code: Number(patient.demographics.citizenship_code),
      },
      demographic_criteria: {
        min_age: Number(criteria.demographicCriteria.min_age),
        max_age: Number(criteria.demographicCriteria.max_age),
        required_sex: Number(criteria.demographicCriteria.required_sex),
        allowed_region_id: String(criteria.demographicCriteria.allowed_region_id),
        allowed_country_code: Number(criteria.demographicCriteria.allowed_country_code),
      },
      measurements_data: {
        hba1c_scaled: Number(patient.measurements.hba1c_scaled),
        bmi_scaled: Number(patient.measurements.bmi_scaled),
        systolic_bp: Number(patient.measurements.systolic_bp),
        diastolic_bp: Number(patient.measurements.diastolic_bp),
      },
      measurement_criteria: {
        max_hba1c_scaled: Number(criteria.measurementCriteria.max_hba1c_scaled),
        min_bmi_scaled: Number(criteria.measurementCriteria.min_bmi_scaled),
        max_bmi_scaled: Number(criteria.measurementCriteria.max_bmi_scaled),
        max_systolic_bp: Number(criteria.measurementCriteria.max_systolic_bp),
        max_diastolic_bp: Number(criteria.measurementCriteria.max_diastolic_bp),
      },
      exclusions_data: {
        is_pregnant: Boolean(patient.exclusions.is_pregnant),
        has_cancer_history: Boolean(patient.exclusions.has_cancer_history),
        comorbidity_flags: Number(patient.exclusions.comorbidity_flags || 0),
      },
      exclude_pregnancy: Boolean(criteria.excludePregnancy),
      exclude_cancer: Boolean(criteria.excludeCancer),
      user_secret: patient.userSecret,
      event_id: eventId,
    };

    // ─── Stage 3: Execute circuit — constraint check + witness + nullifier ──
    post({ type: "PROGRESS", percent: 35, message: "Executing ZK circuit & checking eligibility constraints..." });

    let witness: Uint8Array;
    let nullifierHash: string;

    try {
      const { witness: w, returnValue } = await noir.execute(circuitInputs);
      witness = w;
      nullifierHash = typeof returnValue === "string"
        ? (returnValue.startsWith("0x") ? returnValue : "0x" + returnValue)
        : "0x" + BigInt(returnValue as any).toString(16).padStart(64, "0");
    } catch (execErr: any) {
      // Circuit constraint failure — patient does not meet eligibility criteria
      throw new Error(execErr.message ?? "Circuit execution failed: eligibility constraints not satisfied.");
    }

    // ─── Stage 4: Initialise Barretenberg WASM prover ───────────────────────
    post({ type: "PROGRESS", percent: 50, message: "Initialising Barretenberg WASM prover (this may take ~10 s)..." });

    let proofBytes: string;
    let publicInputs: string[];
    let verifiedLocally = false;

    try {
      // In browser workers, Barretenberg.new() auto-selects WasmWorker backend
      const api = await Barretenberg.new({ threads: 4 });
      const backend = new UltraHonkBackend((circuitData as any).bytecode, api);

      // ─── Stage 5: Generate UltraHonk proof ───────────────────────────────
      post({ type: "PROGRESS", percent: 65, message: "Generating UltraHonk cryptographic proof..." });

      const proofData = await backend.generateProof(witness);

      // ─── Stage 6: Local verification ──────────────────────────────────────
      post({ type: "PROGRESS", percent: 85, message: "Verifying proof locally before submission..." });

      verifiedLocally = await backend.verifyProof(proofData);

      // Encode proof as hex string for Solidity calldata
      proofBytes = "0x" + Array.from(proofData.proof)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Public inputs as 32-byte hex strings for bytes32[] parameter
      publicInputs = proofData.publicInputs.map((pi: string) =>
        pi.startsWith("0x") ? pi : "0x" + pi.padStart(64, "0")
      );

      await api.destroy();

    } catch (proverErr: any) {
      // Barretenberg WASM not available or proof failed
      console.error("[ZK Worker] Barretenberg WASM proof generation failed:", proverErr);
      throw new Error("Cryptographic proof generation failed: " + (proverErr.message || "Unknown prover error"));
    }

    const generationTimeMs = Math.round(performance.now() - startTime);

    post({ type: "PROGRESS", percent: 100, message: "Proof generation complete!" });

    post({
      type: "SUCCESS",
      result: {
        proof: proofBytes,
        nullifierHash,
        publicInputs,
        generationTimeMs,
        verifiedLocally,
      },
    });

  } catch (error: any) {
    console.error("[ZK Worker] Fatal error:", error);
    post({
      type: "ERROR",
      error: error.message ?? "Unknown error during ZK proof generation.",
    });
  }
};
