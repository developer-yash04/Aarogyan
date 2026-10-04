export interface Demographics {
  age: number;
  sex: number; // 0: unspecified/any, 1: male, 2: female, 3: other
  region_id: string;
  citizenship_code: number;
}

export interface DemographicCriteria {
  min_age: number;
  max_age: number;
  required_sex: number;
  allowed_region_id: string;
  allowed_country_code: number;
}

export interface ClinicalMeasurements {
  hba1c_scaled: number; // scaled by 100, e.g. 5.7% -> 570
  bmi_scaled: number;   // scaled by 100, e.g. 22.4 -> 2240
  systolic_bp: number;  // mmHg
  diastolic_bp: number; // mmHg
}

export interface MeasurementCriteria {
  max_hba1c_scaled: number;
  min_bmi_scaled: number;
  max_bmi_scaled: number;
  max_systolic_bp: number;
  max_diastolic_bp: number;
}

export interface Exclusions {
  is_pregnant: boolean;
  has_cancer_history: boolean;
  comorbidity_flags: number;
}

export interface PatientRecord {
  id: string;
  patientName: string; // Stored locally only, never revealed
  demographics: Demographics;
  measurements: ClinicalMeasurements;
  exclusions: Exclusions;
  userSecret: string; // Hex seed used to generate the nullifier
  authoritySignature?: string; // Digital attestation from issuer
}

export interface ClinicalTrialEvent {
  id: string;
  eventId: number;
  title: string;
  sponsor: string;
  hospitalPublicKey: string;
  demographicCriteria: DemographicCriteria;
  measurementCriteria: MeasurementCriteria;
  excludePregnancy: boolean;
  excludeCancer: boolean;
}

export interface ZKProofResult {
  proof: string;
  nullifierHash: string;
  publicInputs: string[];
  generationTimeMs: number;
  verifiedLocally: boolean;
}

export interface SubmissionResult {
  txHash: string;
  nullifier: string;
  eventId: number;
  blockNumber: number;
  timestamp: number;
}
