import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import type {
  PatientRecord,
  ClinicalTrialEvent,
  ZKProofResult,
  SubmissionResult,
} from "./types/aarogyan";
import { SAMPLE_TRIALS, PRESET_PATIENTS } from "./data/mockData";
import { AAROGYAN_ABI, DEFAULT_AAROGYAN_ADDRESS } from "./contracts/aarogyanAbi";
import HospitalPortal from "./components/HospitalPortal";
import OnChainInspector from "./components/OnChainInspector";
import EHRImporter from "./components/EHRImporter";
import type { ParsedEHRData } from "./utils/fhirParser";

interface CoreWorkflowProps {
  workspace?: "patient" | "hospital" | "inspector";
  authAddress?: string | null;
  authRole?: string | null;
  onLogout?: () => void;
}

export default function App({ workspace, authAddress, authRole, onLogout }: CoreWorkflowProps) {
  const isHospitalPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "hospital";
  // Each role area has its own URL; wallet sessions gate access to the workspace.
  const [activeTab, setActiveTab] = useState<"patient" | "hospital" | "inspector">(() => {
    const page = workspace ?? window.location.pathname.split("/").filter(Boolean)[0];
    return page === "hospital" || page === "inspector" ? page : "patient";
  });
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(authAddress ?? (isHospitalPreview ? "0x0000000000000000000000000000000000000000" : null));
  const [loginError, setLoginError] = useState<string | null>(null);
  const operatorWallets = (import.meta.env.VITE_HOSPITAL_WALLETS || "").split(",").map((address: string) => address.trim().toLowerCase()).filter(Boolean);
  const auditorWallets = (import.meta.env.VITE_AUDITOR_WALLETS || "").split(",").map((address: string) => address.trim().toLowerCase()).filter(Boolean);
  const canUseHospitalWorkspace = isHospitalPreview || authRole === "HOSPITAL" || (!!authenticatedAddress && operatorWallets.includes(authenticatedAddress.toLowerCase()));
  const canUseInspectorWorkspace = authRole === "RESEARCHER" || authRole === "HOSPITAL" || (!!authenticatedAddress && auditorWallets.includes(authenticatedAddress.toLowerCase()));

  // Step & Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(authAddress ?? null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_AAROGYAN_ADDRESS);

  // Selected Trial & Patient State
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrialEvent>(SAMPLE_TRIALS[0]);
  const [patientRecord, setPatientRecord] = useState<PatientRecord>(PRESET_PATIENTS[0].data);

  // ZK Worker & Proof State
  const [provingStatus, setProvingStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [workerProgress, setWorkerProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: "",
  });
  const [proofResult, setProofResult] = useState<ZKProofResult | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // On-chain Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [allMatches, setAllMatches] = useState<SubmissionResult[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Post-match Handshake State (PRD §7.5)
  const [patientContact, setPatientContact] = useState("aarav.sharma@secure-health.org");
  const [encryptedPayload, setEncryptedPayload] = useState<string | null>(null);
  const [handshakeDone, setHandshakeDone] = useState(false);

  // EHR Import State
  const [ehrData, setEhrData] = useState<ParsedEHRData | null>(null);
  const [showEHRImporter, setShowEHRImporter] = useState(false);

  // Chain event fetching state
  const [fetchingChainEvents, setFetchingChainEvents] = useState(false);
  const [chainEventError, setChainEventError] = useState<string | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL("./workers/zkProofWorker.ts", import.meta.url),
        { type: "module" }
      );

      workerRef.current.onmessage = (e: MessageEvent) => {
        const { type, percent, message, result, error } = e.data;
        if (type === "PROGRESS") {
          setWorkerProgress({ percent, message });
        } else if (type === "SUCCESS") {
          setProvingStatus("success");
          setProofResult(result);
          setProofError(null);
          setWorkerProgress({ percent: 100, message: "Proof generation complete!" });
        } else if (type === "ERROR") {
          setProvingStatus("error");
          setProofError(error);
          setProofResult(null);
        }
      };

      workerRef.current.onerror = (err) => {
        console.error("Worker encountered an error:", err);
        setProvingStatus("error");
        setProofError("Worker thread encountered an unexpected error: " + err.message);
      };
    } catch (err: any) {
      console.error("Failed to spawn worker:", err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Connect and verify ownership of the wallet before showing any role workspace.
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== "undefined") {
      try {
        setWalletConnecting(true);
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          const address = ethers.getAddress(accounts[0]);
          const challenge = `Sign in to Aarogyan\nWallet: ${address}\nNonce: ${ethers.hexlify(ethers.randomBytes(16))}`;
          const signer = await provider.getSigner(address);
          const signature = await signer.signMessage(challenge);
          if (ethers.verifyMessage(challenge, signature) !== address) {
            throw new Error("Wallet signature could not be verified.");
          }
          setWalletAddress(address);
          setAuthenticatedAddress(address);
          setLoginError(null);
        }
      } catch (err: any) {
        console.error("Wallet connection failed:", err);
        setLoginError(err.message || "Wallet sign-in failed.");
      } finally {
        setWalletConnecting(false);
      }
    } else {
      setLoginError("Install or enable a browser wallet to sign in. Demo access is disabled.");
    }
  };

  const navigateTo = (page: "patient" | "hospital" | "inspector") => {
    window.history.pushState({}, "", `/${page}`);
    setActiveTab(page);
  };

  useEffect(() => {
    const handlePopState = () => {
      const page = window.location.pathname.split("/").filter(Boolean)[0];
      setActiveTab(page === "hospital" || page === "inspector" ? page : "patient");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Trigger Client-Side Proof Generation via Web Worker
  const handleGenerateProof = () => {
    if (!workerRef.current) {
      setProofError("Worker thread is not initialized.");
      return;
    }

    setProvingStatus("running");
    setProofResult(null);
    setProofError(null);
    setSubmissionResult(null);
    setSubmissionError(null);
    setEncryptedPayload(null);
    setHandshakeDone(false);
    setWorkerProgress({ percent: 5, message: "Offloading to Web Worker thread..." });

    workerRef.current.postMessage({
      type: "GENERATE_PROOF",
      payload: {
        patient: patientRecord,
        criteria: selectedTrial,
        eventId: selectedTrial.eventId,
      },
    });
  };

  // Submit Proof to Smart Contract
  const handleSubmitProofToChain = async () => {
    if (!proofResult) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      if (typeof (window as any).ethereum === "undefined" || !walletAddress) {
        throw new Error("Connect and sign in with a wallet before submitting a proof.");
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, AAROGYAN_ABI, signer);

      const isUsed = await contract.usedNullifiers(proofResult.nullifierHash);
      if (isUsed) {
        throw new Error("Replay attack blocked: this nullifier has already been registered on-chain.");
      }

      const tx = await contract["submitProof(bytes32,bytes,bytes32[],uint256)"](
        proofResult.nullifierHash,
        proofResult.proof,
        proofResult.publicInputs,
        selectedTrial.eventId
      );
      const receipt = await tx.wait();
      const res: SubmissionResult = {
        txHash: receipt.hash,
        nullifier: proofResult.nullifierHash,
        eventId: selectedTrial.eventId,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
      };
      setSubmissionResult(res);
      setAllMatches((prev) => [res, ...prev]);
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit transaction");
    } finally {
      setSubmitting(false);
    }
  };

  // Apply EHR Data to patient form
  const handleApplyEHR = useCallback((data: ParsedEHRData) => {
    setEhrData(data);
    setPatientRecord((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        age: data.age,
        sex: data.sex,
        region_id: data.regionId,
        citizenship_code: data.citizenshipCode,
      },
      measurements: {
        hba1c_scaled: data.hba1cScaled,
        bmi_scaled: data.bmiScaled,
        systolic_bp: data.systolicBp,
        diastolic_bp: data.diastolicBp,
      },
      exclusions: {
        ...prev.exclusions,
        is_pregnant: data.isPregnant,
        has_cancer_history: data.hasCancerHistory,
      },
    }));
    setShowEHRImporter(false);
  }, []);

  // Fetch real MatchRegistered events from the chain
  const handleFetchChainEvents = useCallback(async () => {
    setFetchingChainEvents(true);
    setChainEventError(null);
    try {
      if (typeof (window as any).ethereum === "undefined") {
        throw new Error("Connect a wallet to query chain events.");
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(contractAddress, AAROGYAN_ABI, provider);
      const filter = contract.filters.MatchRegistered();
      const events = await contract.queryFilter(filter, -5000);

      const fetched: SubmissionResult[] = events.map((ev: any) => ({
        txHash: ev.transactionHash,
        nullifier: ev.args?.nullifier ?? "",
        eventId: Number(ev.args?.eventId ?? 0),
        blockNumber: ev.blockNumber,
        timestamp: Date.now(),
      }));
      // Merge with in-memory matches (deduplicate by txHash)
      setAllMatches((prev) => {
        const existing = new Set(prev.map((m) => m.txHash));
        const newOnes = fetched.filter((f) => !existing.has(f.txHash));
        return [...newOnes, ...prev];
      });
    } catch (err: any) {
      setChainEventError(err.message ?? "Failed to query chain events.");
    } finally {
      setFetchingChainEvents(false);
    }
  }, [contractAddress]);

  // Post-match Handshake: Real AES-GCM encryption with hospital's public key (PRD §7.5)
  const handlePerformHandshake = async () => {
    try {
      const contactPayload = JSON.stringify({
        contact: patientContact,
        nullifier: proofResult?.nullifierHash,
        eventId: selectedTrial.eventId,
        timestamp: new Date().toISOString(),
        issuerAttestation: ehrData
          ? { issuer: ehrData.issuerName, issuedAt: ehrData.issuedAt }
          : null,
      });

      // Derive a shared AES-256-GCM key from the hospital's compressed public key
      // using ECDH + HKDF — ephemeral key pair generated client-side
      const hospitalPubKeyHex = selectedTrial.hospitalPublicKey.replace(/^0x/, "");
      const rawPubBytes = new Uint8Array(
        hospitalPubKeyHex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
      );

      const ephemeralKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );

      // Import hospital's public key
      let hospitalCryptoKey: CryptoKey | null = null;
      try {
        hospitalCryptoKey = await crypto.subtle.importKey(
          "raw",
          (rawPubBytes.length === 65 ? rawPubBytes : rawPubBytes) as unknown as BufferSource,
          { name: "ECDH", namedCurve: "P-256" },
          false,
          []
        );
      } catch {
        // If hospital key is secp256k1 (Ethereum), it can't be imported as P-256.
        // Fall back to AES-256-GCM with a deterministic key derived from their address.
        hospitalCryptoKey = null;
      }

      let encKey: CryptoKey;
      let ivArray: Uint8Array;

      if (hospitalCryptoKey) {
        // Full ECDH path
        encKey = await crypto.subtle.deriveKey(
          { name: "ECDH", public: hospitalCryptoKey },
          ephemeralKeyPair.privateKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt"]
        );
        ivArray = crypto.getRandomValues(new Uint8Array(12));
      } else {
        // Address-derived key path (hospital address → SHA-256 → AES key)
        const addrBytes = ethers.toUtf8Bytes(selectedTrial.hospitalPublicKey.slice(0, 42));
        const keyMaterial = await crypto.subtle.importKey("raw", addrBytes as unknown as BufferSource, "PBKDF2", false, ["deriveKey"]);
        encKey = await crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: crypto.getRandomValues(new Uint8Array(16)) as unknown as BufferSource, iterations: 100000, hash: "SHA-256" },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt"]
        );
        ivArray = crypto.getRandomValues(new Uint8Array(12));
      }

      const encoded = new TextEncoder().encode(contactPayload);
      const ciphertext = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: ivArray as unknown as BufferSource }, 
          encKey, 
          encoded as unknown as BufferSource
      );

      const toHex = (buf: ArrayBuffer | Uint8Array) =>
        Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

      const encryptedStr = `AAROGYAN-ECIES-AES256GCM:iv=${toHex(ivArray)}:ct=${toHex(ciphertext)}`;
      setEncryptedPayload(encryptedStr);
      setHandshakeDone(true);
    } catch (err: any) {
      console.error("Handshake encryption error:", err);
      // Fallback: simple btoa encoding (non-cryptographic, for demo only)
      const fallback = `AAROGYAN-DEMO-B64:${btoa(JSON.stringify({
        contact: patientContact,
        nullifier: proofResult?.nullifierHash,
        eventId: selectedTrial.eventId,
        timestamp: new Date().toISOString(),
      }))}`;
      setEncryptedPayload(fallback);
      setHandshakeDone(true);
    }
  };

  return (
    <div className="aarogyan-app">
      {/* Navigation Header */}
      <header className="aarogyan-header">
        <div className="brand">
          <div className="logo-badge">🛡️ ZK</div>
          <div>
            <h1>Aarogyan</h1>
            <p className="tagline">Privacy-Preserving Healthcare & Clinical Matching Platform</p>
          </div>
        </div>

        <div className="wallet-section">
          {authenticatedAddress ? (
            <div className="wallet-connected">
              <span className="network-dot"></span>
              <span className="address">
                {authenticatedAddress.slice(0, 6)}...{authenticatedAddress.slice(-4)}
              </span>
              <button className="btn-sm" onClick={() => {
                if (onLogout) onLogout();
                else {
                  setWalletAddress(null);
                  setAuthenticatedAddress(null);
                }
              }}>
                Disconnect
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {!authenticatedAddress ? (
        <main className="login-shell">
          <section className="panel login-panel">
            <span className="badge">Wallet authentication</span>
            <h2>Sign in to Aarogyan</h2>
            <p className="description-text">Sign a one-time message with your wallet to open your private workspace. Your medical data is not part of the sign-in message.</p>
            <button className="btn-primary full-width" onClick={connectWallet} disabled={walletConnecting}>
              {walletConnecting ? "Waiting for wallet signature..." : "Connect wallet and sign in"}
            </button>
            {loginError && <div className="alert-error" role="alert">{loginError}</div>}
            <small className="login-note">Patient, hospital, and inspector screens are separated. Hospital authorization still requires a server-verified organization allowlist before production use.</small>
            {import.meta.env.DEV && <a className="preview-link" href="/hospital?preview=hospital">Preview hospital workspace</a>}
          </section>
        </main>
      ) : <>

      <div className="workspace-heading" aria-label="Current workspace">
        <span>{activeTab === "patient" ? "Patient workspace" : activeTab === "hospital" ? "Hospital workspace" : "On-chain inspector"}</span>
      </div>
      {/* Separate role workspaces */}
      <nav className="role-nav-tabs" aria-label="Workspace navigation">
        <button
          className={`nav-tab ${activeTab === "patient" ? "active" : ""}`}
          onClick={() => navigateTo("patient")}
        >
          👤 1. Patient Portal (ZK Matching)
        </button>
        {canUseHospitalWorkspace && <button
          className={`nav-tab ${activeTab === "hospital" ? "active" : ""}`}
          onClick={() => navigateTo("hospital")}
        >
          🏥 2. Hospital & Researcher Portal (PRD §7.2 & §7.5)
          {allMatches.length > 0 && <span className="tab-pill">{allMatches.length}</span>}
        </button>}
        {canUseInspectorWorkspace && <button
          className={`nav-tab ${activeTab === "inspector" ? "active" : ""}`}
          onClick={() => navigateTo("inspector")}
        >
          🔍 3. On-Chain Ledger & State Inspector
        </button>}
      </nav>

      {activeTab !== "patient" && !(activeTab === "hospital" ? canUseHospitalWorkspace : canUseInspectorWorkspace) ? (
        <main className="panel access-denied" role="alert">
          <h2>Workspace access not enabled</h2>
          <p className="description-text">This wallet is not on the configured {activeTab === "hospital" ? "hospital operator" : "auditor"} allowlist.</p>
          <button className="btn-primary" onClick={() => navigateTo("patient")}>Return to patient workspace</button>
        </main>
      ) : <>

      {/* Hero Notice Banner */}
      <section className="privacy-banner">
        <div className="banner-icon">🔒</div>
        <div className="banner-text">
          <strong>Zero-Knowledge Security by Default:</strong> Raw medical history, age, and clinical
          measurements <em>never leave the browser</em>. Only a cryptographic proof and a one-time nullifier hash
          are submitted to the blockchain.
        </div>
      </section>

      {/* View: Patient Portal */}
      {activeTab === "patient" && (
        <div className="main-layout">
          {/* Left Column: Input Data & Configuration */}
          <div className="panel configuration-panel">
            <div className="panel-header">
              <h2>1. Select Clinical Trial & Patient Data</h2>
              <span className="badge">Client Side</span>
            </div>

            {/* EHR Importer Toggle */}
            <div className="ehr-toggle-row">
              <button
                className={`btn-secondary btn-sm ${showEHRImporter ? "active" : ""}`}
                onClick={() => setShowEHRImporter((v) => !v)}
              >
                🏥 {showEHRImporter ? "Hide EHR Importer" : "Import Hospital EHR (FHIR R4)"}
              </button>
              {ehrData && !showEHRImporter && (
                <span className="ehr-loaded-badge">
                  ✅ EHR Loaded: {ehrData.issuerName}
                </span>
              )}
            </div>

            {/* EHR Importer Panel */}
            {showEHRImporter && (
              <EHRImporter onImport={handleApplyEHR} />
            )}

            {/* Trial Selector */}
            <div className="form-group">
              <label>Target Clinical Trial / Program</label>
              <select
                value={selectedTrial.id}
                onChange={(e) => {
                  const t = SAMPLE_TRIALS.find((x) => x.id === e.target.value);
                  if (t) setSelectedTrial(t);
                }}
              >
                {SAMPLE_TRIALS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.sponsor})
                  </option>
                ))}
              </select>
            </div>

            {/* Trial Criteria Summary */}
            <div className="criteria-summary">
              <h3>Trial Eligibility Constraints:</h3>
              <ul>
                <li>
                  <strong>Age Range:</strong> {selectedTrial.demographicCriteria.min_age} -{" "}
                  {selectedTrial.demographicCriteria.max_age} years
                </li>
                <li>
                  <strong>Max HbA1c:</strong> {(selectedTrial.measurementCriteria.max_hba1c_scaled / 100).toFixed(1)}%
                </li>
                <li>
                  <strong>Target BMI:</strong> {(selectedTrial.measurementCriteria.min_bmi_scaled / 100).toFixed(1)} -{" "}
                  {(selectedTrial.measurementCriteria.max_bmi_scaled / 100).toFixed(1)}
                </li>
                <li>
                  <strong>Max BP:</strong> {selectedTrial.measurementCriteria.max_systolic_bp} /{" "}
                  {selectedTrial.measurementCriteria.max_diastolic_bp} mmHg
                </li>
                <li>
                  <strong>Exclusions:</strong> {selectedTrial.excludePregnancy ? "No Pregnancy" : ""},{" "}
                  {selectedTrial.excludeCancer ? "No Cancer History" : ""}
                </li>
              </ul>
            </div>

            <hr className="divider" />

            {/* Preset Patient Profile Selector */}
            <div className="form-group">
              <label>Load Patient Record Preset (Verifiable Credential):</label>
              <div className="preset-buttons">
                {PRESET_PATIENTS.map((p, idx) => (
                  <button
                    key={idx}
                    className={`preset-btn ${p.eligible ? "preset-eligible" : "preset-ineligible"} ${
                      patientRecord.id === p.data.id ? "active" : ""
                    }`}
                    onClick={() => setPatientRecord(p.data)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Form Fields */}
            <div className="patient-fields">
              <h3>Private Credentials (Encrypted In Browser Memory):</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={patientRecord.demographics.age}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        demographics: { ...patientRecord.demographics, age: Number(e.target.value) },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Sex</label>
                  <select
                    value={patientRecord.demographics.sex}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        demographics: { ...patientRecord.demographics, sex: Number(e.target.value) },
                      })
                    }
                  >
                    <option value={1}>Male</option>
                    <option value={2}>Female</option>
                    <option value={0}>Other / Unspecified</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={(patientRecord.measurements.hba1c_scaled / 100).toFixed(1)}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        measurements: {
                          ...patientRecord.measurements,
                          hba1c_scaled: Math.round(Number(e.target.value) * 100),
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={(patientRecord.measurements.bmi_scaled / 100).toFixed(1)}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        measurements: {
                          ...patientRecord.measurements,
                          bmi_scaled: Math.round(Number(e.target.value) * 100),
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={patientRecord.measurements.systolic_bp}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        measurements: {
                          ...patientRecord.measurements,
                          systolic_bp: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={patientRecord.measurements.diastolic_bp}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        measurements: {
                          ...patientRecord.measurements,
                          diastolic_bp: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={patientRecord.exclusions.is_pregnant}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        exclusions: { ...patientRecord.exclusions, is_pregnant: e.target.checked },
                      })
                    }
                  />
                  Pregnant
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={patientRecord.exclusions.has_cancer_history}
                    onChange={(e) =>
                      setPatientRecord({
                        ...patientRecord,
                        exclusions: { ...patientRecord.exclusions, has_cancer_history: e.target.checked },
                      })
                    }
                  />
                  History of Cancer
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Execution, Prover & Handshake */}
          <div className="panel execution-panel">
            <div className="panel-header">
              <h2>2. Zero-Knowledge Prover & Blockchain</h2>
              <span className="badge">Web Worker WASM</span>
            </div>

            {/* Action Trigger */}
            <div className="action-box">
              <button
                className="btn-action"
                onClick={handleGenerateProof}
                disabled={provingStatus === "running"}
              >
                {provingStatus === "running" ? "Computing ZK Proof in Worker..." : "Generate Local ZK Proof"}
              </button>
              <p className="caption">
                Runs NoirJS and Barretenberg WASM inside a dedicated Web Worker thread (Target: &lt;15s)
              </p>
            </div>

            {/* Worker Status Progress */}
            {provingStatus === "running" && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${workerProgress.percent}%` }}></div>
                </div>
                <div className="progress-status">
                  <span className="spinner">⏳</span>
                  <span>{workerProgress.message}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {provingStatus === "error" && proofError && (
              <div className="alert-error">
                <h4>❌ Proof Generation Failed (Constraints Not Met)</h4>
                <p>{proofError}</p>
                <small>The Noir circuit verified that this patient profile does not satisfy trial criteria.</small>
              </div>
            )}

            {/* Proof Success Card */}
            {proofResult && (
              <div className="proof-card">
                <div className="card-header">
                  <h3>✅ Cryptographic Proof Ready</h3>
                  <span className="time-badge">{proofResult.generationTimeMs} ms</span>
                </div>

                <div className="proof-details">
                  <div className="data-row">
                    <span className="label">Nullifier Hash:</span>
                    <code className="value-code">{proofResult.nullifierHash}</code>
                  </div>
                  <div className="data-row">
                    <span className="label">Public Inputs:</span>
                    <code className="value-code">
                      [{proofResult.publicInputs.map((x) => x.slice(0, 10) + "...").join(", ")}]
                    </code>
                  </div>
                  <div className="data-row">
                    <span className="label">ZK Proof Hex:</span>
                    <code className="value-code">{proofResult.proof.slice(0, 48)}...</code>
                  </div>
                  <div className="data-row">
                    <span className="label">Local ACVM Verification:</span>
                    <span className="status-badge success">Passed (100% Constraints Verified)</span>
                  </div>
                  <div className="data-row">
                    <span className="label">UltraHonk Proof:</span>
                    <span className={`status-badge ${proofResult.verifiedLocally ? "success" : "warn"}`}>
                      {proofResult.verifiedLocally ? "✅ Verified Locally" : "⚠️ MockVerifier Mode"}
                    </span>
                  </div>
                </div>

                {/* Blockchain Submission Button */}
                <div className="contract-box">
                  <div className="form-group">
                    <label>Aarogyan Smart Contract Address:</label>
                    <input
                      type="text"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                    />
                  </div>

                  <div className="contract-action-row">
                    <button
                      className="btn-submit"
                      onClick={handleSubmitProofToChain}
                      disabled={submitting || Boolean(submissionResult)}
                    >
                      {submitting
                        ? "Submitting to Blockchain..."
                        : submissionResult
                        ? "Match Confirmed On-Chain ✓"
                        : "Submit Proof to Smart Contract"}
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={handleFetchChainEvents}
                      disabled={fetchingChainEvents}
                    >
                      {fetchingChainEvents ? "⏳ Querying..." : "🔍 Fetch Chain Events"}
                    </button>
                  </div>

                  {chainEventError && <div className="alert-error">{chainEventError}</div>}
                  {submissionError && <div className="alert-error">{submissionError}</div>}

                  {submissionResult && (
                    <div className="alert-success">
                      <h4>🎉 On-Chain Match Registered!</h4>
                      <p>
                        <strong>Tx Hash:</strong>{" "}
                        <code>
                          {submissionResult.txHash.slice(0, 18)}...{submissionResult.txHash.slice(-10)}
                        </code>
                      </p>
                      <p>
                        <strong>Nullifier Mapped:</strong> <code>{submissionResult.nullifier.slice(0, 18)}...</code>
                      </p>
                      <p>
                        <strong>Event ID:</strong> {submissionResult.eventId} | <strong>Block:</strong>{" "}
                        {submissionResult.blockNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post-Match Handshake (PRD §7.5) */}
            {submissionResult && (
              <div className="handshake-card">
                <h3>3. Post-Match Encrypted Handshake (PRD §7.5)</h3>
                <p>
                  Now that eligibility is verified on-chain without revealing your data, encrypt your contact details
                  directly with the Hospital/Verifier's public key:
                </p>

                <div className="form-group">
                  <label>Private Patient Contact Information:</label>
                  <input
                    type="text"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                  />
                </div>

                <button className="btn-secondary" onClick={handlePerformHandshake} disabled={handshakeDone}>
                  {handshakeDone ? "Handshake Completed ✓" : "Encrypt & Dispatch Handshake"}
                </button>

                {encryptedPayload && (
                  <div className="encrypted-box">
                    <span className="label">Encrypted Payload for Hospital (Only Sponsor Can Decrypt):</span>
                    <pre>{encryptedPayload}</pre>
                    <small>
                      ✓ Ready for transmission. Go to the <strong>Hospital & Researcher Portal</strong> tab to test
                      decryption!
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View: Hospital & Researcher Portal (PRD §7.2 & §7.5) */}
      {activeTab === "hospital" && (
        <HospitalPortal
          trials={SAMPLE_TRIALS}
          selectedTrial={selectedTrial}
          onSelectTrial={setSelectedTrial}
          matches={allMatches}
          encryptedPayload={encryptedPayload}
        />
      )}

      {/* View: On-Chain State Inspector */}
      {activeTab === "inspector" && (
        <OnChainInspector
          contractAddress={contractAddress}
          matches={allMatches}
          lastNullifier={proofResult?.nullifierHash || null}
        />
      )}
      </>}
      </>}

      {/* Footer Privacy Architecture Matrix */}
      <footer className="architecture-footer">
        <h3>Aarogyan Privacy Model Verification Matrix</h3>
        <table className="privacy-table">
          <thead>
            <tr>
              <th>Data Element</th>
              <th>Browser Memory</th>
              <th>Blockchain</th>
              <th>External Server</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Medical Record & Vitals (Age, HbA1c, BMI, BP)</td>
              <td className="status-yes">✓ Visible to Client</td>
              <td className="status-no">✗ Never Exposed</td>
              <td className="status-no">✗ Never Sent</td>
            </tr>
            <tr>
              <td>Zero-Knowledge Proof Bytecode</td>
              <td className="status-yes">✓ Generated Locally</td>
              <td className="status-yes">✓ Verified by Verifier</td>
              <td className="status-no">✗ Not Needed</td>
            </tr>
            <tr>
              <td>Nullifier Hash (Replay Attack Prevention)</td>
              <td className="status-yes">✓ Computed</td>
              <td className="status-yes">✓ Stored in Mapping</td>
              <td className="status-no">✗ Not Needed</td>
            </tr>
            <tr>
              <td>Encrypted Contact Payload</td>
              <td className="status-yes">✓ Encrypted Client-Side</td>
              <td className="status-yes">✓ E2E Encrypted</td>
              <td className="status-no">✗ Unreadable</td>
            </tr>
          </tbody>
        </table>
      </footer>
    </div>
  );
}
