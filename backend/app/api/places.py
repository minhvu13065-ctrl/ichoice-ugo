from fastapi import APIRouter, Query
import math

router = APIRouter(prefix="/api", tags=["places"])

# Template quán — tọa độ là offset (độ) tính từ vị trí user
# 0.001 độ ≈ 111m, 0.009 độ ≈ 1km
RESTAURANT_TEMPLATES = [
    {
        "id": "r1", "name": "Phở Bò Gia Truyền",
        "address": "Gần bạn",
        "dlat": 0.002, "dlng": 0.003, "rating": 4.7,
        "dishes": ["pho_bo", "pho_ga", "bun_bo_hue"],
        "open": "6:00 – 22:00",
    },
    {
        "id": "r2", "name": "Cơm Tấm Sài Gòn",
        "address": "Gần bạn",
        "dlat": -0.003, "dlng": 0.005, "rating": 4.6,
        "dishes": ["com_tam", "banh_mi", "banh_mi_op_la", "xoi_ga"],
        "open": "6:00 – 21:00",
    },
    {
        "id": "r3", "name": "Lẩu & Nướng BBQ",
        "address": "Gần bạn",
        "dlat": 0.006, "dlng": -0.004, "rating": 4.8,
        "dishes": ["lau_thai", "lau_nuong", "lau_riêu_cua", "hai_san_nuong", "ga_nuong_muoi_ot"],
        "open": "10:00 – 23:00",
    },
    {
        "id": "r4", "name": "Ramen & Sushi Nhật",
        "address": "Gần bạn",
        "dlat": -0.005, "dlng": -0.003, "rating": 4.6,
        "dishes": ["ramen_tonkotsu", "ramen_spicy_miso", "sushi_set", "takoyaki"],
        "open": "11:00 – 22:00",
    },
    {
        "id": "r5", "name": "K-Food Hàn Quốc",
        "address": "Gần bạn",
        "dlat": 0.004, "dlng": 0.007, "rating": 4.5,
        "dishes": ["tteokbokki", "bibimbap", "samgyeopsal", "ga_ran"],
        "open": "10:00 – 22:00",
    },
    {
        "id": "r6", "name": "Quán Bún Đặc Sản",
        "address": "Gần bạn",
        "dlat": -0.007, "dlng": 0.002, "rating": 4.4,
        "dishes": ["bun_rieu", "bun_bo_hue", "bun_mam", "bun_cha", "mi_quang", "cao_lau"],
        "open": "6:30 – 21:00",
    },
    {
        "id": "r7", "name": "Ăn Vặt Đường Phố",
        "address": "Gần bạn",
        "dlat": 0.001, "dlng": -0.006, "rating": 4.3,
        "dishes": ["banh_trang_nuong", "banh_xeo", "banh_cuon", "goi_cuon", "spring_roll_chien", "muc_rang_muoi"],
        "open": "15:00 – 23:00",
    },
    {
        "id": "r8", "name": "Cháo & Hủ Tiếu",
        "address": "Gần bạn",
        "dlat": 0.008, "dlng": 0.001, "rating": 4.3,
        "dishes": ["chao_ga", "chao_long", "hu_tieu", "banh_canh_cua"],
        "open": "5:30 – 14:00",
    },
    {
        "id": "r9", "name": "Đồ Ăn Chay Tịnh",
        "address": "Gần bạn",
        "dlat": -0.004, "dlng": -0.007, "rating": 4.2,
        "dishes": ["com_chay", "bun_chay", "banh_mi_chay", "banhmy_chay_dau_hu"],
        "open": "7:00 – 20:00",
    },
    {
        "id": "r10", "name": "Dimsum & Trung Hoa",
        "address": "Gần bạn",
        "dlat": -0.001, "dlng": 0.008, "rating": 4.5,
        "dishes": ["dimsum", "com_rang_duong_chau"],
        "open": "8:00 – 21:00",
    },
    {
        "id": "r11", "name": "Burger & Pizza Tây",
        "address": "Gần bạn",
        "dlat": 0.009, "dlng": -0.002, "rating": 4.2,
        "dishes": ["burger_bbq", "pizza_margherita", "pasta_carbonara", "salad_ga", "steakhouse"],
        "open": "10:00 – 22:00",
    },
    {
        "id": "r12", "name": "Trà Sữa & Tráng Miệng",
        "address": "Gần bạn",
        "dlat": -0.002, "dlng": -0.009, "rating": 4.4,
        "dishes": ["tra_sua", "sinh_to_bo", "kem_dua", "che_ba_mau", "nuoc_mia"],
        "open": "8:00 – 23:00",
    },
]


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _build_restaurants(user_lat: float, user_lng: float) -> list[dict]:
    """Tạo danh sách quán với tọa độ thực tế dựa trên vị trí user."""
    result = []
    for tmpl in RESTAURANT_TEMPLATES:
        r_lat = user_lat + tmpl["dlat"]
        r_lng = user_lng + tmpl["dlng"]
        result.append({
            "id": tmpl["id"],
            "name": tmpl["name"],
            "address": tmpl["address"],
            "lat": round(r_lat, 6),
            "lng": round(r_lng, 6),
            "rating": tmpl["rating"],
            "dishes": tmpl["dishes"],
            "open": tmpl["open"],
        })
    return result


@router.get("/places/nearby")
def nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(3.0),
    dish_id: str = Query(None),
):
    restaurants = _build_restaurants(lat, lng)
    result = []
    for r in restaurants:
        dist = _haversine(lat, lng, r["lat"], r["lng"])
        if dist <= radius:
            if dish_id and dish_id not in r["dishes"]:
                continue
            result.append({**r, "distance_km": round(dist, 2)})
    result.sort(key=lambda x: x["distance_km"])
    return {"places": result}


@router.get("/places/{place_id}")
def place_detail(place_id: str):
    for tmpl in RESTAURANT_TEMPLATES:
        if tmpl["id"] == place_id:
            return tmpl
    return {"error": "not found"}
