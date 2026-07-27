from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "attrition_pipeline.joblib"
MODEL_VERSION = "attrition-v2"

TARGET_COLUMN = "Attrition"

# Features directly available in the IBM HR dataset and meaningful
# for employee attrition prediction.
NUMERIC_FEATURES = [
    "Age",
    "DistanceFromHome",
    "Education",
    "EnvironmentSatisfaction",
    "JobInvolvement",
    "JobLevel",
    "JobSatisfaction",
    "MonthlyIncome",
    "NumCompaniesWorked",
    "PercentSalaryHike",
    "PerformanceRating",
    "RelationshipSatisfaction",
    "StockOptionLevel",
    "TotalWorkingYears",
    "TrainingTimesLastYear",
    "WorkLifeBalance",
    "YearsAtCompany",
    "YearsInCurrentRole",
    "YearsSinceLastPromotion",
    "YearsWithCurrManager",
]

CATEGORICAL_FEATURES = [
    "BusinessTravel",
    "Department",
    "EducationField",
    "Gender",
    "JobRole",
    "MaritalStatus",
    "OverTime",
]

FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Columns intentionally excluded:
# EmployeeNumber -> identifier
# EmployeeCount, Over18, StandardHours -> constant values
# DailyRate, HourlyRate, MonthlyRate -> less interpretable/noisy rate fields

LOW_RISK_THRESHOLD = 0.30
MEDIUM_RISK_THRESHOLD = 0.60

RANDOM_STATE = 42
TEST_SIZE = 0.20