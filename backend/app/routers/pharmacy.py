from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.pharmacy import Medicine, PharmacyTransaction
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.pharmacy import MedicineCreate, MedicineUpdate, MedicineResponse, PharmacyTransactionCreate, PharmacyTransactionResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy & Inventory"])

def enrich_medicine_response(med: Medicine) -> MedicineResponse:
    resp = MedicineResponse.from_orm(med)
    today = datetime.now().date()
    resp.is_low_stock = med.stock_quantity <= med.reorder_level
    resp.is_near_expiry = med.expiry_date <= (today + timedelta(days=60))
    return resp

@router.get("/medicines", response_model=List[MedicineResponse])
def list_medicines(
    search: Optional[str] = Query(None, description="Search by name, generic name, category or batch"),
    category: Optional[str] = None,
    low_stock_only: bool = False,
    near_expiry_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Medicine).filter(Medicine.is_active == True)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Medicine.name.ilike(search_filter),
                Medicine.generic_name.ilike(search_filter),
                Medicine.category.ilike(search_filter),
                Medicine.batch_number.ilike(search_filter)
            )
        )
        
    if category:
        query = query.filter(Medicine.category == category)
        
    medicines = query.order_by(Medicine.name.asc()).all()
    results = [enrich_medicine_response(m) for m in medicines]

    if low_stock_only:
        results = [m for m in results if m.is_low_stock]
    if near_expiry_only:
        results = [m for m in results if m.is_near_expiry]

    return results

@router.post("/medicines", response_model=MedicineResponse)
def add_medicine(
    med_in: MedicineCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    count = db.query(Medicine).count()
    code = f"MED-{(count + 1):04d}"

    med = Medicine(
        medicine_code=code,
        name=med_in.name,
        generic_name=med_in.generic_name,
        category=med_in.category,
        manufacturer=med_in.manufacturer,
        batch_number=med_in.batch_number,
        unit_price=med_in.unit_price,
        stock_quantity=med_in.stock_quantity,
        reorder_level=med_in.reorder_level,
        expiry_date=med_in.expiry_date,
        unit_type=med_in.unit_type or "Tablets",
        dosage_form=med_in.dosage_form or "500mg",
        is_active=True
    )
    db.add(med)
    db.commit()
    db.refresh(med)

    log_audit(db, current_user, "CREATE", "Medicine", str(med.id), f"Added medicine {med.name} (Qty: {med.stock_quantity})")
    return enrich_medicine_response(med)

@router.put("/medicines/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    med_update: MedicineUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    for k, v in med_update.dict(exclude_unset=True).items():
        setattr(med, k, v)

    db.commit()
    db.refresh(med)

    log_audit(db, current_user, "UPDATE", "Medicine", str(med.id), f"Updated medicine {med.name}")
    return enrich_medicine_response(med)

@router.delete("/medicines/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    med.is_active = False  # Soft delete
    db.commit()

    log_audit(db, current_user, "DELETE", "Medicine", str(med.id), f"Archived medicine {med.name}")
    return {"message": f"Medicine {med.name} archived"}

@router.post("/dispense", response_model=PharmacyTransactionResponse)
def dispense_medicine(
    disp_in: PharmacyTransactionCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PHARMACIST, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    med = db.query(Medicine).filter(Medicine.id == disp_in.medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    if med.stock_quantity < disp_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock! Available: {med.stock_quantity}, Requested: {disp_in.quantity}"
        )

    # Deduct stock
    med.stock_quantity -= disp_in.quantity

    unit_price = disp_in.unit_price or med.unit_price
    total_amt = round(disp_in.quantity * unit_price, 2)

    txn = PharmacyTransaction(
        medicine_id=med.id,
        patient_id=disp_in.patient_id,
        prescription_id=disp_in.prescription_id,
        transaction_type=disp_in.transaction_type or "DISPENSED",
        quantity=disp_in.quantity,
        unit_price=unit_price,
        total_amount=total_amt,
        dispensed_by_user_id=current_user.id,
        notes=disp_in.notes
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    log_audit(
        db, current_user, "DISPENSE", "Pharmacy", str(txn.id),
        f"Dispensed {disp_in.quantity} units of {med.name} (Remaining: {med.stock_quantity})"
    )

    resp = PharmacyTransactionResponse.from_orm(txn)
    resp.medicine_name = med.name
    if txn.patient:
        resp.patient_name = txn.patient.full_name
    return resp

@router.get("/transactions", response_model=List[PharmacyTransactionResponse])
def list_transactions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    txns = db.query(PharmacyTransaction).order_by(PharmacyTransaction.timestamp.desc()).limit(limit).all()
    results = []
    for t in txns:
        r = PharmacyTransactionResponse.from_orm(t)
        if t.medicine:
            r.medicine_name = t.medicine.name
        if t.patient:
            r.patient_name = t.patient.full_name
        results.append(r)
    return results
