use crate::types::{ClinicalMeasurements, MeasurementCriteria};

pub fn verify_measurements(data: ClinicalMeasurements, criteria: MeasurementCriteria) {
    if criteria.max_hba1c_scaled != 0 {
        assert(data.hba1c_scaled <= criteria.max_hba1c_scaled, "HbA1c exceeds threshold");
    }
    if criteria.max_bmi_scaled != 0 {
        assert(data.bmi_scaled >= criteria.min_bmi_scaled, "BMI below minimum");
        assert(data.bmi_scaled <= criteria.max_bmi_scaled, "BMI exceeds maximum");
    }
    if criteria.max_systolic_bp != 0 {
        assert(data.systolic_bp <= criteria.max_systolic_bp, "Systolic BP too high");
    }
    if criteria.max_diastolic_bp != 0 {
        assert(data.diastolic_bp <= criteria.max_diastolic_bp, "Diastolic BP too high");
    }
}