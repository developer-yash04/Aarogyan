use crate::types::{Demographics, DemographicCriteria};

pub fn verify_demographics(data: Demographics, criteria: DemographicCriteria) {
    assert(data.age >= criteria.min_age, "Age below minimum requirement");
    assert(data.age <= criteria.max_age, "Age exceeds maximum limit");

    if criteria.required_sex != 0 {
        assert(data.sex == criteria.required_sex, "Biological sex mismatch");
    }
    if criteria.allowed_region_id != 0 {
        assert(data.region_id == criteria.allowed_region_id, "Region mismatch");
    }
    if criteria.allowed_country_code != 0 {
        assert(data.citizenship_code == criteria.allowed_country_code, "Citizenship mismatch");
    }
}