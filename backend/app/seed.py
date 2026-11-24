import sys
import os
import random
from datetime import datetime, date, timedelta

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models.user import User, UserRole, AuditLog
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus
from app.models.pharmacy import Medicine, PharmacyTransaction
from app.models.emr import MedicalRecord, Prescription, PrescriptionItem
from app.models.billing import Bill, Payment, BillStatus
from app.models.bed import Ward, Bed, BedAllocation, BedStatus
from app.models.analytics import DailyHospitalStats, AIModelMetric
from app.services.auth import get_password_hash
from app.ai.noshow_model import noshow_ai

def seed_database():
    print("[Seed] Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0:
        print("[Seed] Database already contains records. Skipping seed.")
        db.close()
        return

    print("[Seed] Seeding Users with 6 RBAC roles...")
    users = [
        User(
            email="admin@codered.health",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Dr. Alistair Vance (Admin)",
            role=UserRole.ADMIN,
            phone="+1 (555) 019-2831",
            is_active=True
        ),
        User(
            email="receptionist@codered.health",
            hashed_password=get_password_hash("Reception@123"),
            full_name="Sarah Jenkins",
            role=UserRole.RECEPTIONIST,
            phone="+1 (555) 019-2832",
            is_active=True
        ),
        User(
            email="doctor@codered.health",
            hashed_password=get_password_hash("Doctor@123"),
            full_name="Dr. Marcus Thorne, MD",
            role=UserRole.DOCTOR,
            phone="+1 (555) 019-2833",
            is_active=True
        ),
        User(
            email="nurse@codered.health",
            hashed_password=get_password_hash("Nurse@123"),
            full_name="Elena Rostova, RN",
            role=UserRole.NURSE,
            phone="+1 (555) 019-2834",
            is_active=True
        ),
        User(
            email="pharmacist@codered.health",
            hashed_password=get_password_hash("Pharmacy@123"),
            full_name="David Chen, PharmD",
            role=UserRole.PHARMACIST,
            phone="+1 (555) 019-2835",
            is_active=True
        ),
        User(
            email="manager@codered.health",
            hashed_password=get_password_hash("Manager@123"),
            full_name="Victoria Sterling",
            role=UserRole.HOSPITAL_MANAGER,
            phone="+1 (555) 019-2836",
            is_active=True
        )
    ]
    db.add_all(users)
    db.commit()

    print("[Seed] Seeding Departments...")
    departments_data = [
        ("Cardiology", "CARD", "Heart and cardiovascular system disorders", 3, "Ext-301"),
        ("Neurology", "NEUR", "Brain, spinal cord and nervous system", 4, "Ext-401"),
        ("Pediatrics", "PEDI", "Infant, child and adolescent medical care", 2, "Ext-201"),
        ("Orthopedics", "ORTH", "Musculoskeletal system, joints and spine", 2, "Ext-202"),
        ("General Medicine", "GMED", "Comprehensive primary adult medical care", 1, "Ext-101"),
        ("Emergency Medicine", "EMER", "Acute and trauma 24/7 care", 1, "Ext-100"),
        ("Oncology", "ONCO", "Cancer diagnosis, chemotherapy and care", 5, "Ext-501"),
        ("Gynecology & Obstetrics", "OBGY", "Women reproductive and maternal care", 3, "Ext-302"),
    ]
    dept_objs = []
    for name, code, desc, floor, ext in departments_data:
        dept = Department(name=name, code=code, description=desc, floor_number=floor, phone_extension=ext)
        db.add(dept)
        dept_objs.append(dept)
    db.commit()

    print("[Seed] Seeding Doctors...")
    doctors_data = [
        ("DOC-001", "Dr. Marcus Thorne, MD", 1, "Interventional Cardiology", "MD, FACC", "+1 (555) 101-2001", "m.thorne@codered.health", "Room 304", 650.0),
        ("DOC-002", "Dr. Sophia Patel, MBBS, MD", 1, "Clinical Electrophysiology", "MD, FHRS", "+1 (555) 101-2002", "s.patel@codered.health", "Room 306", 600.0),
        ("DOC-003", "Dr. James Callahan, MD", 2, "Stroke & Neurovascular", "MD, FAAN", "+1 (555) 101-2003", "j.callahan@codered.health", "Room 402", 700.0),
        ("DOC-004", "Dr. Emily Zhao, PhD, MD", 3, "Pediatric Pulmonology", "MD, FAAP", "+1 (555) 101-2004", "e.zhao@codered.health", "Room 205", 500.0),
        ("DOC-005", "Dr. Robert Rodriguez, MD", 4, "Joint Replacement & Sports", "MD, FAAOS", "+1 (555) 101-2005", "r.rodriguez@codered.health", "Room 210", 650.0),
        ("DOC-006", "Dr. Hannah Abbott, MD", 5, "Internal Medicine & Diagnostics", "MD, FACP", "+1 (555) 101-2006", "h.abbott@codered.health", "Room 105", 450.0),
        ("DOC-007", "Dr. Arthur Pendelton, MD", 6, "Trauma & Critical Resuscitation", "MD, FACEP", "+1 (555) 101-2007", "a.pendelton@codered.health", "ER-Bay 1", 750.0),
        ("DOC-008", "Dr. Clara Oswald, MD", 7, "Medical Oncology", "MD, FASCO", "+1 (555) 101-2008", "c.oswald@codered.health", "Room 502", 750.0),
        ("DOC-009", "Dr. Anita Desai, MD", 8, "Maternal-Fetal Medicine", "MD, FACOG", "+1 (555) 101-2009", "a.desai@codered.health", "Room 312", 550.0),
        ("DOC-010", "Dr. Kevin Brooks, MD", 5, "Geriatric & Preventive Medicine", "MD, AGSF", "+1 (555) 101-2010", "k.brooks@codered.health", "Room 108", 450.0),
    ]
    doc_objs = []
    for code, name, dept_id, spec, qual, phone, email, room, fee in doctors_data:
        doc = Doctor(
            doctor_code=code,
            full_name=name,
            department_id=dept_id,
            specialization=spec,
            qualification=qual,
            phone=phone,
            email=email,
            room_number=room,
            consulting_fee=fee,
            availability_days="Mon,Tue,Wed,Thu,Fri",
            shift_start="09:00 AM",
            shift_end="05:00 PM",
            is_available=True
        )
        db.add(doc)
        doc_objs.append(doc)
    db.commit()

    print("[Seed] Seeding Wards and Beds...")
    wards_info = [
        ("Intensive Care Unit (ICU)", "Intensive Care", 3, 3500.0, 10, "ICU"),
        ("General Ward A", "General", 2, 1200.0, 15, "GWA"),
        ("General Ward B", "General", 2, 1200.0, 15, "GWB"),
        ("Emergency Trauma Unit", "Emergency", 1, 2000.0, 8, "EMG"),
        ("Pediatric Care Ward", "Pediatric", 4, 1500.0, 8, "PED"),
    ]
    ward_objs = []
    bed_objs = []
    for wname, wtype, floor, rate, bed_count, prefix in wards_info:
        ward = Ward(name=wname, ward_type=wtype, floor=floor, daily_rate=rate)
        db.add(ward)
        db.commit()
        db.refresh(ward)
        ward_objs.append(ward)

        for b_num in range(1, bed_count + 1):
            status = BedStatus.AVAILABLE
            if b_num in [1, 2, 3, 4, 5]:
                status = BedStatus.OCCUPIED
            elif b_num == 6:
                status = BedStatus.RESERVED
            elif b_num == 7:
                status = BedStatus.MAINTENANCE
                
            bed = Bed(
                bed_number=f"{prefix}-{b_num:02d}",
                ward_id=ward.id,
                status=status,
                features="Continuous Telemetry, O2 Blender, Cardiac Bedside Unit" if "ICU" in prefix else "Multi-parameter Monitor, Central O2 Supply",
                notes=None
            )
            db.add(bed)
            bed_objs.append(bed)
    db.commit()

    print("[Seed] Seeding Medicines & Inventory...")
    medicines_data = [
        # (Name, Generic, Category, Stock, Reorder, UnitPrice, ExpiryOffsetDays, UnitType)
        ("Augmentin 625mg", "Amoxicillin + Clavulanate", "Antibiotics", 120, 30, 18.5, 365, "Tablets"),
        ("Ciprofloxacin 500mg", "Ciprofloxacin HCl", "Antibiotics", 85, 25, 12.0, 280, "Tablets"),
        ("Azithromycin 500mg", "Azithromycin", "Antibiotics", 15, 25, 22.0, 190, "Tablets"),  # LOW STOCK
        ("Paracetamol 650mg", "Acetaminophen", "Antipyretics", 350, 50, 4.0, 450, "Tablets"),
        ("Ibuprofen 400mg", "Ibuprofen", "Analgesics", 18, 40, 6.5, 310, "Tablets"),  # LOW STOCK
        ("Tramadol 50mg", "Tramadol HCl", "Analgesics", 45, 20, 28.0, 240, "Capsules"),
        ("Atorvastatin 20mg", "Atorvastatin Calcium", "Cardiovascular", 140, 30, 15.0, 500, "Tablets"),
        ("Amlodipine 5mg", "Amlodipine Besylate", "Cardiovascular", 190, 40, 8.5, 420, "Tablets"),
        ("Metoprolol 50mg", "Metoprolol Succinate", "Cardiovascular", 8, 20, 14.0, 45, "Tablets"),  # CRITICAL LOW & EXPIRING SOON
        ("Metformin 500mg", "Metformin HCl", "Antidiabetic", 220, 40, 7.0, 600, "Tablets"),
        ("Insulin Glargine", "Recombinant Human Insulin", "Antidiabetic", 12, 15, 85.0, 180, "Vial"),  # LOW STOCK
        ("Salbutamol Inhaler", "Albuterol Sulfate", "Respiratory", 35, 15, 45.0, 320, "Inhaler"),
        ("Montelukast 10mg", "Montelukast Sodium", "Respiratory", 90, 25, 16.0, 400, "Tablets"),
        ("Pantoprazole 40mg", "Pantoprazole Sodium", "Gastrointestinal", 160, 30, 9.0, 520, "Tablets"),
        ("Ondansetron 4mg", "Ondansetron HCl", "Gastrointestinal", 75, 20, 11.5, 340, "Tablets"),
        ("Epinephrine 1mg/ml", "Adrenaline", "Emergency / Critical", 40, 15, 35.0, 210, "Vial"),
        ("Atropine Sulfate 0.6mg", "Atropine", "Emergency / Critical", 50, 15, 24.0, 300, "Vial"),
        ("Norepinephrine 4mg/4ml", "Noradrenaline", "Emergency / Critical", 6, 15, 75.0, 150, "Vial"),  # CRITICAL LOW
        ("Normal Saline 0.9% 500ml", "Sodium Chloride IV", "IV Fluids", 280, 60, 5.0, 700, "IV Bag"),
        ("Ringer Lactate 500ml", "Compound Sodium Lactate", "IV Fluids", 195, 50, 5.5, 680, "IV Bag"),
        ("Dextrose 5% 500ml", "Dextrose Monohydrate", "IV Fluids", 110, 40, 5.0, 650, "IV Bag"),
        ("Ceftriaxone 1g IV", "Ceftriaxone Sodium", "Antibiotics", 65, 20, 38.0, 270, "Vial"),
        ("Meropenem 1g IV", "Meropenem Trihydrate", "Antibiotics", 9, 15, 110.0, 180, "Vial"),  # LOW STOCK
        ("Enoxaparin 40mg", "Low Molecular Weight Heparin", "Cardiovascular", 30, 15, 55.0, 310, "Prefilled Syringe"),
        ("Furosemide 40mg", "Lasix / Furosemide", "Cardiovascular", 85, 20, 6.0, 390, "Tablets"),
    ]
    med_objs = []
    for idx, (mname, gen, cat, stock, reorder, price, exp_offset, utype) in enumerate(medicines_data):
        med = Medicine(
            medicine_code=f"MED-{idx+1:04d}",
            name=mname,
            generic_name=gen,
            category=cat,
            manufacturer="Apex Biopharma / Meridian Healthcare",
            batch_number=f"BCH-2026-X{idx+101}",
            unit_price=price,
            stock_quantity=stock,
            reorder_level=reorder,
            expiry_date=datetime.now().date() + timedelta(days=exp_offset),
            unit_type=utype,
            dosage_form="Standard formulation",
            is_active=True
        )
        db.add(med)
        med_objs.append(med)
    db.commit()

    print("[Seed] Seeding Patients...")
    patient_names = [
        ("Eleanor Vance", 48, "Female", "A+", "+1 (555) 234-5678", "Penicillin allergy", "Hypertension"),
        ("Arthur Pendelton", 62, "Male", "O+", "+1 (555) 345-6789", "Sulfa drugs", "Type 2 Diabetes, CAD"),
        ("Chloe Bennett", 29, "Female", "B+", "+1 (555) 456-7890", "None", "Asthma"),
        ("Samuel Jackson", 71, "Male", "AB+", "+1 (555) 567-8901", "Aspirin", "COPD, Chronic Kidney Disease"),
        ("Maya Lin", 34, "Female", "O-", "+1 (555) 678-9012", "None", "None"),
        ("Gabriel Santos", 41, "Male", "A-", "+1 (555) 789-0123", "Ibuprofen", "Migraine, Hyperlipidemia"),
        ("Amina Al-Mansoor", 55, "Female", "B-", "+1 (555) 890-1234", "Latex allergy", "Rheumatoid Arthritis"),
        ("Ethan Walker", 19, "Male", "O+", "+1 (555) 901-2345", "None", "None"),
        ("Isabella Rossi", 38, "Female", "A+", "+1 (555) 012-3456", "Codeine", "Hypothyroidism"),
        ("Liam O'Connor", 52, "Male", "AB-", "+1 (555) 123-4567", "None", "Essential Hypertension"),
        ("Grace Hopper", 67, "Female", "O+", "+1 (555) 234-9876", "Penicillin", "Osteoarthritis"),
        ("Lucas Silva", 24, "Male", "B+", "+1 (555) 345-8765", "None", "Allergic Rhinitis"),
        ("Zara Khan", 45, "Female", "A+", "+1 (555) 456-7654", "Ciprofloxacin", "Type 2 Diabetes"),
        ("Noah Williams", 33, "Male", "O+", "+1 (555) 567-6543", "None", "None"),
        ("Emma Watson", 58, "Female", "B+", "+1 (555) 678-5432", "Morphine", "Breast CA survivor (remission)"),
    ]
    patient_objs = []
    for idx, (pname, age, gender, bg, phone, allergies, chronic) in enumerate(patient_names):
        p = Patient(
            patient_id=f"CR-2026-{idx+1:04d}",
            full_name=pname,
            date_of_birth=datetime.now().date() - timedelta(days=age*365),
            age=age,
            gender=gender,
            blood_group=bg,
            phone=phone,
            email=f"{pname.lower().replace(' ', '.')}@example.com",
            address=f"{100 + idx*15} Healthcare Ave, Metro City",
            emergency_contact_name=f"Kin of {pname.split()[0]}",
            emergency_contact_phone="+1 (555) 999-0000",
            emergency_contact_relation="Spouse / Parent",
            allergies=allergies,
            chronic_conditions=chronic,
            status="Inpatient" if idx < 5 else "Active"
        )
        db.add(p)
        patient_objs.append(p)
    db.commit()

    print("[Seed] Seeding Bed Allocations for Inpatients...")
    occupied_beds = [b for b in bed_objs if b.status == BedStatus.OCCUPIED]
    for idx, bed in enumerate(occupied_beds[:5]):
        p = patient_objs[idx]
        doc = doc_objs[idx % len(doc_objs)]
        alloc = BedAllocation(
            bed_id=bed.id,
            patient_id=p.id,
            doctor_id=doc.id,
            admission_date=datetime.now() - timedelta(days=random.randint(1, 4)),
            expected_discharge_date=datetime.now() + timedelta(days=random.randint(2, 5)),
            admitting_diagnosis=p.chronic_conditions or "Acute exacerbation under observation",
            status="Active"
        )
        db.add(alloc)
    db.commit()

    print("[Seed] Seeding Appointments with AI No-Show Predictions...")
    today = datetime.now().date()
    times = ["09:00 AM", "10:00 AM", "10:30 AM", "11:15 AM", "02:00 PM", "03:30 PM", "04:15 PM"]
    reasons = [
        "Routine cardiac follow-up and ECG review",
        "Neurological checkup for chronic headache",
        "Pediatric wellness and vaccination consult",
        "Orthopedic knee stiffness evaluation",
        "General health checkup and blood work review",
        "Emergency triage follow-up",
        "Hypertension prescription adjustment",
        "Post-operative joint recovery inspection"
    ]

    appt_count = 1
    # Past 7 days, today, and next 7 days
    for day_offset in range(-7, 8):
        appt_date = today + timedelta(days=day_offset)
        lead_time = max(0, day_offset) if day_offset >= 0 else random.randint(1, 14)
        
        # 3 to 6 appointments per day
        daily_appts = random.randint(3, 6)
        for i in range(daily_appts):
            p = random.choice(patient_objs)
            d = random.choice(doc_objs)
            
            # Predict AI no-show risk
            ai_pred = noshow_ai.predict(
                age=p.age,
                lead_time_days=lead_time,
                day_of_week=appt_date.weekday(),
                hour_of_day=10 + (i % 6),
                department_id=d.department_id,
                previous_appointments=random.randint(0, 5),
                previous_noshows=random.randint(0, 2)
            )

            # Determine realistic status based on past/future
            if day_offset < 0:
                if ai_pred["risk_level"] == "High" and random.random() < 0.65:
                    status = AppointmentStatus.NO_SHOW
                elif random.random() < 0.1:
                    status = AppointmentStatus.CANCELLED
                else:
                    status = AppointmentStatus.COMPLETED
            elif day_offset == 0:
                status = AppointmentStatus.CONFIRMED if i < 2 else AppointmentStatus.SCHEDULED
            else:
                status = AppointmentStatus.SCHEDULED

            appt = Appointment(
                appointment_number=f"APT-2026-{appt_count:04d}",
                patient_id=p.id,
                doctor_id=d.id,
                department_id=d.department_id,
                appointment_date=appt_date,
                appointment_time=times[i % len(times)],
                reason=random.choice(reasons),
                status=status,
                notes="Patient requested morning slot" if i < 3 else "Follow-up consultation",
                lead_time_days=lead_time,
                noshow_risk_score=ai_pred["noshow_risk_score"],
                noshow_risk_level=ai_pred["risk_level"],
                noshow_risk_factors="; ".join(ai_pred["top_contributing_factors"]),
                prediction_confidence=ai_pred["confidence"]
            )
            db.add(appt)
            appt_count += 1
    db.commit()

    print("[Seed] Seeding EMR records, Prescriptions and Billing...")
    completed_appts = db.query(Appointment).filter(Appointment.status == AppointmentStatus.COMPLETED).all()
    for appt in completed_appts[:8]:
        rec = MedicalRecord(
            patient_id=appt.patient_id,
            doctor_id=appt.doctor_id,
            appointment_id=appt.id,
            record_date=datetime.combine(appt.appointment_date, datetime.min.time()),
            chief_complaint=appt.reason,
            clinical_examination="Patient alert, oriented x 3. Chest clear, heart regular rhythm S1/S2 present. Abdomen soft, non-tender.",
            diagnosis="Essential Hypertension & Mild Hypercholesterolemia" if appt.doctor_id == 1 else "Acute Rhinosinusitis",
            icd10_code="I10" if appt.doctor_id == 1 else "J01.90",
            blood_pressure=f"{random.randint(118, 142)}/{random.randint(76, 88)}",
            pulse_rate=random.randint(68, 86),
            temperature=round(random.uniform(98.2, 99.1), 1),
            respiratory_rate=random.randint(14, 18),
            spo2=random.randint(97, 99),
            doctor_notes="Lifestyle modification advised (DASH diet, 30 min daily walking). Continue prescribed medication.",
            treatment_plan="Review in 4 weeks with lipid panel and blood pressure log.",
            is_confidential=False
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        # Prescription
        rx = Prescription(
            medical_record_id=rec.id,
            patient_id=rec.patient_id,
            doctor_id=rec.doctor_id,
            notes="Take after breakfast with plenty of water",
            status="Dispensed"
        )
        db.add(rx)
        db.commit()
        db.refresh(rx)

        # Prescription items
        for med in med_objs[:2]:
            item = PrescriptionItem(
                prescription_id=rx.id,
                medicine_id=med.id,
                dosage="1 tablet",
                frequency="Once daily in the morning",
                duration_days=14,
                quantity=14,
                instructions="Take with water after food"
            )
            db.add(item)
        db.commit()

        # Bill for this appointment
        consult_fee = appt.doctor.consulting_fee if appt.doctor else 500.0
        med_fee = 85.0
        tax = round((consult_fee + med_fee) * 0.05, 2)
        total = consult_fee + med_fee + tax

        bill = Bill(
            invoice_number=f"INV-2026-{appt.id:04d}",
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            due_date=appt.appointment_date + timedelta(days=7),
            consultation_charges=consult_fee,
            service_charges=25.0,
            medicine_charges=med_fee,
            room_charges=0.0,
            tax_rate_percent=5.0,
            tax_amount=tax,
            discount_amount=0.0,
            total_amount=total,
            paid_amount=total,
            status=BillStatus.PAID,
            payment_method="UPI / Card",
            notes="Settled at discharge desk"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)

        payment = Payment(
            bill_id=bill.id,
            transaction_id=f"TXN-PAY-{bill.id:04d}-SUCCESS",
            amount=total,
            payment_method="UPI",
            payment_status="Success",
            notes="Digital receipt acknowledged"
        )
        db.add(payment)
    db.commit()

    print("[Seed] Seeding 90 Days of Historical Daily Hospital Statistics for Time-Series Forecasting...")
    from app.ai.forecasting_model import forecaster
    hist_df = forecaster._generate_synthetic_history(90)
    for _, row in hist_df.iterrows():
        st = DailyHospitalStats(
            date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
            patient_volume=int(row["patient_volume"]),
            admissions_count=int(row["admissions"]),
            discharges_count=int(max(1, row["admissions"] - random.randint(-1, 2))),
            emergency_count=int(row["patient_volume"] * 0.12),
            occupied_beds=int(row["occupied_beds"]),
            total_beds=len(bed_objs),
            bed_occupancy_rate=round((int(row["occupied_beds"]) / len(bed_objs)) * 100, 1),
            scheduled_appointments=int(row["patient_volume"] * 0.35),
            completed_appointments=int(row["patient_volume"] * 0.30),
            noshow_appointments=int(row["patient_volume"] * 0.05),
            medicine_units_dispensed=int(row["patient_volume"] * 2.8)
        )
        db.add(st)
    db.commit()

    print("[Seed] Seeding Initial Audit Logs...")
    initial_audits = [
        ("SYSTEM", "INITIALIZE", "Database", "1", "Initialized hospital management system database and schema"),
        ("admin@codered.health", "CONFIG", "System", "1", "Configured department workflows, wards and staffing roles"),
        ("receptionist@codered.health", "LOGIN", "User", "2", "Receptionist user session authenticated"),
        ("doctor@codered.health", "LOGIN", "User", "3", "Consultant physician session authenticated"),
        ("pharmacist@codered.health", "INVENTORY_SYNC", "Pharmacy", "ALL", "Synchronized pharmaceutical inventory barcodes"),
    ]
    for email, action, rtype, rid, details in initial_audits:
        log_entry = AuditLog(
            user_id=1,
            user_email=email,
            role="Admin" if "admin" in email else "Staff",
            action=action,
            resource_type=rtype,
            resource_id=rid,
            details=details,
            ip_address="127.0.0.1"
        )
        db.add(log_entry)
    db.commit()

    db.close()
    print("[Seed] Successfully seeded all modules with realistic synthetic data!")

if __name__ == "__main__":
    seed_database()
