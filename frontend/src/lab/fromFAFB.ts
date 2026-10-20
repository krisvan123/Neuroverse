import { rootIdIsValid, type DatasetState, type Subgraph } from '../science/api'
import type { LabGraph } from './engine'
import { validateLabGraph } from './engine'

/** A bounded FAFB subgraph is accepted only after a real dataset is available.
 * API provenance is preserved: local importer checksummed != independently authenticated.
 */
export function graphFromImportedFAFB(
  dataset:DatasetState,
  response:Subgraph,
):LabGraph {
  if(dataset.available!==true || dataset.snapshot!=='783') {
    throw new Error('An imported FAFB v783 dataset is required; no substitute is generated.')
  }
  if(response.scope!=='selected_subgraph_only' ||
    response.direction!=='presynaptic_to_postsynaptic' ||
    response.structural_not_functional!==true ||
    !rootIdIsValid(response.seed_root_id)) {
    throw new Error('The real-neuron response has inconsistent source or direction metadata.')
  }
  if(!Array.isArray(response.nodes)||!Array.isArray(response.edges)) {
    throw new Error('The real-neuron response is missing scientific graph arrays.')
  }
  const result:LabGraph = {
    origin:'fafb-v783-local-subgraph',snapshot:'783',
    seed:response.seed_root_id,
    nodes:response.nodes.map(n=>({id:n.root_id,label:n.cell_type})),
    edges:response.edges.map(e=>({from:e.pre_root_id,to:e.post_root_id,weight:e.syn_count})),
    sourceReference:dataset.source_reference || 'User-provided FAFB v783 connectivity CSV; upstream identity NOT independently authenticated.',
    sourceIdentityVerified:dataset.source_identity_verified===true,
    databaseSha256:dataset.database_sha256??null,
    selection:'API neighborhood: up to 60 neurons, 160 retained directed edges; local importer filters/seed may further truncate; no missing edge implies biological absence.',
    license:dataset.license??'CC BY-NC 4.0',
  }
  return validateLabGraph(result)
}
