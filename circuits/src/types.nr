pub struct Demographics {
    pub age: u8,
    pub sex: u8,
    pub region_id: Field,
    pub citizenship_code: u16,
}

pub struct DemographicCriteria {
    pub min_age: u8,
    pub max_age: u8,
    pub required_sex: u8,
    pub allowed_region_id: Field,
    pub allowed_country_code: u16,
}

pub struct ClinicalMeasurements {
    pub hba1c_scaled: u16,   // e.g., 6.5% -> 650 (scaled by 100 for integer arithmetic)
    pub bmi_scaled: u16,     // e.g., 24.2 -> 2420 (scaled by 100)
    pub systolic_bp: u16,
    pub diastolic_bp: u16,
}

pub struct MeasurementCriteria {
    pub max_hba1c_scaled: u16,
    pub min_bmi_scaled: u16,
    pub max_bmi_scaled: u16,
    pub max_systolic_bp: u16,
    pub max_diastolic_bp: u16,
}

pub struct Exclusions {
    pub is_pregnant: bool,
    pub has_cancer_history: bool,
    pub comorbidity_flags: u32, // Bitfield for multi-condition matching
}