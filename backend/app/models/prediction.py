from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("acquisition_cases.id"), nullable=False, index=True)
    delay_probability = Column(Numeric(4, 3), nullable=False)
    risk_level = Column(String(20), nullable=False) # Low, Medium, High
    predicted_delay_days = Column(Integer, nullable=False)
    model_version = Column(String(40), default="v1.0.0-rf")
    trigger_reason = Column(String(100), default="Scheduled / Manual Recalculation")
    prediction_time = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("AcquisitionCase", back_populates="predictions")
    factors = relationship("PredictionFactor", back_populates="prediction", cascade="all, delete-orphan")


class PredictionFactor(Base):
    __tablename__ = "prediction_factors"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id"), nullable=False, index=True)
    factor_name = Column(String(100), nullable=False)
    impact_score = Column(Numeric(5, 3), nullable=False)
    direction = Column(String(20), nullable=False) # increases_risk, decreases_risk
    description = Column(Text, nullable=True)

    # Relationships
    prediction = relationship("RiskPrediction", back_populates="factors")
