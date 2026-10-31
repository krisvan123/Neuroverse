"""Position atlas and annotation lookup, independent of optional connectivity."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.connectome import clean_root
from app.data.atlas import AtlasUnavailable, get_catalog, neuron_profile, provenance

router = APIRouter(prefix="/api/v1/atlas", tags=["neuron-atlas"])


def catalog() -> dict:
    try:
        return get_catalog()
    except AtlasUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/points")
def positions(rows: dict = Depends(catalog)) -> dict:
    points = [
        [rid, *row["position_nm"], 0 if row["position_kind"] == "soma" else 1]
        for rid, row in rows.items() if row["position_nm"] is not None
    ]
    return {
        **provenance(), "units": "nanometer", "total_neurons": len(rows),
        "point_columns": ["root_id", "x_nm", "y_nm", "z_nm", "kind_0_soma_1_anchor"],
        "points": points, "soma_count": sum(point[4] == 0 for point in points),
        "unpositioned_count": len(rows) - len(points),
    }


@router.get("/search")
def search(q: str = Query("", max_length=80), offset: int = Query(0, ge=0, le=200000),
           limit: int = Query(12, ge=1, le=30), rows: dict = Depends(catalog)) -> dict:
    query = q.strip().casefold()
    matches = [row for row in rows.values() if not query or any(
        query in (row.get(key) or "").casefold()
        for key in ("root_id", "label", "cell_class", "cell_type", "hemibrain_type")
    )]
    return {"results": matches[offset:offset + limit], "total": len(matches), "offset": offset}


@router.get("/neurons/{neuron_id}")
def profile(neuron_id: str, rows: dict = Depends(catalog)) -> dict:
    row = rows.get(clean_root(neuron_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Neuron is not in the pinned FAFB v783 annotation release")
    return neuron_profile(row)
