"""
PulseHR AI -- Stage 1 (revised): data audit + leakage-safe, model-aware
preprocessing.
================================================================

Two parts, same separation as before:

1. audit_dataset(df) -- descriptive only. Confirms structural drops hold on
   real data, and shows DailyRate/HourlyRate/MonthlyRate's weak
   full-dataset association WITHOUT using that number to drop them --
   that call is deferred to Stage 2's nested CV (regularization + per-fold
   feature importance), so no target-dependent decision is baked into the
   pipeline before any CV split exists.

2. FeatureEngineer + build_preprocessing_pipeline() -- production
   preprocessing, now with two axes of configuration instead of one fixed
   pipeline:

   a) include_engineered_features: bool
      Stage 2 will fit nested CV on BOTH settings (original-cleaned-only
      vs. original+engineered) and compare PR-AUC/F2 -- engineered
      features are a candidate to test, not an assumption.

   b) model_family: "linear" | "tree_ordinal" | "tree_native_categorical"
      Different candidate models want categorical data in genuinely
      different shapes; forcing one shape on all of them costs real
      accuracy, not just style. See build_preprocessing_pipeline()
      docstring for the reasoning per family.

Run directly to audit a CSV and sanity-check every pipeline combination:
    python preprocessing.py --data /path/to/HR-Employee-Attrition.csv
"""

import argparse

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

TARGET = "Attrition"

# Zero information: every row has the same value. Verified programmatically
# below, not just assumed from the column name. These are simply never
# listed in numeric_cols/categorical_cols below, which is what drops them --
# no separate "drop step" is needed (see FeatureEngineer docstring).
CONSTANT_COLUMNS = ["EmployeeCount", "Over18", "StandardHours"]

# Row identifier, not a feature. Verified programmatically below. Same
# "never selected, so never included" logic as the constant columns.
IDENTIFIER_COLUMNS = ["EmployeeNumber"]

# No natural order -> categorical encoding (which kind depends on
# model_family -- see build_preprocessing_pipeline).
NOMINAL_CATEGORICAL = [
    "BusinessTravel", "Department", "EducationField",
    "Gender", "JobRole", "MaritalStatus", "OverTime",
]

# Already integer-coded Likert-type scales (1-4 / 1-5) in the raw data.
# Treated as ordinal/numeric, NOT categorical-encoded, so the natural
# ordering (e.g. WorkLifeBalance 1 < 2 < 3 < 4) is preserved.
ORDINAL_NUMERIC = [
    "Education", "EnvironmentSatisfaction", "JobInvolvement", "JobLevel",
    "JobSatisfaction", "PerformanceRating", "RelationshipSatisfaction",
    "StockOptionLevel", "WorkLifeBalance",
]

# Continuous numeric fields, including DailyRate/HourlyRate/MonthlyRate --
# kept per the reasoning in the module docstring; Stage 2 decides their fate.
CONTINUOUS_NUMERIC = [
    "Age", "DailyRate", "DistanceFromHome", "HourlyRate", "MonthlyIncome",
    "MonthlyRate", "NumCompaniesWorked", "PercentSalaryHike",
    "TotalWorkingYears", "TrainingTimesLastYear", "YearsAtCompany",
    "YearsInCurrentRole", "YearsSinceLastPromotion", "YearsWithCurrManager",
]

ENGINEERED_NUMERIC = [
    "tenure_ratio", "manager_tenure_ratio",
    "promotion_stagnation_ratio", "income_per_joblevel",
]

MODEL_FAMILIES = ("linear", "tree_ordinal", "tree_native_categorical")


# ---------------------------------------------------------------------------
# Part 1: descriptive audit (exploratory only -- see module docstring)
# ---------------------------------------------------------------------------

def verify_structural_drops(df: pd.DataFrame) -> None:
 
    for col in CONSTANT_COLUMNS:
        n = df[col].nunique()
        assert n == 1, (
            f"Expected '{col}' to be constant but it has {n} unique values "
            f"-- re-check before excluding it."
        )
    for col in IDENTIFIER_COLUMNS:
        n = df[col].nunique()
        assert n == len(df), (
            f"Expected '{col}' to be a unique identifier but it has {n} "
            f"unique values for {len(df)} rows -- re-check before excluding it."
        )
    print("Structural drop assumptions verified against the actual data.\n")


def _cramers_v(confusion_matrix: pd.DataFrame) -> float:
    """Bias-corrected Cramer's V -- association strength between two
    categorical variables. 0 = no association, 1 = perfect association."""
    chi2 = stats.chi2_contingency(confusion_matrix)[0]
    n = confusion_matrix.sum().sum()
    phi2 = chi2 / n
    r, k = confusion_matrix.shape
    phi2corr = max(0, phi2 - ((k - 1) * (r - 1)) / (n - 1))
    rcorr = r - ((r - 1) ** 2) / (n - 1)
    kcorr = k - ((k - 1) ** 2) / (n - 1)
    denom = min((kcorr - 1), (rcorr - 1))
    return float(np.sqrt(phi2corr / denom)) if denom > 0 else 0.0


def _cohens_d(a: pd.Series, b: pd.Series) -> float:
    """Standardized mean difference between two groups. Rule of thumb:
    ~0.2 small, ~0.5 medium, ~0.8 large."""
    n1, n2 = len(a), len(b)
    pooled_var = ((n1 - 1) * a.var(ddof=1) + (n2 - 1) * b.var(ddof=1)) / (n1 + n2 - 2)
    pooled_std = np.sqrt(pooled_var)
    return float((a.mean() - b.mean()) / pooled_std) if pooled_std > 0 else 0.0


def audit_dataset(df: pd.DataFrame) -> pd.DataFrame:
 
    rows = []
    yes = df[df[TARGET] == "Yes"]
    no = df[df[TARGET] == "No"]

    for col in CONTINUOUS_NUMERIC + ORDINAL_NUMERIC:
        d = _cohens_d(yes[col], no[col])
        _, p = stats.mannwhitneyu(yes[col], no[col], alternative="two-sided")
        rows.append({
            "column": col, "kind": "numeric", "n_unique": df[col].nunique(),
            "metric": "cohens_d", "value": round(d, 4), "p_value": round(p, 4),
        })

    for col in NOMINAL_CATEGORICAL:
        ct = pd.crosstab(df[col], df[TARGET])
        v = _cramers_v(ct)
        _, p, _, _ = stats.chi2_contingency(ct)
        rows.append({
            "column": col, "kind": "categorical", "n_unique": df[col].nunique(),
            "metric": "cramers_v", "value": round(v, 4), "p_value": round(p, 4),
        })

    report = pd.DataFrame(rows).sort_values("value", ascending=False, key=abs)
    return report.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Part 2: leakage-safe, model-aware, inference-reusable preprocessing
# ---------------------------------------------------------------------------

class FeatureEngineer(BaseEstimator, TransformerMixin):

    def fit(self, X, y=None):
        self.feature_names_in_ = np.asarray(X.columns, dtype=object)
        return self

    def transform(self, X):
        X = X.copy()

        years_at_company = X["YearsAtCompany"].replace(0, np.nan)

        X["tenure_ratio"] = (
            X["YearsInCurrentRole"] / years_at_company
        )

        X["manager_tenure_ratio"] = (
            X["YearsWithCurrManager"] / years_at_company
        )

        X["promotion_stagnation_ratio"] = (
            X["YearsSinceLastPromotion"] / years_at_company
        )

        X["income_per_joblevel"] = (
            X["MonthlyIncome"] / X["JobLevel"].clip(lower=1)
        )

        return X

    def get_feature_names_out(self, input_features=None):
        if input_features is None:
            input_features = self.feature_names_in_

        return np.asarray(
            list(input_features) + ENGINEERED_NUMERIC,
            dtype=object,
        )


def build_preprocessing_pipeline(
    model_family: str = "linear",
    include_engineered_features: bool = False,
) -> Pipeline:
  
    if model_family not in MODEL_FAMILIES:
        raise ValueError(f"model_family must be one of {MODEL_FAMILIES}, got {model_family!r}")

    numeric_cols = CONTINUOUS_NUMERIC + ORDINAL_NUMERIC
    if include_engineered_features:
        numeric_cols = numeric_cols + ENGINEERED_NUMERIC
    categorical_cols = NOMINAL_CATEGORICAL

    numeric_imputer = SimpleImputer(strategy="median")
    categorical_imputer = SimpleImputer(strategy="most_frequent")

    if model_family == "linear":
        numeric_pipeline = Pipeline([("imputer", numeric_imputer), ("scaler", StandardScaler())])
        categorical_pipeline = Pipeline([
            ("imputer", categorical_imputer),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
    elif model_family == "tree_ordinal":
        numeric_pipeline = Pipeline([("imputer", numeric_imputer)])
        categorical_pipeline = Pipeline([
            ("imputer", categorical_imputer),
            ("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
        ])
    else:  # tree_native_categorical
        numeric_pipeline = Pipeline([("imputer", numeric_imputer)])
        categorical_pipeline = Pipeline([("imputer", categorical_imputer)])

    column_transform = ColumnTransformer([
        ("numeric", numeric_pipeline, numeric_cols),
        ("categorical", categorical_pipeline, categorical_cols),
    ])
    column_transform.set_output(transform="pandas")

    steps = []
    if include_engineered_features:
        steps.append(("feature_engineering", FeatureEngineer()))
    steps.append(("column_transform", column_transform))

    pipeline = Pipeline(steps)
    pipeline.set_output(transform="pandas")
    return pipeline


# ---------------------------------------------------------------------------
# CLI entry point: audit + full pipeline-matrix sanity check
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="PulseHR AI Stage 1 audit")
    parser.add_argument("--data", required=True, help="Path to the IBM HR Attrition CSV")
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    print(f"Loaded {len(df)} rows, {df.shape[1]} columns")
    print(f"Target distribution:\n{df[TARGET].value_counts()}\n")

    verify_structural_drops(df)

    report = audit_dataset(df)
    pd.set_option("display.max_rows", None)
    pd.set_option("display.width", 120)
    print("=== Feature audit, sorted by |effect size| (exploratory only -- see docstring) ===")
    print(report.to_string(index=False))

    print("\n=== DailyRate / HourlyRate / MonthlyRate -- kept in the pipeline either way; Stage 2 decides ===")
    print(report[report["column"].isin(["DailyRate", "HourlyRate", "MonthlyRate"])].to_string(index=False))

    X = df.drop(columns=[TARGET])
    single_employee = X.iloc[[0]]
    zero_tenure_rows = X[X["YearsAtCompany"] == 0]
    print(f"\nRows with YearsAtCompany == 0 in this data: {len(zero_tenure_rows)} "
          f"(these exercise the revised NaN-then-impute ratio path)")

    print("\n=== Pipeline sanity checks: every model_family x feature-set combination ===")
    for model_family in MODEL_FAMILIES:
        for include_engineered in (False, True):
            pipeline = build_preprocessing_pipeline(model_family, include_engineered)
            X_transformed = pipeline.fit_transform(X)
            n_missing = int(X_transformed.isna().sum().sum())
            cat_cols = [c for c in X_transformed.columns if c.startswith("categorical__")]

            single_out = pipeline.transform(single_employee)
            assert list(single_out.columns) == list(X_transformed.columns), (
                f"Column mismatch between full-fit and single-row transform "
                f"for model_family={model_family}, engineered={include_engineered}"
            )
            assert single_out.shape[0] == 1

            label = f"{model_family:<24} engineered={str(include_engineered):<5}"
            print(f"{label} -> shape={X_transformed.shape}, missing_after_impute={n_missing}, "
                  f"categorical_cols_detected={len(cat_cols)}")

    print("\nAll combinations produced consistent, fully-imputed output, with the single-employee "
          "transform schema matching the full-dataset fit schema exactly in every case.")


if __name__ == "__main__":
    main()