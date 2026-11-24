from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Float
from sqlalchemy.sql import func
from app.database import Base

class DailyHospitalStats(Base):
    __tablename__ = "daily_hospital_stats"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    patient_volume = Column(Integer, nullable=False)  # Total outpatient visits
    admissions_count = Column(Integer, default=0)
    discharges_count = Column(Integer, default=0)
    emergency_count = Column(Integer, default=0)
    occupied_beds = Column(Integer, default=0)
    total_beds = Column(Integer, default=50)
    bed_occupancy_rate = Column(Float, default=0.0)  # Percentage 0-100
    scheduled_appointments = Column(Integer, default=0)
    completed_appointments = Column(Integer, default=0)
    noshow_appointments = Column(Integer, default=0)
    medicine_units_dispensed = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

class AIModelMetric(Base):
    __tablename__ = "ai_model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), unique=True, nullable=False)  # NoShow_Classifier, Volume_Forecaster, Bed_Forecaster, Medicine_Forecaster
    model_type = Column(String(100), nullable=False)  # Random Forest Classifier, Exponential Smoothing / Holt-Winters, etc.
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    dataset_records = Column(Integer, default=1000)
    last_trained = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(String(50), default="Operational")
    description = Column(Text, nullable=True)
