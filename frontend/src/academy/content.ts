/**
 * Neuroverse Phase 06 — independently authored, source-mapped education.
 * Educational text is new commentary, not copied textbook paragraphs.
 * Scientific factual statements are assigned source IDs at section level.
 * All quiz options and explanations are reviewed against the same sources.
 */
export interface AcademySource {
  id: string
  title: string
  publisher: string
  url: string
  scope: string
  section: string
}
export interface AcademyQuestion {
  id: string
  prompt: string
  options: readonly [string, string, string]
  correct: 0 | 1 | 2
  explanation: string
  sourceIds: readonly string[]
}
export interface AcademySection {
  heading: string
  paragraphs: readonly string[]
  sourceIds: readonly string[]
}
export interface AcademyLesson {
  id: string
  eyebrow: string
  title: string
  duration: string
  outcome: string
  sections: readonly AcademySection[]
  takeaway: string
  limitation: string
  questionIds: readonly string[]
  sourceIds: readonly string[]
  demo?: boolean
}
export interface GlossaryEntry {
  term: string
  definition: string
  sourceIds: readonly string[]
}

export const ACADEMY_REVIEWED = '2026-10-20'

export const ACADEMY_SOURCES: readonly AcademySource[] = [
  {
    id: 'S-008',
    title: '12.2 Nervous Tissue, Anatomy and Physiology 2e',
    publisher: 'OpenStax',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/12-2-nervous-tissue',
    section: 'Neurons: cell body, dendrites, axon; structure and information flow',
    scope: 'Foundational cellular anatomy; introductory generalizations, not rules for every neuron.',
  },
  {
    id: 'S-009',
    title: '12.5 Communication Between Neurons, Anatomy and Physiology 2e',
    publisher: 'OpenStax',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/12-5-communication-between-neurons',
    section: 'Synapses and neurotransmitter release',
    scope: 'Chemical-synapse mechanisms and distinction from electrical synapses.',
  },
  {
    id: 'S-001',
    title: 'Neuronal wiring diagram of an adult brain',
    publisher: 'Dorkenwald et al., Nature (2024)',
    url: 'https://doi.org/10.1038/s41586-024-07558-y',
    section: 'Abstract; whole-brain reconstruction; data products and annotations',
    scope: 'Adult female fruit-fly brain wiring reconstruction, chemical synapses, data limitations.',
  },
  {
    id: 'S-004',
    title: 'FlyWire Codex FAQ',
    publisher: 'FlyWire Codex',
    url: 'https://codex.flywire.ai/faq',
    section: 'What datasets are available?; How is connectivity determined?; How is the connectome modeled as a network graph?',
    scope: 'FAFB v783 snapshot, directed pre/post connections, thresholds and source-specific labels.',
  },
  {
    id: 'S-010',
    title: 'Breadth First Search — NetworkX reference',
    publisher: 'NetworkX',
    url: 'https://networkx.org/documentation/stable/reference/algorithms/traversal.html',
    section: 'Breadth First Search; bfs_edges and bfs_layers',
    scope: 'Graph-theoretic BFS reachability, not neural signaling or biological cause.',
  },
] as const

export const ACADEMY_QUESTIONS: readonly AcademyQuestion[] = [
  {
    id:'q01', prompt:'Which structure generally receives input from other neurons?',
    options:['Dendrites','The cell nucleus','A drawn arrow in a graph'],
    correct:0,
    explanation:'Dendrites commonly receive synaptic inputs. A drawn graph arrow is a model of a relationship, not a physical cell structure.',
    sourceIds:['S-008'],
  },
  {
    id:'q02', prompt:'In a simplified neuron diagram, which part is usually the long output process?',
    options:['Synaptic cleft','Axon','Cell-body nucleus'],
    correct:1,
    explanation:'The axon carries electrical signals away from the cell body toward output sites. Real neurons vary in structure.',
    sourceIds:['S-008'],
  },
  {
    id:'q03', prompt:'What crosses the gap at a typical chemical synapse?',
    options:['A whole neuron','A computer graph edge','Neurotransmitter molecules'],
    correct:2,
    explanation:'A chemical presynaptic terminal releases neurotransmitters into the synaptic cleft; receptors on the receiving cell respond.',
    sourceIds:['S-009'],
  },
  {
    id:'q04', prompt:'For a chemical synapse, which side releases neurotransmitter?',
    options:['Presynaptic element','Postsynaptic receptor','Whichever side a diagram happens to display on the left'],
    correct:0,
    explanation:'Presynaptic identifies the releasing side; postsynaptic identifies a target. Left/right drawing position is irrelevant.',
    sourceIds:['S-009'],
  },
  {
    id:'q05', prompt:'What does one FlyWire directed connection between two neurons summarize?',
    options:['One proven thought','A pre-to-post neuron pair with identified synapses','A guaranteed voltage trace'],
    correct:1,
    explanation:'Connectivity tables can aggregate multiple identified synapses between an ordered neuron pair; no voltage or thought is measured by that edge.',
    sourceIds:['S-001','S-004'],
  },
  {
    id:'q06', prompt:'Does an edge count of 3 necessarily mean only 3 synapses?',
    options:['Yes, edges and synapses always mean the same thing','Yes, if the graph has arrows','No, a directed edge can aggregate multiple synapses'],
    correct:2,
    explanation:'Edge count measures represented neuron pairs; synapse count measures identified chemical synapses. They have different units.',
    sourceIds:['S-001','S-004'],
  },
  {
    id:'q07', prompt:'If the graph contains A → B, can you automatically walk from B to A?',
    options:['No; not unless a separate B → A edge exists','Yes; arrows work both ways','Yes; if the nodes look close together'],
    correct:0,
    explanation:'A directed graph respects edge orientation. Drawn proximity in our teaching layout does not supply missing edges.',
    sourceIds:['S-004','S-010'],
  },
  {
    id:'q08', prompt:'What does BFS use to visit outward neighbors in layers?',
    options:['A microscope image','A first-in, first-out queue','An estimate of neural firing speed'],
    correct:1,
    explanation:'This educational breadth-first search maintains a FIFO queue of discovered nodes. It determines graph reachability, not physiology.',
    sourceIds:['S-010'],
  },
  {
    id:'q09', prompt:'If deleting node D in the teaching graph makes E unreachable, what have we demonstrated?',
    options:['A real fly has lost a memory','Electrical signals stop in the real brain','Reachability changed in our synthetic mathematical model'],
    correct:2,
    explanation:'A mathematical node-removal experiment says what changes in the chosen graph. It cannot prove a biological intervention or behavior.',
    sourceIds:['S-010','S-001'],
  },
  {
    id:'q10', prompt:'What can a FAFB structural pathway alone establish?',
    options:['A sequence of modeled anatomical connections, not observed activity','The exact timing of each living spike','Which future behavior the fly must perform'],
    correct:0,
    explanation:'A directed anatomical route describes connectivity. Functional activity and causal behavioral effects require additional evidence.',
    sourceIds:['S-001','S-004'],
  },
] as const

export const ACADEMY_LESSONS: readonly AcademyLesson[] = [
  {
    id:'01', eyebrow:'MISSION 001 · CHAPTER 01',title:'Meet the neuron',duration:'5 min',
    outcome:'Locate the soma, dendrites and axon, and tell a physical neuron from a diagram.',
    sourceIds:['S-008'],
    sections:[
      {heading:'A biological cell, not a circuit icon',paragraphs:[
        'A neuron is a specialized cell in a nervous system. Introductory diagrams often show a soma (cell body), branching dendrites and one axon. These parts help explain how information can be received and passed along; they are not merely shapes in a network chart.',
        'The soma contains the nucleus and much of the machinery of the cell. Dendrites commonly receive input from other cells, while an axon can carry an electrical signal toward terminals that interact with targets. Real neurons have varied shapes, so no simple sketch represents every cell.',
      ],sourceIds:['S-008']},
      {heading:'One cell versus one node',paragraphs:[
        'In a connectome visualization, we may choose to represent a reconstructed neuron as a node. The dot is a compact symbol for a scientific record; it is not drawn to scale and does not contain the physical branches of that neuron.',
        'Our 3D FAFB surfaces are published anatomical meshes. A whole-brain surface is not the same thing as a complete map of each internal axon and dendrite. Keep these levels of description separate as you explore.',
      ],sourceIds:['S-008','S-001']},
    ],
    takeaway:'A neuron is a cell; a node is a mathematical representation chosen to stand for something.',
    limitation:'Introductory neuron cartoons simplify biological variation. The academy diagrams are not microscopy images.',
    questionIds:['q01','q02'],
  },
  {
    id:'02', eyebrow:'MISSION 001 · CHAPTER 02',title:'How chemical synapses work',duration:'6 min',
    outcome:'Explain presynaptic, postsynaptic and the role of a neurotransmitter.',
    sourceIds:['S-009'],
    sections:[
      {heading:'Two sides of a junction',paragraphs:[
        'A chemical synapse has a presynaptic element that can release neurotransmitter molecules and a postsynaptic element that has receptors. The narrow gap between them is called the synaptic cleft. A chemical message can influence the receiving cell when molecules reach appropriate receptors.',
        'The words presynaptic and postsynaptic describe different roles in a connection, not positions on your screen. The source cell and target cell are not interchangeable merely because you rotate a diagram.',
      ],sourceIds:['S-009']},
      {heading:'What the illustration leaves out',paragraphs:[
        'Chemical synapses are not the only kind of cellular connection: electrical synapses provide a different route for current between cells. Details of release, receptor type, and the response of a target cell differ between circuits.',
        'A connectome can document identified chemical synaptic contacts, yet a structural diagram alone does not show exactly when a living neuron releases a neurotransmitter or whether a target fires an action potential.',
      ],sourceIds:['S-009','S-001']},
    ],
    takeaway:'For a chemical synapse, presynaptic → postsynaptic describes a directional interaction; it is not a recorded spike.',
    limitation:'The academy discusses chemical-synapse structure. It does not simulate membrane potentials, synaptic strength or timing.',
    questionIds:['q03','q04'],
  },
  {
    id:'03', eyebrow:'MISSION 001 · CHAPTER 03',title:'Read a connectome',duration:'7 min',
    outcome:'Distinguish neurons, connections and individual identified synapses.',
    sourceIds:['S-001','S-004'],
    sections:[
      {heading:'A map made from anatomical evidence',paragraphs:[
        'The FlyWire Consortium reconstructed a wiring diagram of an adult female fruit-fly brain using electron-microscopy-based data. The 2024 publication reports 139,255 reconstructed neurons and about 54.5 million identified chemical synapses. These numbers describe a research resource, not what this small browser lesson loads.',
        'FlyWire Codex provides a named FAFB dataset snapshot, v783. Snapshot labels matter because neuron identifiers, segmentation and connections can change between versions. The website explorer must not quietly combine IDs across incompatible snapshots.',
      ],sourceIds:['S-001','S-004']},
      {heading:'An edge is not a synapse',paragraphs:[
        'An ordered pair A → B can summarize several identified synapses from neuron A to neuron B. That is one directed connection (one edge in a simple graph), possibly with a synapse-count weight larger than one. A count of edges and a count of synaptic contacts have different units.',
        'The official Codex FAQ describes a dataset-specific minimum synapse threshold: FAFB connectivity views commonly start at five identified synapses per ordered pair. Changing a threshold changes which connections enter the selected network; it does not establish that excluded cells have no contacts.',
      ],sourceIds:['S-004']},
    ],
    takeaway:'Always ask: which FAFB snapshot, what does an edge represent, and what filtering was used?',
    limitation:'This academy does not include the full original connectome. The authentic Explorer needs a separately imported local connection subset.',
    questionIds:['q05','q06'],
  },
  {
    id:'04', eyebrow:'MISSION 001 · CHAPTER 04',title:'Walk a directed network',duration:'8 min',
    outcome:'Follow edge direction and step through a queue-based breadth-first search.',
    sourceIds:['S-004','S-010'],
    sections:[
      {heading:'Turning a connectome into mathematics',paragraphs:[
        'In a directed network, an arrow A → B permits an outgoing step from A to B, not automatically the reverse. A graph node may represent a neuron and a directed edge may represent an aggregated connection, provided the modeling choices and source data are stated clearly.',
        'Breadth-first search (BFS) explores outward in layers. A first-in, first-out queue records discovered nodes awaiting processing. BFS can answer which selected nodes are reachable from a starting node, respecting the arrows. It does not measure neural conduction time or establish a functional signaling pathway.',
      ],sourceIds:['S-004','S-010']},
      {heading:'Your controlled example',paragraphs:[
        'Below, every node and arrow is invented for teaching: it is a synthetic directed graph, not the FlyWire dataset. Step through BFS from A, watch the queue, then remove node D to compare the reachable set with a changed model. The original graph remains available at all times.',
        'A model comparison is useful for learning graph reasoning. A mathematical deletion is not the same as harming a neuron or altering a living animal, and changes in a small synthetic graph cannot predict biological behavior.',
      ],sourceIds:['S-010','S-001']},
    ],
    takeaway:'BFS follows directed links in a mathematical graph; changing the graph changes reachability, not observed brain activity.',
    limitation:'The mini demo uses deliberately synthetic nodes A–F; the full experiment lab and scientifically bounded real-subgraph algorithms belong to Phase 07.',
    questionIds:['q07','q08'],demo:true,
  },
  {
    id:'05', eyebrow:'MISSION 001 · CHAPTER 05',title:'What a wiring diagram cannot prove',duration:'6 min',
    outcome:'Separate anatomical observation, algorithmic calculation and functional inference.',
    sourceIds:['S-001','S-004','S-010'],
    sections:[
      {heading:'Evidence comes in different forms',paragraphs:[
        'A reconstructed connectome is evidence about anatomical wiring and identified chemical synaptic contacts. A graph traversal computes a property of a chosen mathematical representation. Neither one, by itself, is a direct recording of the time sequence of electrical activity in a live circuit.',
        'Reconstruction quality, proofreading status, database snapshot, direction conventions and synapse-count filters all affect what a connectivity view can support. Source labels and known limitations are part of the result, not footnotes to hide.',
      ],sourceIds:['S-001','S-004']},
      {heading:'A careful scientific conclusion',paragraphs:[
        'When a graph shows a route from A to E, a defensible sentence is “E is reachable from A under these directed edges and filters.” It would be an overclaim to say that the animal sends an electrical signal along that exact route on every trial.',
        'When deleting D from our teaching graph removes reachability to E, we have compared two graph models. We have not performed a biological intervention, nor measured a change in learning, memory or movement. Testing such claims would require other experiments and evidence.',
      ],sourceIds:['S-001','S-010']},
    ],
    takeaway:'The strongest scientific explanation says both what was measured or computed and what was not established.',
    limitation:'Lesson completion measures practice responses in this browser session, not research expertise or proven learning outcomes.',
    questionIds:['q09','q10'],
  },
] as const

export const ACADEMY_GLOSSARY: readonly GlossaryEntry[] = [
  {term:'Neuron',definition:'Nervous-system cell; may be represented by a node in a graph.',sourceIds:['S-008']},
  {term:'Soma',definition:'The neuron cell body, which contains the nucleus.',sourceIds:['S-008']},
  {term:'Dendrite',definition:'Cellular process that commonly receives synaptic input.',sourceIds:['S-008']},
  {term:'Axon',definition:'A neuron process that can convey signals toward output terminals.',sourceIds:['S-008']},
  {term:'Presynaptic',definition:'The releasing element at a chemical synapse.',sourceIds:['S-009']},
  {term:'Postsynaptic',definition:'The receiving element with receptors at a chemical synapse.',sourceIds:['S-009']},
  {term:'Synaptic cleft',definition:'The narrow extracellular gap across a chemical synapse.',sourceIds:['S-009']},
  {term:'Synapse',definition:'A specialized junction where one cell communicates with a target; the FlyWire graph concerns identified chemical synapses.',sourceIds:['S-009','S-001']},
  {term:'Connectome',definition:'A structural wiring diagram describing neurons and their identified connections.',sourceIds:['S-001','S-004']},
  {term:'Directed edge',definition:'An arrow from an origin node to a destination node in a graph; reverse traversal needs another edge.',sourceIds:['S-004']},
  {term:'Synapse count',definition:'Number of identified synapses associated with a selected pair, distinct from the number of graph edges.',sourceIds:['S-004']},
  {term:'BFS',definition:'Breadth-first search: a graph traversal that explores reachable nodes in successive layers.',sourceIds:['S-010']},
  {term:'Dataset snapshot',definition:'A named version of source data; FAFB v783 is not interchangeable with earlier versions.',sourceIds:['S-004']},
  {term:'Synthetic teaching example',definition:'An explicitly invented model for practice; not a biological measurement.',sourceIds:['S-010']},
] as const

export const ACADEMY_SOURCE_BY_ID = Object.fromEntries(
  ACADEMY_SOURCES.map((source) => [source.id, source]),
) as Record<string, AcademySource>
