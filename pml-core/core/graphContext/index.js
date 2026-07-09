/**
 * Graph Context Engine
 *
 * Deterministic interface layer between the PML Core Engine and the AI
 * Reasoning Layer. Extracts focused subgraphs ("graph windows") and
 * serializes them to PML text for AI consumption.
 *
 * This module has zero AI dependencies — it is pure graph operations.
 */
export { extractGraphWindow, } from './graphWindow';
export { serializeWindow, } from './pmlSliceSerializer';
