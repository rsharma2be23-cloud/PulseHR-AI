from typing import Literal

import pandas as pd
from pydantic import BaseModel, Field


class EmployeeFeatures(BaseModel):

    Age: int = Field(ge=18, le=100)

    BusinessTravel: Literal[
        "Non-Travel",
        "Travel_Rarely",
        "Travel_Frequently",
    ]

    DailyRate: int = Field(ge=0)

    Department: Literal[
        "Sales",
        "Research & Development",
        "Human Resources",
    ]

    DistanceFromHome: int = Field(ge=1)

    Education: int = Field(ge=1, le=5)

    EducationField: Literal[
        "Life Sciences",
        "Medical",
        "Marketing",
        "Technical Degree",
        "Human Resources",
        "Other",
    ]

    EmployeeCount: int = Field(default=1, ge=1, le=1)

    EmployeeNumber: int = Field(ge=0)

    EnvironmentSatisfaction: int = Field(ge=1, le=4)

    Gender: Literal[
        "Male",
        "Female",
    ]

    HourlyRate: int = Field(ge=0)

    JobInvolvement: int = Field(ge=1, le=4)

    JobLevel: int = Field(ge=1, le=5)

    JobRole: Literal[
        "Sales Executive",
        "Research Scientist",
        "Laboratory Technician",
        "Manufacturing Director",
        "Healthcare Representative",
        "Manager",
        "Sales Representative",
        "Research Director",
        "Human Resources",
    ]

    JobSatisfaction: int = Field(ge=1, le=4)

    MaritalStatus: Literal[
        "Single",
        "Married",
        "Divorced",
    ]

    MonthlyIncome: int = Field(ge=0)

    MonthlyRate: int = Field(ge=0)

    NumCompaniesWorked: int = Field(ge=0)

    Over18: Literal["Y"] = "Y"

    OverTime: Literal[
        "Yes",
        "No",
    ]

    PercentSalaryHike: int = Field(ge=0)

    PerformanceRating: int = Field(ge=1, le=4)

    RelationshipSatisfaction: int = Field(ge=1, le=4)

    StandardHours: int = Field(default=80, ge=80, le=80)

    StockOptionLevel: int = Field(ge=0, le=3)

    TotalWorkingYears: int = Field(ge=0)

    TrainingTimesLastYear: int = Field(ge=0)

    WorkLifeBalance: int = Field(ge=1, le=4)

    YearsAtCompany: int = Field(ge=0)

    YearsInCurrentRole: int = Field(ge=0)

    YearsSinceLastPromotion: int = Field(ge=0)

    YearsWithCurrManager: int = Field(ge=0)

    def to_frame(self) -> pd.DataFrame:
        return pd.DataFrame(
            [self.model_dump()]
        )