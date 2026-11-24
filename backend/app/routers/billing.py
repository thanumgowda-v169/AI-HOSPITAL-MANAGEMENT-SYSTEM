from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models.billing import Bill, Payment, BillStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.billing import BillCreate, BillUpdate, BillResponse, PaymentCreate, PaymentResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/billing", tags=["Billing & Invoicing"])

def generate_invoice_number(db: Session) -> str:
    count = db.query(Bill).count()
    year = datetime.now().year
    return f"INV-{year}-{(count + 1):04d}"

def enrich_bill_response(bill: Bill) -> BillResponse:
    resp = BillResponse.from_orm(bill)
    if bill.patient:
        resp.patient_name = bill.patient.full_name
        resp.patient_code = bill.patient.patient_id
        resp.patient_phone = bill.patient.phone
    if bill.payments:
        resp.payments = [PaymentResponse.from_orm(p) for p in bill.payments]
    return resp

@router.get("/", response_model=List[BillResponse])
def list_bills(
    status: Optional[BillStatus] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bill)
    if status:
        query = query.filter(Bill.status == status)
    if patient_id:
        query = query.filter(Bill.patient_id == patient_id)
        
    bills = query.order_by(Bill.id.desc()).all()
    return [enrich_bill_response(b) for b in bills]

@router.post("/", response_model=BillResponse)
def create_bill(
    bill_in: BillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == bill_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    subtotal = (
        bill_in.consultation_charges
        + bill_in.service_charges
        + bill_in.medicine_charges
        + bill_in.room_charges
    )
    tax_amt = round(subtotal * (bill_in.tax_rate_percent / 100.0), 2)
    total_amt = round(subtotal + tax_amt - bill_in.discount_amount, 2)

    inv_num = generate_invoice_number(db)
    due_dt = (datetime.now() + timedelta(days=7)).date()

    bill = Bill(
        invoice_number=inv_num,
        patient_id=bill_in.patient_id,
        appointment_id=bill_in.appointment_id,
        due_date=due_dt,
        consultation_charges=bill_in.consultation_charges,
        service_charges=bill_in.service_charges,
        medicine_charges=bill_in.medicine_charges,
        room_charges=bill_in.room_charges,
        tax_rate_percent=bill_in.tax_rate_percent,
        tax_amount=tax_amt,
        discount_amount=bill_in.discount_amount,
        total_amount=total_amt,
        paid_amount=0.0,
        status=BillStatus.PENDING,
        payment_method="Pending",
        notes=bill_in.notes
    )

    db.add(bill)
    db.commit()
    db.refresh(bill)

    log_audit(db, current_user, "CREATE", "Billing", str(bill.id), f"Generated invoice {inv_num} for {patient.full_name} (${total_amt})")
    return enrich_bill_response(bill)

@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return enrich_bill_response(bill)

@router.post("/{bill_id}/pay", response_model=BillResponse)
def process_payment(
    bill_id: int,
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if payment_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    # Record payment transaction
    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    payment = Payment(
        bill_id=bill.id,
        transaction_id=txn_id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        payment_status="Success",
        notes=payment_in.notes
    )
    db.add(payment)

    # Update bill balances
    bill.paid_amount = round(bill.paid_amount + payment_in.amount, 2)
    bill.payment_method = payment_in.payment_method

    if bill.paid_amount >= bill.total_amount:
        bill.status = BillStatus.PAID
    elif bill.paid_amount > 0:
        bill.status = BillStatus.PARTIALLY_PAID

    db.commit()
    db.refresh(bill)

    log_audit(
        db, current_user, "PAYMENT", "Billing", str(bill.id),
        f"Processed payment of ${payment_in.amount} via {payment_in.payment_method} (Txn: {txn_id})"
    )

    return enrich_bill_response(bill)
