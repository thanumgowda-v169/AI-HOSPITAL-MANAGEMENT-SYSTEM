import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODEL_FILE = os.path.join(os.path.dirname(__file__), "noshow_model.joblib")

class NoShowPredictor:
    def __init__(self):
        self.model = None
        self.metrics = {
            "accuracy": 0.842,
            "precision": 0.795,
            "recall": 0.812,
            "f1_score": 0.803,
            "auc_roc": 0.887,
            "records": 2500,
            "model_type": "Random Forest Classifier (100 estimators)"
        }
        self.feature_names = [
            "age", "lead_time_days", "day_of_week", "hour_of_day",
            "department_id", "previous_appointments", "previous_noshows", "noshow_ratio"
        ]
        self._initialize_or_load()

    def _generate_synthetic_training_data(self, n_samples: int = 2500) -> pd.DataFrame:
        np.random.seed(42)
        
        ages = np.random.randint(5, 85, size=n_samples)
        lead_times = np.random.exponential(scale=7, size=n_samples).astype(int)
        lead_times = np.clip(lead_times, 0, 45)
        
        days_of_week = np.random.randint(0, 7, size=n_samples)
        hours_of_day = np.random.choice([9, 10, 11, 12, 14, 15, 16, 17], size=n_samples)
        department_ids = np.random.randint(1, 9, size=n_samples)
        
        prev_appts = np.random.poisson(lam=3, size=n_samples)
        prev_noshows = np.array([
            np.random.binomial(n=max(1, p), p=0.22) if p > 0 else 0
            for p in prev_appts
        ])
        
        noshow_ratio = np.array([
            prev_noshows[i] / prev_appts[i] if prev_appts[i] > 0 else 0.0
            for i in range(n_samples)
        ])

        # Underlying probabilistic risk function
        # Higher lead time, higher past no-show ratio, younger age, Mondays/Fridays have higher no-show risk
        logits = (
            -1.8
            + (lead_times * 0.065)
            + (noshow_ratio * 2.2)
            + (prev_noshows * 0.35)
            - (np.clip(ages, 20, 70) * 0.015)
            + ((days_of_week == 0) * 0.3)   # Monday
            + ((days_of_week == 4) * 0.25)  # Friday
            + ((hours_of_day <= 9) * 0.2)   # Early morning
            + np.random.normal(0, 0.4, size=n_samples)
        )
        
        probabilities = 1 / (1 + np.exp(-logits))
        noshow_labels = (np.random.uniform(0, 1, size=n_samples) < probabilities).astype(int)

        df = pd.DataFrame({
            "age": ages,
            "lead_time_days": lead_times,
            "day_of_week": days_of_week,
            "hour_of_day": hours_of_day,
            "department_id": department_ids,
            "previous_appointments": prev_appts,
            "previous_noshows": prev_noshows,
            "noshow_ratio": noshow_ratio,
            "noshow": noshow_labels
        })
        return df

    def train_model(self):
        df = self._generate_synthetic_training_data()
        X = df[self.feature_names]
        y = df["noshow"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=7,
            min_samples_split=6,
            random_state=42
        )
        rf.fit(X_train, y_train)

        y_pred = rf.predict(X_test)
        y_prob = rf.predict_proba(X_test)[:, 1]

        self.metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 3),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 3),
            "recall": round(float(recall_score(y_test, y_pred)), 3),
            "f1_score": round(float(f1_score(y_test, y_pred)), 3),
            "auc_roc": round(float(roc_auc_score(y_test, y_prob)), 3),
            "records": len(df),
            "model_type": "Random Forest Classifier (100 estimators)"
        }
        self.model = rf

        try:
            joblib.dump({"model": self.model, "metrics": self.metrics}, MODEL_FILE)
        except Exception as e:
            print(f"Could not persist model file: {e}")

    def _initialize_or_load(self):
        if os.path.exists(MODEL_FILE):
            try:
                saved = joblib.load(MODEL_FILE)
                self.model = saved.get("model")
                self.metrics = saved.get("metrics", self.metrics)
                return
            except Exception:
                pass
        self.train_model()

    def predict(
        self,
        age: int,
        lead_time_days: int,
        day_of_week: int,
        hour_of_day: int,
        department_id: int,
        previous_appointments: int = 0,
        previous_noshows: int = 0
    ) -> dict:
        if self.model is None:
            self.train_model()

        noshow_ratio = (
            previous_noshows / previous_appointments
            if previous_appointments > 0 else 0.0
        )

        input_data = pd.DataFrame([{
            "age": age,
            "lead_time_days": lead_time_days,
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "department_id": department_id,
            "previous_appointments": previous_appointments,
            "previous_noshows": previous_noshows,
            "noshow_ratio": noshow_ratio
        }])[self.feature_names]

        prob = float(self.model.predict_proba(input_data)[0][1])
        prob = min(max(prob, 0.03), 0.95)

        # Risk level determination
        if prob < 0.30:
            risk_level = "Low"
            recommendation = "Standard SMS appointment reminder 24 hours prior."
        elif prob < 0.60:
            risk_level = "Medium"
            recommendation = "Send 48h and 24h reminder + phone confirmation prompt."
        else:
            risk_level = "High"
            recommendation = "Reception desk outbound confirmation call recommended. Flag for possible double-booking buffer."

        # Explainable factors
        factors = []
        if lead_time_days >= 7:
            factors.append(f"Extended lead time ({lead_time_days} days) increases attendance uncertainty")
        elif lead_time_days <= 1:
            factors.append(f"Short booking window ({lead_time_days} day) usually indicates urgent need (reduces no-show risk)")

        if previous_noshows > 0:
            factors.append(f"History of {previous_noshows} missed appointment(s) ({int(noshow_ratio * 100)}% prior no-show rate)")
        elif previous_appointments > 3:
            factors.append("Consistent attendance history in previous visits")

        if day_of_week in [0, 4]:
            day_name = "Monday" if day_of_week == 0 else "Friday"
            factors.append(f"Appointments scheduled on {day_name} experience elevated attrition hospital-wide")

        if hour_of_day <= 9:
            factors.append("Early morning slot (9:00 AM) correlates with higher traffic delays")

        if not factors:
            factors.append("Baseline clinical attendance pattern")

        confidence = round(float(max(prob, 1 - prob)), 2)

        return {
            "noshow_risk_score": round(prob, 3),
            "risk_percentage": round(prob * 100, 1),
            "risk_level": risk_level,
            "confidence": confidence,
            "top_contributing_factors": factors[:3],
            "advisory_recommendation": recommendation
        }

noshow_ai = NoShowPredictor()
