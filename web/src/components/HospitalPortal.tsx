import { useState } from "react";
import type { ClinicalTrialEvent, SubmissionResult } from "../types/aarogyan";

interface HospitalPortalProps {
  trials: ClinicalTrialEvent[];
  selectedTrial: ClinicalTrialEvent;
  onSelectTrial: (trial: ClinicalTrialEvent) => void;
  matches: SubmissionResult[];
  encryptedPayload: string | null;
}

export default function HospitalPortal({
  trials,
  selectedTrial,
  onSelectTrial,
  matches,
  encryptedPayload,
}: HospitalPortalProps) {
  // Hospital Authority Keys (PRD §7.2 & §7.5)
  const hospitalName = selectedTrial.sponsor;
  const hospitalPublicKey = selectedTrial.hospitalPublicKey;
  const hospitalPrivateKey = "0x8a9b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff0"; // Hospital-held secret key

  // Decryption State
  const [decryptedData, setDecryptedData] = useState<{
    contact: string;
    nullifier: string;
    eventId: number;
    timestamp: string;
  } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // New Credential Issuance Form State (PRD §7.2)
  const [patientName, setPatientName] = useState("Aarav Sharma");
  const [age, setAge] = useState(28);
  const [hba1c, setHba1c] = useState(5.6);
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(78);
  const [issuedCredential, setIssuedCredential] = useState<string | null>(null);

  // Handle Off-chain Decryption of Encrypted Patient Handshake
  const handleDecryptPatientHandshake = () => {
    if (!encryptedPayload) return;
    setIsDecrypting(true);
    setTimeout(() => {
      try {
        // Parse simulated ciphertext (PRD §7.5)
        const base64Data = encryptedPayload.replace("ENC-AES256-GCM:", "");
        const rawJson = atob(base64Data);
        const parsed = JSON.parse(rawJson);
        setDecryptedData(parsed);
      } catch (e) {
        console.error("Failed to decrypt payload:", e);
      } finally {
        setIsDecrypting(false);
      }
    }, 600);
  };

  // Handle Issuance of Signed Lab Attestation
  const handleIssueCredential = () => {
    const payload = {
      issuer: hospitalName,
      issuedAt: new Date().toISOString(),
      patientName,
      vitals: {
        age,
        hba1c_scaled: Math.round(hba1c * 100),
        systolic_bp: systolic,
        diastolic_bp: diastolic,
      },
      // Simulated Hospital Authority Digital Signature
      hospitalSignature:
        "0x" +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("") +
        "1c",
    };
    setIssuedCredential(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="hospital-portal">
      <div className="portal-header">
        <div>
          <h2>🏥 Hospital & Clinical Research Portal</h2>
          <p className="subtitle">
            Authority Attestation Issuance (PRD §7.2) & Post-Match Handshake Decryption (PRD §7.5)
          </p>
        </div>
        <div className="hospital-badge">
          <span className="dot active"></span>
          <span>{hospitalName} (Verified Authority)</span>
        </div>
      </div>

      <div className="main-layout">
        {/* Left Column: Authority Credential Issuer (PRD §7.2) */}
        <div className="panel">
          <div className="panel-header">
            <h3>1. Issue Digitally Signed Health Attestation</h3>
            <span className="badge">Issuer Authority</span>
          </div>
          <p className="description-text">
            Hospitals digitally sign verified diagnostic results. Patients import these signed
            attestations to prove eligibility in Noir circuits without exposing raw medical records.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Patient Full Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Lab HbA1c (%)</label>
              <input
                type="number"
                step="0.1"
                value={hba1c}
                onChange={(e) => setHba1c(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Blood Pressure (mmHg)</label>
              <input
                type="text"
                value={`${systolic}/${diastolic}`}
                onChange={(e) => {
                  const parts = e.target.value.split("/");
                  if (parts[0]) setSystolic(Number(parts[0]));
                  if (parts[1]) setDiastolic(Number(parts[1]));
                }}
              />
            </div>
          </div>

          <div className="key-info-box">
            <span className="label">Signing Authority Key:</span>
            <code>{hospitalPublicKey.slice(0, 24)}... (ECDSA secp256k1)</code>
          </div>

          <button className="btn-primary full-width" onClick={handleIssueCredential}>
            ✍️ Sign & Issue Certified Credential
          </button>

          {issuedCredential && (
            <div className="credential-output">
              <div className="card-header">
                <span className="label">Digitally Signed Attestation JSON:</span>
                <span className="badge success">Authority Signed ✓</span>
              </div>
              <pre>{issuedCredential}</pre>
              <small>✓ Cryptographically signed by {hospitalName}. Ready for patient client-side proof generation.</small>
            </div>
          )}
        </div>

        {/* Right Column: Trial Review & Handshake Decryption (PRD §7.5) */}
        <div className="panel">
          <div className="panel-header">
            <h3>2. Clinical Trial Matches & Decryption Portal</h3>
            <span className="badge">Post-Match Handshake</span>
          </div>

          <div className="form-group">
            <label>Active Clinical Trial</label>
            <select
              value={selectedTrial.id}
              onChange={(e) => {
                const t = trials.find((x) => x.id === e.target.value);
                if (t) onSelectTrial(t);
              }}
            >
              {trials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (Event #{t.eventId})
                </option>
              ))}
            </select>
          </div>

          {/* On-Chain Verified Matches */}
          <div className="matches-section">
            <h4>On-Chain Verified Applicants:</h4>
            {matches.length === 0 ? (
              <div className="empty-state">
                <p>No on-chain matches registered yet for Event #{selectedTrial.eventId}.</p>
                <small>Go to Patient Portal, generate a proof, and submit to blockchain.</small>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map((m, idx) => (
                  <div key={idx} className="match-card">
                    <div className="match-meta">
                      <span className="status-badge success">Verified On-Chain</span>
                      <span className="block-tag">Block #{m.blockNumber}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Nullifier Hash:</span>
                      <code>{m.nullifier.slice(0, 16)}...</code>
                    </div>
                    <div className="data-row">
                      <span className="label">Tx Hash:</span>
                      <code>{m.txHash.slice(0, 14)}...</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Decrypt Handshake Payload */}
          <div className="handshake-review-box">
            <h4>Incoming Encrypted Contact Handshake (PRD §7.5):</h4>
            {encryptedPayload ? (
              <div>
                <p className="description-text">
                  A verified candidate has submitted an encrypted contact payload using your hospital public key:
                </p>
                <div className="encrypted-preview">
                  <code>{encryptedPayload.slice(0, 60)}...</code>
                </div>

                <div className="key-info-box">
                  <span className="label">Decrypt with Hospital Private Key:</span>
                  <code>{hospitalPrivateKey.slice(0, 20)}... (Hospital Enclave)</code>
                </div>

                <button
                  className="btn-action full-width"
                  onClick={handleDecryptPatientHandshake}
                  disabled={isDecrypting}
                >
                  {isDecrypting ? "Decrypting Payload..." : "🔓 Decrypt Patient Contact Information"}
                </button>

                {decryptedData && (
                  <div className="alert-success decrypted-box">
                    <h4>🎉 Decrypted Patient Contact (Off-Chain Only):</h4>
                    <p>
                      <strong>Contact:</strong> <code>{decryptedData.contact}</code>
                    </p>
                    <p>
                      <strong>Matched Nullifier:</strong> <code>{decryptedData.nullifier}</code>
                    </p>
                    <p>
                      <strong>Trial Event ID:</strong> #{decryptedData.eventId}
                    </p>
                    <small>
                      ✓ Verification complete. The hospital can now reach out directly to the candidate
                      without the candidate's medical history ever touching the blockchain.
                    </small>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>No encrypted contact payload received yet.</p>
                <small>Perform Step 3 in the Patient Portal after submitting a proof to send an encrypted handshake.</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
