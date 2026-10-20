"""Versioned, bounded read-only API for imported connectome subgraphs."""

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request

from app.data.pipeline import DataValidationError, root_id
from app.data.store import GraphStore

router = APIRouter(prefix="/api/v1", tags=["connectome"])


def dataset_store(request: Request) -> GraphStore:
    store: GraphStore | None = request.app.state.connectome_store
    if store is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "No validated local connectome is configured. Import a user-provided "
                "FAFB v783 CSV, then configure NEUROVERSE_DATASET_DB."
            ),
        )
    return store


def clean_root(value: str) -> str:
    try:
        return root_id(value)
    except DataValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/datasets/current")
def dataset_info(request: Request) -> dict:
    """Explicitly distinguish no data from a user-provided unverified source file."""
    store: GraphStore | None = request.app.state.connectome_store
    if store is None:
        return {
            "available": False,
            "dataset": "FlyWire FAFB",
            "snapshot": "783",
            "source_identity_verified": False,
            "message": "No connectome file is configured; no neuron data are being served.",
        }
    return store.info()


@router.get("/neurons/search")
def search_neurons(
    q: str = Query(min_length=1, max_length=80),
    limit: int = Query(20, ge=1, le=30),
    store: GraphStore = Depends(dataset_store),
) -> dict:
    return {
        "query": q,
        "results": store.search(q, limit),
        "scope": "selected_subgraph_only",
    }


@router.get("/neurons/{neuron_id}")
def get_neuron(
    neuron_id: str = Path(min_length=1, max_length=19),
    store: GraphStore = Depends(dataset_store),
) -> dict:
    rid = clean_root(neuron_id)
    neuron = store.neuron(rid)
    if neuron is None:
        raise HTTPException(
            status_code=404,
            detail="Neuron not present in the selected subgraph, not necessarily absent in FAFB.",
        )
    return neuron


@router.get("/neurons/{neuron_id}/connections")
def get_neuron_connections(
    neuron_id: str = Path(min_length=1, max_length=19),
    direction: str = Query("both", pattern="^(both|incoming|outgoing)$"),
    limit: int = Query(100, ge=1, le=200),
    store: GraphStore = Depends(dataset_store),
) -> dict:
    rid = clean_root(neuron_id)
    if store.neuron(rid) is None:
        raise HTTPException(status_code=404, detail="Neuron not present in selected subgraph")
    return {
        "root_id": rid,
        "direction": direction,
        "results": store.connections(rid, direction, limit),
        "scope": "selected_subgraph_only",
        "syn_count_unit": "individual_identified_chemical_synapses_in_retained_edges",
    }


@router.get("/neurons/{neuron_id}/neighborhood")
def get_neighborhood(
    neuron_id: str = Path(min_length=1, max_length=19),
    max_nodes: int = Query(80, ge=2, le=300),
    max_edges: int = Query(300, ge=1, le=1000),
    store: GraphStore = Depends(dataset_store),
) -> dict:
    rid = clean_root(neuron_id)
    result = store.neighborhood(rid, max_nodes, max_edges)
    if result is None:
        raise HTTPException(status_code=404, detail="Neuron not present in selected subgraph")
    return result
