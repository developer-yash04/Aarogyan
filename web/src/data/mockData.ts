import type { PatientRecord, ClinicalTrialEvent } from "../types/aarogyan";

export const SAMPLE_TRIALS: ClinicalTrialEvent[] = [
  {
    id: "trial-101",
    eventId: 101,
    title: "Phase III Type-2 Diabetes Metabolism Study",
    sponsor: "Apollo Research Institute",
    hospitalPublicKey: "0x04e6c9861619a9d7010f3c64c7ad3f0e8f3a38a7c2fe6ad4771444bfd8c973549fb304e2840cf0e3dff90e54df89f927e1f7c8ec1ab0fa0f55cf6e7a2b972e21e7",
    demographicCriteria: {
      min_age: 18,
      max_age: 65,
      required_sex: 0, // Any sex
      allowed_region_id: "101",
      allowed_country_code: 356, // India (ISO 3166-1 numeric)
    },
    measurementCriteria: {
      max_hba1c_scaled: 650, // HbA1c <= 6.5%
      min_bmi_scaled: 1850,  // BMI >= 18.5
      max_bmi_scaled: 2800,  // BMI <= 28.0
      max_systolic_bp: 135,  // Systolic <= 135 mmHg
      max_diastolic_bp: 88,  // Diastolic <= 88 mmHg
    },
    excludePregnancy: true,
    excludeCancer: true,
  },
  {
    id: "trial-202",
    eventId: 202,
    title: "Cardiovascular Health & Longevity Cohort",
    sponsor: "Max Healthcare Genomic Center",
    hospitalPublicKey: "0x04b89381710fe587399db733055928d712f6a8e52a9203a9f02901dbd35688bca87b649a21b44ecb2f90119b98ecfae06e3e157297eefc404cf7121bbcf02b9f31",
    demographicCriteria: {
      min_age: 30,
      max_age: 70,
      required_sex: 0,
      allowed_region_id: "101",
      allowed_country_code: 356,
    },
    measurementCriteria: {
      max_hba1c_scaled: 600,
      min_bmi_scaled: 1900,
      max_bmi_scaled: 2600,
      max_systolic_bp: 125,
      max_diastolic_bp: 82,
    },
    excludePregnancy: true,
    excludeCancer: true,
  }
];

export const PRESET_PATIENTS: { label: string; eligible: boolean; data: PatientRecord }[] = [
  {
    label: "Eligible Patient (Age 28, Healthy Vitals, HbA1c 5.6%)",
    eligible: true,
    data: {
      id: "patient-eligible-01",
      patientName: "Aarav Sharma",
      demographics: {
        age: 28,
        sex: 1, // Male
        region_id: "101",
        citizenship_code: 356,
      },
      measurements: {
        hba1c_scaled: 560, // 5.6%
        bmi_scaled: 2240,   // 22.4
        systolic_bp: 118,
        diastolic_bp: 78,
      },
      exclusions: {
        is_pregnant: false,
        has_cancer_history: false,
        comorbidity_flags: 0,
      },
      userSecret: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      authoritySignature: "0x3045022100e4c6f...hospital_digital_attestation_apollo",
    },
  },
  {
    label: "Underage Patient (Age 16 - Ineligible)",
    eligible: false,
    data: {
      id: "patient-underage-02",
      patientName: "Rohan V.",
      demographics: {
        age: 16, // Underage
        sex: 1,
        region_id: "101",
        citizenship_code: 356,
      },
      measurements: {
        hba1c_scaled: 540,
        bmi_scaled: 2100,
        systolic_bp: 115,
        diastolic_bp: 75,
      },
      exclusions: {
        is_pregnant: false,
        has_cancer_history: false,
        comorbidity_flags: 0,
      },
      userSecret: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
  },
  {
    label: "High HbA1c Patient (HbA1c 7.8% - Ineligible)",
    eligible: false,
    data: {
      id: "patient-high-hba1c-03",
      patientName: "Sneha Patel",
      demographics: {
        age: 45,
        sex: 2, // Female
        region_id: "101",
        citizenship_code: 356,
      },
      measurements: {
        hba1c_scaled: 780, // Exceeds 6.5% max
        bmi_scaled: 2650,
        systolic_bp: 138,
        diastolic_bp: 89,
      },
      exclusions: {
        is_pregnant: false,
        has_cancer_history: false,
        comorbidity_flags: 0,
      },
      userSecret: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    },
  }
];
