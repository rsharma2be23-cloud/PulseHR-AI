# PulseHR Attrition ML Service

## Setup

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Train

```bash
python -m src.train --data data/sample_attrition.csv
```

The sample CSV is structural testing data only. It does not establish real model quality.

Required CSV columns: `age`, `salary`, `tenure_years`, `months_since_last_promotion`, `absence_rate`, `overtime_hours`, `performance_rating`, `job_satisfaction`, `work_life_balance`, `career_growth`, `manager_support`, `compensation_satisfaction`, and `attrition` (0 or 1).

## Run and test

```bash
uvicorn src.main:app --reload
```

Open `http://127.0.0.1:8000/health`. After training, send a feature payload to `POST /predict`. Risk thresholds are low `< 0.30`, medium `< 0.60`, and high `>= 0.60`.
