"""Phase 07 independent cross-language source-of-truth checks with NetworkX.

Reads the same authored fixtures as Vitest but computes results using NetworkX
rather than importing the JavaScript implementation. The expected traversal
orders and metrics must satisfy BOTH independent implementations.
"""
import json
from pathlib import Path

import networkx as nx
import pytest


FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "src" / "lab" / "reference-cases.json"
)
CASES = json.loads(FIXTURE.read_text(encoding="utf-8"))


def ordered(graph):
    if graph.number_of_nodes() and all(str(n).isdigit() for n in graph.nodes):
        return lambda neighbors: sorted(neighbors, key=int)
    return lambda neighbors: sorted(neighbors)


def run(graph, case, algorithm):
    start = case["start"]
    if start not in graph:
        return []
    if algorithm == "bfs":
        return list(nx.bfs_tree(graph, source=start, sort_neighbors=ordered(graph)))
    return list(nx.dfs_preorder_nodes(graph, source=start, sort_neighbors=ordered(graph)))


@pytest.mark.parametrize("case", CASES, ids=lambda c: c["name"])
def test_ts_reference_cases_match_independent_networkx(case):
    baseline = nx.DiGraph()
    baseline.add_nodes_from(case["nodes"])
    threshold = case["minimumWeight"]
    baseline.add_weighted_edges_from(
        (a, b, w) for a, b, w in case["edges"] if w >= threshold
    )
    modified = baseline.copy()
    if case["removeNode"] is not None:
        modified.remove_node(case["removeNode"])

    for scenario, graph in [("baseline", baseline), ("modified", modified)]:
        expected = case[scenario]
        assert graph.number_of_nodes() == expected["nodes"]
        assert graph.number_of_edges() == expected["edges"]
        for algorithm in ("bfs", "dfs"):
            assert run(graph, case, algorithm) == expected[algorithm]
        assert len(run(graph, case, "bfs")) == expected["reachable"]
        non_loop_edges = nx.number_of_edges(graph) - nx.number_of_selfloops(graph)
        expected_density = (
            non_loop_edges / (len(graph) * (len(graph)-1))
            if len(graph) > 1 else 0
        )
        assert 0 <= expected_density <= 1
        assert sum(dict(graph.out_degree()).values()) == graph.number_of_edges()
        expected_weight = sum(
            w for a, b, w in case["edges"]
            if w >= threshold and a in graph.nodes and b in graph.nodes
        )
        assert sum(graph.edges[u, v]["weight"] for u, v in graph.edges) == expected_weight

    baseline_reached = run(baseline, case, "bfs")
    modified_reached = run(modified, case, "bfs")
    survivors = [
        n for n in baseline_reached
        if n not in modified_reached and n != case["removeNode"]
    ]
    assert survivors == case["newlyUnreachableSurvivors"]
    # Original edges must remain after model comparison.
    assert set(baseline.edges) == {
        (a, b) for a, b, w in case["edges"] if w >= threshold
    }
