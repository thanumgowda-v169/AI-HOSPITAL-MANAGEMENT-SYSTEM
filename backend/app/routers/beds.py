from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.bed import Ward, Bed, BedAllocation, BedStatus
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.schemas.bed import WardResponse, BedResponse, BedCreate, BedUpdate, BedAllocationCreate, BedAllocationResponse
from app.services.auth import get_current_user, require_roles
from app.services.audit import log_audit

router = APIRouter(prefix="/beds", tags=["Bed Management"])

def enrich_bed_response(bed: Bed) -> BedResponse:
    resp = BedResponse.from_orm(bed)
    if bed.ward:
        resp.ward_name = bed.ward.name
        resp.daily_rate = bed.ward.daily_rate

    # Check for active allocation
    active_alloc = next((a for a in bed.allocations if a.status == "Active"), None)
    if active_alloc and active_alloc.patient:
        resp.current_patient_name = active_alloc.patient.full_name
        resp.current_patient_id = active_alloc.patient.patient_id
        resp.admission_date = active_alloc.admission_date
    return resp

@router.get("/wards", response_model=List[WardResponse])
def list_wards(db: Session = Depends(get_db)):
    wards = db.query(Ward).all()
    results = []
    for w in wards:
        total = len(w.beds)
        avail = sum(1 for b in w.beds if b.status == BedStatus.AVAILABLE)
        occ = sum(1 for b in w.beds if b.status == BedStatus.OCCUPIED)
        
        w_dict = {
            "id": w.id,
            "name": w.name,
            "ward_type": w.ward_type,
            "floor": w.floor,
            "daily_rate": w.daily_rate,
            "total_beds": total,
            "available_beds": avail,
            "occupied_beds": occ
        }
        results.append(WardResponse(**w_dict))
    return results

@router.get("/", response_model=List[BedResponse])
def list_beds(
    ward_id: int = None,
    status: BedStatus = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bed)
    if ward_id:
        query = query.filter(Bed.ward_id == ward_id)
    if status:
        query = query.filter(Bed.status == status)

    beds = query.order_by(Bed.bed_number.asc()).all()
    return [enrich_bed_response(b) for b in beds]

@router.post("/allocate", response_model=BedAllocationResponse)
def allocate_bed(
    alloc_in: BedAllocationCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == alloc_in.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    if bed.status != BedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Bed {bed.bed_number} is currently {bed.status.value}")

    patient = db.query(Patient).filter(Patient.id == alloc_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    allocation = BedAllocation(
        bed_id=bed.id,
        patient_id=patient.id,
        doctor_id=alloc_in.doctor_id,
        admission_date=datetime.now(),
        expected_discharge_date=alloc_in.expected_discharge_date,
        admitting_diagnosis=alloc_in.admitting_diagnosis,
        status="Active"
    )
    db.add(allocation)

    # Update bed and patient status
    bed.status = BedStatus.OCCUPIED
    patient.status = "Inpatient"

    db.commit()
    db.refresh(allocation)

    log_audit(
        db, current_user, "ADMISSION", "Bed", str(bed.id),
        f"Admitted patient {patient.full_name} to Bed {bed.bed_number} ({bed.ward.name if bed.ward else ''})"
    )

    resp = BedAllocationResponse.from_orm(allocation)
    resp.bed_number = bed.bed_number
    if bed.ward:
        resp.ward_name = bed.ward.name
    resp.patient_name = patient.full_name
    if allocation.doctor:
        resp.doctor_name = allocation.doctor.full_name
    return resp

@router.post("/discharge/{allocation_id}", response_model=BedAllocationResponse)
def discharge_patient(
    allocation_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    alloc = db.query(BedAllocation).filter(BedAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Bed allocation record not found")

    alloc.status = "Discharged"
    alloc.actual_discharge_date = datetime.now()

    if alloc.bed:
        alloc.bed.status = BedStatus.AVAILABLE
    if alloc.patient:
        alloc.patient.status = "Discharged"

    db.commit()
    db.refresh(alloc)

    log_audit(
        db, current_user, "DISCHARGE", "Bed", str(alloc.bed_id),
        f"Discharged patient {alloc.patient.full_name if alloc.patient else ''} from Bed {alloc.bed.bed_number if alloc.bed else ''}"
    )

    resp = BedAllocationResponse.from_orm(alloc)
    if alloc.bed:
        resp.bed_number = alloc.bed.bed_number
        if alloc.bed.ward:
            resp.ward_name = alloc.bed.ward.name
    if alloc.patient:
        resp.patient_name = alloc.patient.full_name
    return resp

@router.put("/{bed_id}/status", response_model=BedResponse)
def update_bed_status(
    bed_id: int,
    status_update: BedUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.NURSE, UserRole.HOSPITAL_MANAGER])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    if status_update.status:
        bed.status = status_update.status
    if status_update.notes:
        bed.notes = status_update.notes

    db.commit()
    db.refresh(bed)

    log_audit(db, current_user, "UPDATE", "Bed", str(bed.id), f"Changed bed {bed.bed_number} status to {bed.status.value}")
    return enrich_bed_response(bed)
