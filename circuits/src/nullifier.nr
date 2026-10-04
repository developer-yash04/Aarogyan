use std::hash::pedersen_hash;

pub fn compute_nullifier(user_secret: Field, event_id: Field) -> Field {
    pedersen_hash([user_secret, event_id])
}

pub fn verify_nullifier(user_secret: Field, event_id: Field, expected_nullifier: Field) {
    let computed_nullifier = pedersen_hash([user_secret, event_id]);
    assert(computed_nullifier == expected_nullifier, "Invalid nullifier hash");
}