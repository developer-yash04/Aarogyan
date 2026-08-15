use crate::types::Exclusions;

pub fn verify_exclusions(data: Exclusions, exclude_pregnancy: bool, exclude_cancer: bool) {
    if exclude_pregnancy {
        assert(!data.is_pregnant, "Participant excluded due to pregnancy status");
    }
    if exclude_cancer {
        assert(!data.has_cancer_history, "Participant excluded due to cancer history");
    }
}