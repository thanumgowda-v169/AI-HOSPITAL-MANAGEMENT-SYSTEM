from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class NoShowPredictionRequest(BaseModel):
    age: int
    gender: str
    lead_time_days: int
    day_of_week: int  # 0=Monday, 6=Sunday
    hour_of_day: int
    department_id: int
    previous_appointments: int = 0
    previous_noshows: int = 0

class NoShowPredictionResponse(BaseModel):
    noshow_risk_score: float  # 0.0 to 1.0
    risk_percentage: float  # 0.0 to 100.0%
    risk_level: str  # Low, Medium, High
    confidence: float
    top_contributing_factors: List[str]
    advisory_recommendation: str

class ForecastPoint(BaseModel):
    date: str
    actual_volume: Optional[float] = None
    predicted_volume: float
    lower_bound: float
    upper_bound: float
    is_forecast: bool

class PatientVolumeForecastResponse(BaseModel):
    metric: str
    history_days: int
    forecast_days: int
    series: List[ForecastPoint]
    model_name: str
    mae: float
    rmse: float
    insights: List[str]

class BedDemandForecastPoint(BaseModel):
    date: str
    actual_occupied: Optional[int] = None
    predicted_demand: int
    available_capacity: int
    occupancy_rate: float
    risk_level: str  # Normal, Tight, Overcapacity Alert
    is_forecast: bool

class BedDemandForecastResponse(BaseModel):
    total_capacity: int
    series: List[BedDemandForecastPoint]
    peak_demand_date: str
    peak_demand_count: int
    recommended_surge_beds: int
    insights: List[str]

class MedicineForecastItem(BaseModel):
    medicine_id: int
    name: str
    category: str
    current_stock: int
    reorder_level: int
    avg_daily_consumption: float
    predicted_consumption_14d: int
    days_until_stockout: int
    stockout_risk: str  # Critical, Warning, Healthy
    suggested_reorder_quantity: int

class MedicineForecastResponse(BaseModel):
    total_tracked: int
    critical_items_count: int
    warning_items_count: int
    items: List[MedicineForecastItem]
    insights: List[str]

class ModelPerformanceSummary(BaseModel):
    model_name: str
    model_type: str
    primary_metric_name: str
    primary_metric_value: float
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    auc_roc: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    dataset_records: int
    last_trained: str
    status: str
    description: str
