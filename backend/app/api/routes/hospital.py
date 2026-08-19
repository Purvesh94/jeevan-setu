"""Hospital routes — search, recommend, CRUD"""
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.core.security import get_current_user, require_admin
from app.core.database import get_supabase_admin_client

router = APIRouter()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


class HospitalCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    phone: str | None = None
    emergency_available: bool = True
    trauma_available: bool = False
    cardiology_available: bool = False
    maternity_available: bool = False
    pediatric_available: bool = False
    burns_available: bool = False
    open_24x7: bool = True
    verified: bool = False


@router.get("")
async def list_hospitals(
    lat: float | None = None,
    lon: float | None = None,
    radius_km: float = 20.0,
    specialty: str | None = None,
):
    """List hospitals, optionally filtered by location and specialty."""
    db = get_supabase_admin_client()
    query = db.table("hospitals").select("*").eq("status", "ACTIVE")
    
    if specialty:
        specialty_col = f"{specialty}_available"
        query = query.eq(specialty_col, True)
    
    result = query.execute()
    hospitals = result.data or []
    
    if lat is not None and lon is not None:
        for h in hospitals:
            h["distance_km"] = round(haversine_distance(lat, lon, h["latitude"], h["longitude"]), 2)
        hospitals = [h for h in hospitals if h["distance_km"] <= radius_km]
        hospitals.sort(key=lambda h: h["distance_km"])
    
    return hospitals


@router.get("/recommend")
async def recommend_hospitals(
    lat: float = Query(...),
    lon: float = Query(...),
    category: str = Query(default="MEDICAL"),
    user: dict = Depends(get_current_user),
):
    """Recommend best hospitals for an emergency based on category, capabilities, distance."""
    db = get_supabase_admin_client()
    result = db.table("hospitals").select("*").eq("status", "ACTIVE").execute()
    hospitals = result.data or []
    
    # Map emergency category to required specialties
    category_specialty_map = {
        "ROAD_ACCIDENT": ["trauma_available", "emergency_available"],
        "MEDICAL": ["emergency_available"],
        "FIRE": ["burns_available", "emergency_available"],
        "DISASTER": ["emergency_available", "trauma_available"],
    }
    
    required = category_specialty_map.get(category, ["emergency_available"])
    
    scored = []
    for h in hospitals:
        dist = haversine_distance(lat, lon, h["latitude"], h["longitude"])
        if dist > 50:
            continue
        
        score = 0
        reasons = []
        
        if h.get("emergency_available"):
            score += 30
            reasons.append("Emergency capability ✓")
        
        for spec in required:
            if h.get(spec):
                score += 20
                reasons.append(f"{spec.replace('_available', '').replace('_', ' ').title()} capability ✓")
        
        if h.get("verified"):
            score += 15
            reasons.append("Verified ✓")
        
        if h.get("open_24x7"):
            score += 10
            reasons.append("24/7 open ✓")
        
        # Distance score (closer = higher score)
        dist_score = max(0, 25 - dist)
        score += dist_score
        reasons.append(f"{dist:.1f} km away")
        
        scored.append({
            **h,
            "distance_km": round(dist, 2),
            "score": round(score, 1),
            "match_reasons": reasons,
        })
    
    scored.sort(key=lambda h: h["score"], reverse=True)
    
    # Add rank
    for i, h in enumerate(scored[:10]):
        h["rank"] = i + 1
    
    return scored[:10]


@router.get("/{hospital_id}")
async def get_hospital(hospital_id: str):
    """Get hospital by ID."""
    db = get_supabase_admin_client()
    result = db.table("hospitals").select("*").eq("id", hospital_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return result.data[0]


@router.post("")
async def create_hospital(data: HospitalCreate, user: dict = Depends(require_admin)):
    """Create a hospital (admin only)."""
    db = get_supabase_admin_client()
    result = db.table("hospitals").insert({
        **data.model_dump(),
        "status": "ACTIVE",
    }).execute()
    return result.data[0] if result.data else {"success": True}
