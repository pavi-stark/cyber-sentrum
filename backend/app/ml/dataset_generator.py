import os
import json
import csv
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

DATASET_CSV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'identity_dataset.csv')
DATASET_JSON_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'identity_dataset.json')

FEATURE_COLUMNS = [
    'face_cosine_similarity',
    'face_hist_correlation',
    'face_block_distance',
    'ela_mean_discrepancy',
    'ela_variance_anomaly',
    'edge_density_difference',
    'qr_signature_match',
    'ocr_qr_text_similarity',
    'checksum_validity',
    'aspect_ratio_deviation',
    'color_channel_imbalance',
    'laplacian_sharpness_ratio',
    'face_crop_resolution',
    'tamper_localization_score',
    'database_record_match',
    'doc_type_encoded',
    'compression_quality_ratio',
    'liveness_score'
]

CLASS_LABELS = {
    0: 'GENUINE',
    1: 'IMPERSONATION',
    2: 'FORGED_DOCUMENT',
    3: 'SYNTHETIC_DEEPFAKE'
}

def generate_synthetic_identity_dataset(n_samples: int = 1600, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    samples_per_class = n_samples // 4
    records = []

    # ─────────────────────────────────────────────────────────────
    # Class 0: GENUINE IDENTITIES (Valid match, no tampering)
    # ─────────────────────────────────────────────────────────────
    for _ in range(samples_per_class):
        records.append({
            'face_cosine_similarity': np.clip(np.random.normal(0.88, 0.06), 0.72, 0.99),
            'face_hist_correlation': np.clip(np.random.normal(0.85, 0.07), 0.70, 0.98),
            'face_block_distance': np.clip(np.random.normal(0.15, 0.05), 0.02, 0.28),
            'ela_mean_discrepancy': np.clip(np.random.normal(3.8, 1.2), 0.5, 7.0),
            'ela_variance_anomaly': np.clip(np.random.normal(18.5, 6.0), 5.0, 35.0),
            'edge_density_difference': np.clip(np.random.normal(0.04, 0.02), 0.01, 0.09),
            'qr_signature_match': 1.0 if np.random.rand() > 0.03 else 0.0,
            'ocr_qr_text_similarity': np.clip(np.random.normal(0.96, 0.03), 0.88, 1.0),
            'checksum_validity': 1.0 if np.random.rand() > 0.02 else 0.0,
            'aspect_ratio_deviation': np.clip(np.random.normal(0.02, 0.01), 0.00, 0.06),
            'color_channel_imbalance': np.clip(np.random.normal(0.05, 0.02), 0.01, 0.12),
            'laplacian_sharpness_ratio': np.clip(np.random.normal(1.02, 0.10), 0.85, 1.25),
            'face_crop_resolution': np.clip(np.random.normal(0.92, 0.05), 0.80, 1.0),
            'tamper_localization_score': np.clip(np.random.normal(2.5, 1.5), 0.0, 6.0),
            'database_record_match': 1.0 if np.random.rand() > 0.05 else 0.0,
            'doc_type_encoded': np.random.choice([0, 1, 2, 3, 4]),
            'compression_quality_ratio': np.clip(np.random.normal(0.94, 0.04), 0.82, 1.0),
            'liveness_score': np.clip(np.random.normal(0.95, 0.04), 0.82, 1.0),
            'label': 0,
            'label_name': 'GENUINE',
            'fraud_risk_score': np.clip(np.random.normal(4.2, 2.5), 0.0, 12.0)
        })

    # ─────────────────────────────────────────────────────────────
    # Class 1: IMPERSONATION (Selfie mismatch, but document is authentic)
    # ─────────────────────────────────────────────────────────────
    for _ in range(samples_per_class):
        records.append({
            'face_cosine_similarity': np.clip(np.random.normal(0.32, 0.09), 0.10, 0.52),
            'face_hist_correlation': np.clip(np.random.normal(0.38, 0.11), 0.15, 0.58),
            'face_block_distance': np.clip(np.random.normal(0.68, 0.09), 0.48, 0.92),
            'ela_mean_discrepancy': np.clip(np.random.normal(4.2, 1.5), 0.8, 8.0),
            'ela_variance_anomaly': np.clip(np.random.normal(22.0, 8.0), 8.0, 42.0),
            'edge_density_difference': np.clip(np.random.normal(0.06, 0.03), 0.02, 0.14),
            'qr_signature_match': 1.0 if np.random.rand() > 0.08 else 0.0,
            'ocr_qr_text_similarity': np.clip(np.random.normal(0.92, 0.06), 0.78, 1.0),
            'checksum_validity': 1.0 if np.random.rand() > 0.05 else 0.0,
            'aspect_ratio_deviation': np.clip(np.random.normal(0.03, 0.02), 0.01, 0.08),
            'color_channel_imbalance': np.clip(np.random.normal(0.08, 0.04), 0.02, 0.18),
            'laplacian_sharpness_ratio': np.clip(np.random.normal(1.08, 0.15), 0.80, 1.40),
            'face_crop_resolution': np.clip(np.random.normal(0.88, 0.08), 0.70, 1.0),
            'tamper_localization_score': np.clip(np.random.normal(3.5, 2.0), 0.0, 9.0),
            'database_record_match': 1.0 if np.random.rand() > 0.15 else 0.0,
            'doc_type_encoded': np.random.choice([0, 1, 2, 3, 4]),
            'compression_quality_ratio': np.clip(np.random.normal(0.91, 0.06), 0.78, 1.0),
            'liveness_score': np.clip(np.random.normal(0.90, 0.07), 0.75, 1.0),
            'label': 1,
            'label_name': 'IMPERSONATION',
            'fraud_risk_score': np.clip(np.random.normal(82.5, 6.5), 68.0, 98.0)
        })

    # ─────────────────────────────────────────────────────────────
    # Class 2: FORGED / TAMPERED DOCUMENTS (Splicing, altered text/photo)
    # ─────────────────────────────────────────────────────────────
    for _ in range(samples_per_class):
        records.append({
            'face_cosine_similarity': np.clip(np.random.normal(0.55, 0.14), 0.25, 0.82),
            'face_hist_correlation': np.clip(np.random.normal(0.48, 0.13), 0.20, 0.75),
            'face_block_distance': np.clip(np.random.normal(0.52, 0.12), 0.28, 0.78),
            'ela_mean_discrepancy': np.clip(np.random.normal(24.5, 6.8), 12.0, 48.0),
            'ela_variance_anomaly': np.clip(np.random.normal(185.0, 45.0), 95.0, 320.0),
            'edge_density_difference': np.clip(np.random.normal(0.28, 0.08), 0.14, 0.52),
            'qr_signature_match': 0.0 if np.random.rand() > 0.10 else 1.0,
            'ocr_qr_text_similarity': np.clip(np.random.normal(0.35, 0.14), 0.05, 0.65),
            'checksum_validity': 0.0 if np.random.rand() > 0.12 else 1.0,
            'aspect_ratio_deviation': np.clip(np.random.normal(0.18, 0.07), 0.06, 0.40),
            'color_channel_imbalance': np.clip(np.random.normal(0.32, 0.09), 0.15, 0.58),
            'laplacian_sharpness_ratio': np.clip(np.random.normal(2.45, 0.55), 1.45, 4.20),
            'face_crop_resolution': np.clip(np.random.normal(0.62, 0.15), 0.30, 0.90),
            'tamper_localization_score': np.clip(np.random.normal(78.5, 14.0), 45.0, 99.0),
            'database_record_match': 0.0 if np.random.rand() > 0.08 else 1.0,
            'doc_type_encoded': np.random.choice([0, 1, 2, 3, 4]),
            'compression_quality_ratio': np.clip(np.random.normal(0.48, 0.12), 0.20, 0.72),
            'liveness_score': np.clip(np.random.normal(0.72, 0.14), 0.40, 0.95),
            'label': 2,
            'label_name': 'FORGED_DOCUMENT',
            'fraud_risk_score': np.clip(np.random.normal(91.0, 5.0), 78.0, 100.0)
        })

    # ─────────────────────────────────────────────────────────────
    # Class 3: SYNTHETIC / DEEPFAKE / REPLAY ATTACK
    # ─────────────────────────────────────────────────────────────
    for _ in range(samples_per_class):
        records.append({
            'face_cosine_similarity': np.clip(np.random.normal(0.74, 0.12), 0.48, 0.92),
            'face_hist_correlation': np.clip(np.random.normal(0.65, 0.12), 0.38, 0.86),
            'face_block_distance': np.clip(np.random.normal(0.38, 0.09), 0.18, 0.60),
            'ela_mean_discrepancy': np.clip(np.random.normal(16.2, 4.5), 8.0, 30.0),
            'ela_variance_anomaly': np.clip(np.random.normal(110.0, 32.0), 50.0, 210.0),
            'edge_density_difference': np.clip(np.random.normal(0.19, 0.06), 0.08, 0.36),
            'qr_signature_match': 0.0 if np.random.rand() > 0.20 else 1.0,
            'ocr_qr_text_similarity': np.clip(np.random.normal(0.52, 0.16), 0.20, 0.80),
            'checksum_validity': 0.0 if np.random.rand() > 0.25 else 1.0,
            'aspect_ratio_deviation': np.clip(np.random.normal(0.12, 0.05), 0.03, 0.26),
            'color_channel_imbalance': np.clip(np.random.normal(0.24, 0.08), 0.10, 0.45),
            'laplacian_sharpness_ratio': np.clip(np.random.normal(1.80, 0.40), 1.10, 3.10),
            'face_crop_resolution': np.clip(np.random.normal(0.78, 0.11), 0.50, 0.98),
            'tamper_localization_score': np.clip(np.random.normal(62.0, 16.0), 30.0, 92.0),
            'database_record_match': 0.0 if np.random.rand() > 0.15 else 1.0,
            'doc_type_encoded': np.random.choice([0, 1, 2, 3, 4]),
            'compression_quality_ratio': np.clip(np.random.normal(0.60, 0.14), 0.30, 0.85),
            'liveness_score': np.clip(np.random.normal(0.22, 0.08), 0.05, 0.42),  # Severe liveness failure
            'label': 3,
            'label_name': 'SYNTHETIC_DEEPFAKE',
            'fraud_risk_score': np.clip(np.random.normal(88.0, 6.0), 74.0, 99.0)
        })

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df

def save_dataset(df: pd.DataFrame, csv_path: str = DATASET_CSV_PATH, json_path: str = DATASET_JSON_PATH):
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False)
    
    # Summary JSON
    summary = {
        'total_samples': len(df),
        'feature_count': len(FEATURE_COLUMNS),
        'features': FEATURE_COLUMNS,
        'class_distribution': {
            CLASS_LABELS[k]: int(v) for k, v in df['label'].value_counts().to_dict().items()
        },
        'sample_preview': df.head(10).to_dict(orient='records')
    }
    with open(json_path, 'w') as f:
        json.dump(summary, f, indent=2)

if __name__ == '__main__':
    df = generate_synthetic_identity_dataset(n_samples=1600)
    save_dataset(df)
    print(f'Generated {len(df)} samples dataset successfully saved to {DATASET_CSV_PATH}')
