/**
 * EHRImporter Component (PRD §8.2 — EHR Integration)
 *
 * Drag-and-drop FHIR R4 Bundle importer. The patient uploads the JSON
 * file exported by their hospital. The component:
 *  1. Parses the FHIR Bundle using our fhirParser utility
 *  2. Verifies the hospital's ECDSA attestation signature
 *  3. Auto-fills the patient form fields for ZK proof generation
 */
import { useState, useCallback, useRef } from "react";
import type { ParsedEHRData, FHIRBundle } from "../utils/fhirParser";
import { parseFHIRBundle, verifyIssuerSignature } from "../utils/fhirParser";

interface EHRImporterProps {
  onImport: (data: ParsedEHRData) => void;
}

type ImportStatus = "idle" | "parsing" | "verifying" | "success" | "error";

export default function EHRImporter({ onImport }: EHRImporterProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedEHRData | null>(null);
  const [sigValidity, setSigValidity] = useState<{ valid: boolean; signer: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setStatus("parsing");
    setErrorMsg("");
    setParsedData(null);
    setSigValidity(null);

    try {
      const text = await file.text();
      const bundle: FHIRBundle = JSON.parse(text);

      const data = parseFHIRBundle(bundle);
      setParsedData(data);

      // Verify hospital attestation signature
      setStatus("verifying");
      const sigResult = await verifyIssuerSignature(data);
      setSigValidity(sigResult);

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Failed to parse EHR file.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleLoadSample = useCallback(async () => {
    try {
      const res = await fetch("/sample-ehr.json");
      const bundle: FHIRBundle = await res.json();
      const file = new File([JSON.stringify(bundle)], "sample-ehr.json", { type: "application/json" });
      processFile(file);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg("Failed to load sample EHR: " + err.message);
    }
  }, [processFile]);

  return (
    <div className="ehr-importer">
      <div className="ehr-importer__header">
        <h3 className="ehr-importer__title">
          <span className="ehr-importer__icon">🏥</span> Import Hospital EHR
        </h3>
        <p className="ehr-importer__subtitle">
          Upload a FHIR R4 Bundle exported by your hospital. Vitals will be auto-filled and the
          hospital&apos;s attestation signature will be verified before proof generation.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`ehr-drop-zone ${isDragging ? "ehr-drop-zone--dragging" : ""} ${
          status === "success" ? "ehr-drop-zone--success" : ""
        } ${status === "error" ? "ehr-drop-zone--error" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
        {status === "idle" && (
          <>
            <div className="ehr-drop-zone__icon">📄</div>
            <div className="ehr-drop-zone__text">
              <strong>Drop your FHIR EHR JSON here</strong>
              <span>or click to browse</span>
            </div>
          </>
        )}
        {(status === "parsing" || status === "verifying") && (
          <div className="ehr-drop-zone__processing">
            <div className="ehr-spinner" />
            <span>{status === "parsing" ? "Parsing FHIR bundle..." : "Verifying hospital signature..."}</span>
          </div>
        )}
        {status === "error" && (
          <div className="ehr-drop-zone__error-msg">
            <span className="ehr-drop-zone__error-icon">⚠️</span>
            <span>{errorMsg}</span>
            <small>Click to try another file</small>
          </div>
        )}
        {status === "success" && parsedData && (
          <div className="ehr-drop-zone__success-summary" onClick={(e) => e.stopPropagation()}>
            <div className="ehr-success-icon">✅</div>
            <div className="ehr-parsed-grid">
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">Issuer</span>
                <span className="ehr-parsed-value">{parsedData.issuerName}</span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">Age</span>
                <span className="ehr-parsed-value">{parsedData.age} years</span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">HbA1c</span>
                <span className="ehr-parsed-value">{(parsedData.hba1cScaled / 100).toFixed(1)} %</span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">BMI</span>
                <span className="ehr-parsed-value">{(parsedData.bmiScaled / 100).toFixed(1)} kg/m²</span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">BP</span>
                <span className="ehr-parsed-value">
                  {parsedData.systolicBp}/{parsedData.diastolicBp} mmHg
                </span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">Pregnant</span>
                <span className="ehr-parsed-value">{parsedData.isPregnant ? "Yes" : "No"}</span>
              </div>
              <div className="ehr-parsed-row">
                <span className="ehr-parsed-label">Cancer Hx</span>
                <span className="ehr-parsed-value">{parsedData.hasCancerHistory ? "Yes" : "No"}</span>
              </div>
            </div>

            {/* Signature verification badge */}
            {sigValidity && (
              <div className={`ehr-sig-badge ${sigValidity.valid ? "ehr-sig-badge--valid" : "ehr-sig-badge--warn"}`}>
                {sigValidity.valid ? (
                  <>
                    <span>🔐 Hospital Signature Verified</span>
                    <code className="ehr-sig-addr">{sigValidity.signer.slice(0, 10)}…</code>
                  </>
                ) : (
                  <>
                    <span>⚠️ Signature Mismatch</span>
                    <small>Recovered: {sigValidity.signer.slice(0, 10)}…</small>
                    <small>Expected: {parsedData.issuerAddress.slice(0, 10)}…</small>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="ehr-importer__actions">
        <button
          className="btn-secondary btn-sm"
          onClick={handleLoadSample}
          disabled={status === "parsing" || status === "verifying"}
        >
          📋 Load Demo EHR
        </button>
        {status === "success" && parsedData && (
          <button
            className="btn-primary btn-sm"
            onClick={() => onImport(parsedData)}
          >
            ↓ Apply to Patient Form
          </button>
        )}
        {(status === "error" || status === "success") && (
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              setStatus("idle");
              setParsedData(null);
              setSigValidity(null);
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Standards badge */}
      <div className="ehr-standards-badge">
        <span>🏷️ HL7 FHIR R4</span>
        <span>·</span>
        <span>LOINC 4548-4 · 39156-5 · 85354-9</span>
        <span>·</span>
        <span>SNOMED CT Conditions</span>
      </div>
    </div>
  );
}
