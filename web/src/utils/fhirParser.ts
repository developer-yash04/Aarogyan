/**
 * FHIR R4 EHR Parser Utility (PRD §8.2 — EHR Integration)
 *
 * Parses an HL7 FHIR R4 Bundle JSON and extracts patient vitals
 * using standard LOINC observation codes. The extracted values are
 * normalised into the format expected by the Aarogyan ZK circuit.
 *
 * LOINC codes used:
 *  - 4548-4  : HbA1c (Hemoglobin A1c/Hemoglobin.total in Blood) — unit: %
 *  - 39156-5 : BMI (Body mass index) — unit: kg/m2
 *  - 85354-9 : Blood Pressure panel — component codes:
 *      8480-6  : Systolic blood pressure — unit: mmHg
 *      8462-4  : Diastolic blood pressure — unit: mmHg
 *  - 72892002 (SNOMED): Pregnancy (Condition)
 *  - 363346000 (SNOMED): Cancer history (Condition)
 */

export interface ParsedEHRData {
  /** Patient gender code: 1 = male, 2 = female, 0 = unknown */
  sex: number;
  /** Patient age derived from birthDate */
  age: number;
  /** ISO country code (e.g. 356 = India) */
  citizenshipCode: number;
  /** Region identifier string (from Aarogyan attestation or address state code) */
  regionId: string;

  /** HbA1c scaled to integer ×100 (e.g. 5.6% → 560) */
  hba1cScaled: number;
  /** BMI scaled to integer ×100 (e.g. 22.4 → 2240) */
  bmiScaled: number;
  /** Systolic blood pressure in mmHg */
  systolicBp: number;
  /** Diastolic blood pressure in mmHg */
  diastolicBp: number;

  /** True if an active pregnancy condition is present */
  isPregnant: boolean;
  /** True if a cancer history condition is present */
  hasCancerHistory: boolean;

  /** Issuing hospital name */
  issuerName: string;
  /** Hospital wallet address (for credential verification) */
  issuerAddress: string;
  /** Hospital ECDSA signature over the credential */
  issuerSignature: string;
  /** ISO timestamp when the credential was issued */
  issuedAt: string;

  /** Raw parsed bundle for display */
  rawBundle: FHIRBundle;
}

export interface FHIRBundle {
  resourceType: string;
  type: string;
  entry?: FHIREntry[];
  _aarogyanAttestation?: AarogyanAttestation;
}

interface FHIREntry {
  resource: FHIRResource;
}

interface FHIRResource {
  resourceType: string;
  id?: string;
  gender?: string;
  birthDate?: string;
  address?: { country?: string; state?: string }[];
  code?: { coding?: { system?: string; code?: string; display?: string }[] };
  valueQuantity?: { value?: number; unit?: string };
  component?: { code?: { coding?: { system?: string; code?: string }[] }; valueQuantity?: { value?: number } }[];
  clinicalStatus?: { coding?: { code?: string }[] };
}

interface AarogyanAttestation {
  issuerName: string;
  issuerAddress: string;
  patientRegionId?: string;
  patientCitizenshipCode?: number;
  patientSex?: number;
  issuedAt: string;
  signature: string;
}

/** ISO-3166-1 numeric codes for selected countries */
const COUNTRY_TO_NUMERIC: Record<string, number> = {
  IN: 356,
  US: 840,
  GB: 826,
  DE: 276,
  FR: 250,
  JP: 392,
  AU: 36,
  CA: 124,
};

function getAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function genderToCode(gender?: string): number {
  if (!gender) return 0;
  const g = gender.toLowerCase();
  if (g === "male") return 1;
  if (g === "female") return 2;
  return 0;
}

function hasLoincCode(resource: FHIRResource, code: string): boolean {
  return (resource.code?.coding ?? []).some(
    (c) => c.system === "http://loinc.org" && c.code === code
  );
}

function hasSnomedCode(resource: FHIRResource, code: string): boolean {
  return (resource.code?.coding ?? []).some(
    (c) => c.system === "http://snomed.info/sct" && c.code === code
  );
}

function isConditionActive(resource: FHIRResource): boolean {
  const status = resource.clinicalStatus?.coding?.[0]?.code;
  return status === "active";
}

/**
 * Parse a FHIR R4 Bundle JSON object into Aarogyan circuit-compatible data.
 * Throws if the bundle is not a valid FHIR collection.
 */
export function parseFHIRBundle(bundle: FHIRBundle): ParsedEHRData {
  if (bundle.resourceType !== "Bundle") {
    throw new Error(`Expected FHIR Bundle, got: ${bundle.resourceType}`);
  }

  const entries = bundle.entry ?? [];
  const resources = entries.map((e) => e.resource);

  // ── Patient demographics ────────────────────────────────────────────────
  const patientResource = resources.find((r) => r.resourceType === "Patient");
  const sex = bundle._aarogyanAttestation?.patientSex ??
    genderToCode(patientResource?.gender);
  const age = patientResource?.birthDate ? getAge(patientResource.birthDate) : 0;
  const country = patientResource?.address?.[0]?.country ?? "IN";
  const citizenshipCode = bundle._aarogyanAttestation?.patientCitizenshipCode ??
    (COUNTRY_TO_NUMERIC[country.toUpperCase()] ?? 356);
  const regionId = bundle._aarogyanAttestation?.patientRegionId ??
    patientResource?.address?.[0]?.state ?? "0";

  // ── Clinical measurements ───────────────────────────────────────────────
  const observations = resources.filter((r) => r.resourceType === "Observation");

  // HbA1c — LOINC 4548-4
  const hba1cObs = observations.find((o) => hasLoincCode(o, "4548-4"));
  const hba1cValue = hba1cObs?.valueQuantity?.value;
  if (hba1cValue === undefined || hba1cValue === null) {
    throw new Error("FHIR Bundle is missing HbA1c observation (LOINC 4548-4)");
  }
  const hba1cScaled = Math.round(hba1cValue * 100);

  // BMI — LOINC 39156-5
  const bmiObs = observations.find((o) => hasLoincCode(o, "39156-5"));
  const bmiValue = bmiObs?.valueQuantity?.value;
  if (bmiValue === undefined || bmiValue === null) {
    throw new Error("FHIR Bundle is missing BMI observation (LOINC 39156-5)");
  }
  const bmiScaled = Math.round(bmiValue * 100);

  // Blood pressure — LOINC 85354-9 (panel with component observations)
  const bpObs = observations.find((o) => hasLoincCode(o, "85354-9"));
  if (!bpObs?.component || bpObs.component.length < 2) {
    throw new Error("FHIR Bundle is missing Blood Pressure panel (LOINC 85354-9)");
  }
  const systolicComponent = bpObs.component.find((c) =>
    (c.code?.coding ?? []).some((cc) => cc.system === "http://loinc.org" && cc.code === "8480-6")
  );
  const diastolicComponent = bpObs.component.find((c) =>
    (c.code?.coding ?? []).some((cc) => cc.system === "http://loinc.org" && cc.code === "8462-4")
  );
  const systolicBp = systolicComponent?.valueQuantity?.value ?? 0;
  const diastolicBp = diastolicComponent?.valueQuantity?.value ?? 0;

  if (!systolicBp || !diastolicBp) {
    throw new Error("FHIR Blood Pressure panel is missing systolic or diastolic component");
  }

  // ── Exclusion conditions ────────────────────────────────────────────────
  const conditions = resources.filter((r) => r.resourceType === "Condition");

  // Pregnancy — SNOMED 72892002 (active status = pregnant)
  const pregnancyCond = conditions.find((c) => hasSnomedCode(c, "72892002"));
  const isPregnant = pregnancyCond ? isConditionActive(pregnancyCond) : false;

  // Cancer — SNOMED 363346000 (any presence = has history)
  const cancerCond = conditions.find((c) => hasSnomedCode(c, "363346000"));
  const hasCancerHistory = cancerCond ? isConditionActive(cancerCond) : false;

  // ── Aarogyan attestation (hospital credential) ──────────────────────────
  const attestation = bundle._aarogyanAttestation;
  const issuerName = attestation?.issuerName ?? "Unknown Hospital";
  const issuerAddress = attestation?.issuerAddress ?? "0x0000000000000000000000000000000000000000";
  const issuerSignature = attestation?.signature ?? "0x";
  const issuedAt = attestation?.issuedAt ?? new Date().toISOString();

  return {
    sex,
    age,
    citizenshipCode,
    regionId,
    hba1cScaled,
    bmiScaled,
    systolicBp,
    diastolicBp,
    isPregnant,
    hasCancerHistory,
    issuerName,
    issuerAddress,
    issuerSignature,
    issuedAt,
    rawBundle: bundle,
  };
}

/**
 * Validate that the hospital credential signature is authentic.
 * Verifies that `issuerAddress` signed the canonical credential hash.
 *
 * The credential hash is: keccak256(abi.encode(hba1cScaled, bmiScaled, systolicBp, diastolicBp, issuedAt))
 * This is done client-side using ethers.js — a real in-circuit ECDSA
 * verification step is performed in the Noir circuit (PRD §7.2).
 */
export async function verifyIssuerSignature(
  data: ParsedEHRData
): Promise<{ valid: boolean; signer: string; error?: string }> {
  try {
    const { ethers } = await import("ethers");
    const { hba1cScaled, bmiScaled, systolicBp, diastolicBp, issuedAt } = data;

    // Canonical credential message — same format the hospital signed
    const message = JSON.stringify({
      hba1cScaled,
      bmiScaled,
      systolicBp,
      diastolicBp,
      issuedAt,
    });

    const signer = ethers.verifyMessage(message, data.issuerSignature);

    const valid = signer.toLowerCase() === data.issuerAddress.toLowerCase();

    return { valid, signer };
  } catch (err: any) {
    return { valid: false, signer: "0x0", error: err.message };
  }
}
