from fastapi import APIRouter, Query
import math

from app.services.data_loader import get_restaurants

router = APIRouter(prefix="/api", tags=["places"])


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


@router.get("/places/nearby")
def nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(3.0),
    dish_id: str = Query(None),
):
    result = []
    for r in get_restaurants():
        dist = _haversine(lat, lng, r["lat"], r["lng"])
        if dist <= radius:
            if dish_id and dish_id not in r["dishes"]:
                continue
            result.append({**r, "distance_km": round(dist, 2)})
    result.sort(key=lambda x: x["distance_km"])
    return {"places": result}


@router.get("/places/{place_id}")
def place_detail(place_id: str):
    for r in get_restaurants():
        if r["id"] == place_id:
            return r
    return {"error": "not found"}
