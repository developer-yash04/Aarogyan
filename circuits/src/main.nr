mod types;
mod demographics;
mod measurements;
mod exclusions;
mod nullifier;

use types::{Demographics, DemographicCriteria, ClinicalMeasurements, MeasurementCriteria, Exclusions};

fn main(
    // Private Inputs (Patient records)
    demographics_data: Demographics,
    measurements_data: ClinicalMeasurements,
    exclusions_data: Exclusions,
    user_secret: Field,

    // Public Inputs (Trial parameters & verification targets)
    demographic_criteria: pub DemographicCriteria,
    measurement_criteria: pub MeasurementCriteria,
    exclude_pregnancy: pub bool,
    exclude_cancer: pub bool,
    event_id: pub Field
) -> pub Field {
    demographics::verify_demographics(demographics_data, demographic_criteria);
    measurements::verify_measurements(measurements_data, measurement_criteria);
    exclusions::verify_exclusions(exclusions_data, exclude_pregnancy, exclude_cancer);
    nullifier::compute_nullifier(user_secret, event_id)
}

#[test]
fn test_valid_patient_eligibility() {
    let demo = Demographics { age: 25, sex: 1, region_id: 101, citizenship_code: 356 };
    let demo_crit = DemographicCriteria { min_age: 18, max_age: 65, required_sex: 0, allowed_region_id: 101, allowed_country_code: 356 };
    
    let meas = ClinicalMeasurements { hba1c_scaled: 550, bmi_scaled: 2200, systolic_bp: 120, diastolic_bp: 80 };
    let meas_crit = MeasurementCriteria { max_hba1c_scaled: 650, min_bmi_scaled: 1800, max_bmi_scaled: 2500, max_systolic_bp: 130, max_diastolic_bp: 85 };
    
    let excl = Exclusions { is_pregnant: false, has_cancer_history: false, comorbidity_flags: 0 };
    
    let secret: Field = 12345;
    let event: Field = 1;

    let null = main(demo, meas, excl, secret, demo_crit, meas_crit, true, true, event);
    assert(null != 0);
}

#[test(should_fail_with = "Age below minimum requirement")]
fn test_underage_patient_fails() {
    let demo = Demographics { age: 16, sex: 1, region_id: 101, citizenship_code: 356 };
    let demo_crit = DemographicCriteria { min_age: 18, max_age: 65, required_sex: 0, allowed_region_id: 101, allowed_country_code: 356 };
    
    let meas = ClinicalMeasurements { hba1c_scaled: 550, bmi_scaled: 2200, systolic_bp: 120, diastolic_bp: 80 };
    let meas_crit = MeasurementCriteria { max_hba1c_scaled: 650, min_bmi_scaled: 1800, max_bmi_scaled: 2500, max_systolic_bp: 130, max_diastolic_bp: 85 };
    
    let excl = Exclusions { is_pregnant: false, has_cancer_history: false, comorbidity_flags: 0 };
    
    let secret: Field = 12345;
    let event: Field = 1;

    let _null = main(demo, meas, excl, secret, demo_crit, meas_crit, true, true, event);
}