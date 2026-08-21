import { useState } from 'react';

export function DemographicForm() {
  const [formData, setFormData] = useState({
    // Demographics
    age: '25',
    sex: '1',
    region_id: '4',
    citizenship_code: '12',

    // Demographic Criteria
    min_age: '18',
    max_age: '65',
    required_sex: '1',
    allowed_region_id: '4',
    allowed_country_code: '12',

    // Clinical Measurements
    hba1c_scaled: '600', // e.g. 6.0%
    bmi_scaled: '2200',  // e.g. 22.0
    systolic_bp: '120',
    diastolic_bp: '80',

    // Measurement Criteria
    max_hba1c_scaled: '700',
    min_bmi_scaled: '1500',
    max_bmi_scaled: '3000',
    max_systolic_bp: '140',
    max_diastolic_bp: '90',

    // Exclusions & Nullifier
    exclude_pregnancy: false,
    exclude_cancer: false,
    event_id: '1',
    user_secret: '123456789'
  });
  
  const [isProving, setIsProving] = useState(false);
  const [proofResult, setProofResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleGenerateProof = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProving(true);
    setProofResult(null);

    const worker = new Worker(new URL('./prover.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (event) => {
      const { status, proof, error } = event.data;

      if (status === 'success') {
        console.log("Proof generated successfully!", proof);
        setProofResult(proof);
        setIsProving(false);
        worker.terminate();
      } else if (status === 'error') {
        console.error("Failed to generate proof:", error);
        setIsProving(false);
        worker.terminate();
      }
    };

    // Construct the nested inputs matching main.nr exactly
    worker.postMessage({
      inputs: {
        demographics_data: {
          age: parseInt(formData.age),
          sex: parseInt(formData.sex),
          region_id: formData.region_id,
          citizenship_code: parseInt(formData.citizenship_code)
        },
        measurements_data: {
          hba1c_scaled: parseInt(formData.hba1c_scaled),
          bmi_scaled: parseInt(formData.bmi_scaled),
          systolic_bp: parseInt(formData.systolic_bp),
          diastolic_bp: parseInt(formData.diastolic_bp)
        },
        exclusions_data: {
          has_pregnancy_risk: false,
          has_cancer_history: false
        },
        user_secret: formData.user_secret,
        demographic_criteria: {
          min_age: parseInt(formData.min_age),
          max_age: parseInt(formData.max_age),
          required_sex: parseInt(formData.required_sex),
          allowed_region_id: formData.allowed_region_id,
          allowed_country_code: parseInt(formData.allowed_country_code)
        },
        measurement_criteria: {
          max_hba1c_scaled: parseInt(formData.max_hba1c_scaled),
          min_bmi_scaled: parseInt(formData.min_bmi_scaled),
          max_bmi_scaled: parseInt(formData.max_bmi_scaled),
          max_systolic_bp: parseInt(formData.max_systolic_bp),
          max_diastolic_bp: parseInt(formData.max_diastolic_bp)
        },
        exclude_pregnancy: formData.exclude_pregnancy,
        exclude_cancer: formData.exclude_cancer,
        event_id: formData.event_id,
        expected_nullifier: "0" // Will match circuit evaluation
      }
    });
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #444', borderRadius: '8px', maxWidth: '450px', background: '#181818', color: '#fff' }}>
      <h3>Clinical Trial ZK Verification</h3>
      <form onSubmit={handleGenerateProof} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
        
        <label>Age: <input type="number" name="age" value={formData.age} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>Sex (0/1): <input type="number" name="sex" value={formData.sex} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>Region ID: <input type="number" name="region_id" value={formData.region_id} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>Citizenship Code: <input type="number" name="citizenship_code" value={formData.citizenship_code} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>HbA1c Scaled: <input type="number" name="hba1c_scaled" value={formData.hba1c_scaled} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>BMI Scaled: <input type="number" name="bmi_scaled" value={formData.bmi_scaled} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>Systolic BP: <input type="number" name="systolic_bp" value={formData.systolic_bp} onChange={handleChange} required style={{ float: 'right' }} /></label>
        <label>Diastolic BP: <input type="number" name="diastolic_bp" value={formData.diastolic_bp} onChange={handleChange} required style={{ float: 'right' }} /></label>

        <button type="submit" disabled={isProving} style={{ marginTop: '1rem', padding: '0.7rem', cursor: isProving ? 'wait' : 'pointer', fontWeight: 'bold', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {isProving ? 'Generating Proof (Please wait)...' : 'Generate ZK Proof'}
        </button>
      </form>

      {proofResult && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#222', borderRadius: '4px', wordBreak: 'break-all' }}>
          <p style={{ color: 'lightgreen', margin: 0 }}><strong>Proof Generated! ✅</strong></p>
        </div>
      )}
    </div>
  );
}