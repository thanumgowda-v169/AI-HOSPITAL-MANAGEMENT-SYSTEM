from fastapi.testclient import TestClient
from app.main import app

def test_system():
    with TestClient(app) as client:
        print("--- 1. Testing Root and Health ---")
        res = client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("Root OK:", res.json())

        res = client.get("/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        print("Health OK:", res.json())

        print("\n--- 2. Testing Authentication ---")
        login_res = client.post("/api/auth/login", json={
            "email": "admin@codered.health",
            "password": "Admin@123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token_data = login_res.json()
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Login OK: {token_data['full_name']} (Role: {token_data['role']})")

        print("\n--- 3. Testing Dashboard Stats ---")
        stats_res = client.get("/api/dashboard/stats", headers=headers)
        assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
        stats = stats_res.json()
        print("Dashboard KPIs:", stats["kpis"])
        print("AI Insights Tomorrow Volume:", stats["ai_insights"]["predicted_patient_volume_tomorrow"])

        print("\n--- 4. Testing AI Predictive Endpoints ---")
        noshow_res = client.post("/api/ai/predict-noshow", json={
            "age": 45,
            "gender": "Male",
            "lead_time_days": 14,
            "day_of_week": 0,
            "hour_of_day": 9,
            "department_id": 1,
            "previous_appointments": 4,
            "previous_noshows": 2
        })
        assert noshow_res.status_code == 200, f"No-show predict failed: {noshow_res.text}"
        noshow_data = noshow_res.json()
        print("No-Show Prediction:", noshow_data["risk_level"], f"({noshow_data['risk_percentage']}%)")
        print("Factors:", noshow_data["top_contributing_factors"])

        vol_res = client.get("/api/ai/forecast-patient-volume?forecast_days=7", headers=headers)
        assert vol_res.status_code == 200, f"Volume forecast failed: {vol_res.text}"
        print("Volume Forecast Points Count:", len(vol_res.json()["series"]))

        bed_res = client.get("/api/ai/forecast-bed-demand?forecast_days=7", headers=headers)
        assert bed_res.status_code == 200, f"Bed forecast failed: {bed_res.text}"
        print("Bed Demand Peak:", bed_res.json()["peak_demand_count"], "Date:", bed_res.json()["peak_demand_date"])

        med_res = client.get("/api/ai/forecast-medicine", headers=headers)
        assert med_res.status_code == 200, f"Medicine forecast failed: {med_res.text}"
        print("Medicine Tracked:", med_res.json()["total_tracked"], "Critical:", med_res.json()["critical_items_count"])

        metrics_res = client.get("/api/ai/model-metrics", headers=headers)
        assert metrics_res.status_code == 200, f"Metrics failed: {metrics_res.text}"
        print("AI Model Metrics Count:", len(metrics_res.json()))

        print("\n--- 5. Testing CRUD Endpoints ---")
        patients_res = client.get("/api/patients/", headers=headers)
        assert patients_res.status_code == 200, f"Patients list failed: {patients_res.text}"
        print("Patients Count:", len(patients_res.json()))

        appts_res = client.get("/api/appointments/", headers=headers)
        assert appts_res.status_code == 200, f"Appts list failed: {appts_res.text}"
        print("Appointments Count:", len(appts_res.json()))

        doctors_res = client.get("/api/doctors/", headers=headers)
        assert doctors_res.status_code == 200, f"Doctors list failed: {doctors_res.text}"
        print("Doctors Count:", len(doctors_res.json()))

        beds_res = client.get("/api/beds/", headers=headers)
        assert beds_res.status_code == 200, f"Beds list failed: {beds_res.text}"
        print("Beds Count:", len(beds_res.json()))

        meds_res = client.get("/api/pharmacy/medicines", headers=headers)
        assert meds_res.status_code == 200, f"Meds list failed: {meds_res.text}"
        print("Medicines Count:", len(meds_res.json()))

        bills_res = client.get("/api/billing/", headers=headers)
        assert bills_res.status_code == 200, f"Bills list failed: {bills_res.text}"
        print("Bills Count:", len(bills_res.json()))

        print("\n>>> ALL BACKEND API & AI TEST CHECKS PASSED WITH FLYING COLORS! <<<")

if __name__ == "__main__":
    test_system()
