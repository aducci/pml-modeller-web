import React, { useState, useCallback } from 'react';
import { createLayoutSettings } from 'pml-core';
import { Field, Section, Num, Slider, Toggle, Select, ResetBtn } from './controls';

const DEFAULTS = createLayoutSettings();

interface Props {
  overrides: Record<string, any>;
  onChange: (overrides: Record<string, any>) => void;
}

// Deep-get/set helpers for nested override paths
function get(obj: any, path: string[]): any {
  return path.reduce((o, k) => o?.[k], obj);
}
function set(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  return { ...obj, [head]: set(obj[head] ?? {}, tail, value) };
}
function getDefault(path: string[]): any {
  return get(DEFAULTS, path);
}

export const LayoutRulesPanel: React.FC<Props> = ({ overrides, onChange }) => {
  const val = useCallback((path: string[]) => {
    const ov = get(overrides, path);
    return ov !== undefined ? ov : getDefault(path);
  }, [overrides]);

  const set_ = useCallback((path: string[], value: any) => {
    onChange(set(overrides, path, value));
  }, [overrides, onChange]);

  const resetAll = () => onChange({});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Layout & Routing Rules</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            Changes take effect immediately on the current diagram. Defaults shown.
          </div>
        </div>
        <ResetBtn onClick={resetAll} />
      </div>

      {/* ── Canvas & Spacing ─────────────────────────────────────── */}
      <Section title="Canvas & Spacing">
        <Field label="Show swimlanes" hint="Render swimlanes visually (routing and layout unaffected)">
          <Toggle value={val(['layout', 'showLanes'])} onChange={v => set_(['layout', 'showLanes'], v)} />
        </Field>
        <Field label="Node gap" hint="Horizontal space between nodes at the same depth">
          <Num value={val(['spacing', 'nodeGap'])} onChange={v => set_(['spacing', 'nodeGap'], v)} min={4} max={120} unit="px" />
        </Field>
        <Field label="Lane gap" hint="Vertical gap between swimlanes">
          <Num value={val(['spacing', 'laneGap'])} onChange={v => set_(['spacing', 'laneGap'], v)} min={0} max={80} unit="px" />
        </Field>
        <Field label="Lane gap top" hint="Gap above first lane (overrides lane gap at stack top)">
          <Num value={val(['spacing', 'laneGapTop'])} onChange={v => set_(['spacing', 'laneGapTop'], v)} min={0} max={80} unit="px" />
        </Field>
        <Field label="Lane gap bottom" hint="Gap below last lane (overrides lane gap at stack bottom)">
          <Num value={val(['spacing', 'laneGapBottom'])} onChange={v => set_(['spacing', 'laneGapBottom'], v)} min={0} max={80} unit="px" />
        </Field>
        <Field label="Channel spacing" hint="Vertical spacing between routing rails within a lane">
          <Num value={val(['spacing', 'channelSpacing'])} onChange={v => set_(['spacing', 'channelSpacing'], v)} min={4} max={60} unit="px" />
        </Field>
        <Field label="Canvas padding X" hint="Left + right guard padding (total)">
          <Num value={val(['spacing', 'canvasPaddingX'])} onChange={v => set_(['spacing', 'canvasPaddingX'], v)} min={0} max={200} unit="px" />
        </Field>
        <Field label="Canvas padding Y" hint="Vertical gap between nodes stacked within a lane">
          <Num value={val(['spacing', 'canvasPaddingY'])} onChange={v => set_(['spacing', 'canvasPaddingY'], v)} min={0} max={100} unit="px" />
        </Field>
        <Field label="Lane padding top" hint="Minimum top padding inside each lane body above nodes">
          <Num value={val(['spacing', 'lanePaddingTop'])} onChange={v => set_(['spacing', 'lanePaddingTop'], v)} min={0} max={100} unit="px" />
        </Field>
        <Field label="Lane padding bottom" hint="Minimum bottom padding inside each lane body below nodes">
          <Num value={val(['spacing', 'lanePaddingBottom'])} onChange={v => set_(['spacing', 'lanePaddingBottom'], v)} min={0} max={100} unit="px" />
        </Field>
      </Section>

      {/* ── Node Sizing ──────────────────────────────────────────── */}
      <Section title="Node Sizing">
        <Field label="Sizing mode" hint="Fixed width vs. text-responsive nodes">
          <Select
            value={val(['sizing', 'activitySizingMode'])}
            onChange={v => set_(['sizing', 'activitySizingMode'], v)}
            options={[{ value: 'standard', label: 'Standard (fixed)' }, { value: 'fit-to-text', label: 'Fit to text' }]}
          />
        </Field>
        <Field label="Standard activity width" hint="Fixed width used in standard mode">
          <Num value={val(['sizing', 'standardActivityWidth'])} onChange={v => set_(['sizing', 'standardActivityWidth'], v)} min={40} max={300} unit="px" />
        </Field>
        <Field label="Min node width" hint="Hard lower bound on node width">
          <Num value={val(['sizing', 'minNodeWidth'])} onChange={v => set_(['sizing', 'minNodeWidth'], v)} min={20} max={200} unit="px" />
        </Field>
        <Field label="Max node width" hint="Prevents nodes bloating on sparse graphs">
          <Num value={val(['sizing', 'maxNodeWidth'])} onChange={v => set_(['sizing', 'maxNodeWidth'], v)} min={60} max={400} unit="px" />
        </Field>
        <Field label="Min node height">
          <Num value={val(['sizing', 'minNodeHeight'])} onChange={v => set_(['sizing', 'minNodeHeight'], v)} min={20} max={120} unit="px" />
        </Field>
        <Field label="Min lane height">
          <Num value={val(['sizing', 'minLaneHeight'])} onChange={v => set_(['sizing', 'minLaneHeight'], v)} min={60} max={400} unit="px" />
        </Field>
      </Section>

      {/* ── Routing Strategy ─────────────────────────────────────── */}
      <Section title="Routing Strategy">
        <Field label="Pattern mode" hint="Which routing algorithm stages are active">
          <Select
            value={val(['routing', 'patternMode'])}
            onChange={v => set_(['routing', 'patternMode'], v)}
            options={[
              { value: 'pattern-driven', label: 'Pattern-driven (recommended)' },
              { value: 'hybrid', label: 'Hybrid (pattern + legacy)' },
              { value: 'legacy', label: 'Legacy heuristics' },
            ]}
          />
        </Field>
        <Field label="Loopback escape mode" hint="How loopback edges avoid lane body">
          <Select
            value={val(['routing', 'loopbackEscapeMode'])}
            onChange={v => set_(['routing', 'loopbackEscapeMode'], v)}
            options={[
              { value: 'in-lane', label: 'In-lane' },
              { value: 'cross-lane', label: 'Cross-lane' },
              { value: 'over-swimlane', label: 'Over swimlane' },
              { value: 'auto', label: 'Auto' },
            ]}
          />
        </Field>
        <Field label="Edge channel strategy">
          <Select
            value={val(['routing', 'edgeChannelStrategy'])}
            onChange={v => set_(['routing', 'edgeChannelStrategy'], v)}
            options={[
              { value: 'follow-node', label: 'Follow node' },
              { value: 'adaptive', label: 'Adaptive' },
            ]}
          />
        </Field>
        <Field label="Channel density mode">
          <Select
            value={val(['routing', 'channelDensityMode'])}
            onChange={v => set_(['routing', 'channelDensityMode'], v)}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'spacious', label: 'Spacious' },
              { value: 'fit-to-lane', label: 'Fit to lane' },
            ]}
          />
        </Field>
        <Field label="Horizontal connections only" hint="Force all edges to route horizontally">
          <Toggle value={val(['routing', 'horizontalConnectionsOnly'])} onChange={v => set_(['routing', 'horizontalConnectionsOnly'], v)} />
        </Field>
        <Field label="Visibility mode">
          <Select
            value={val(['routing', 'visibilityMode'])}
            onChange={v => set_(['routing', 'visibilityMode'], v)}
            options={[
              { value: 'default', label: 'Default (main flows only)' },
              { value: 'guided', label: 'Guided (main + secondary)' },
              { value: 'focus', label: 'Focus (filtered)' },
              { value: 'full', label: 'Full (all layers)' },
            ]}
          />
        </Field>
        <Field label="Cross-lane top buffer" hint="Distance from lane edge to cross-lane routing bands">
          <Num value={val(['routing', 'crossLaneLaneTopBufferPx'])} onChange={v => set_(['routing', 'crossLaneLaneTopBufferPx'], v)} min={0} max={80} unit="px" />
        </Field>
      </Section>

      {/* ── Decision Lane Affinity ───────────────────────────────── */}
      <Section title="Decision Lane Affinity">
        <Field label="Mode" hint="How gateway lane affinity recommendations are applied">
          <Select
            value={val(['routing', 'decisionLaneAffinity', 'mode'])}
            onChange={v => set_(['routing', 'decisionLaneAffinity', 'mode'], v)}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'advisory', label: 'Advisory (log only)' },
              { value: 'adaptive', label: 'Adaptive (auto-apply)' },
            ]}
          />
        </Field>
        <Field label="Min outgoing edges" hint="Minimum edges to trigger analysis">
          <Num value={val(['routing', 'decisionLaneAffinity', 'minOutgoingEdges'])} onChange={v => set_(['routing', 'decisionLaneAffinity', 'minOutgoingEdges'], v)} min={1} max={10} />
        </Field>
        <Field label="Dominant ratio threshold" hint="If ≥ this % of branches share a lane, move gateway there">
          <Slider
            value={val(['routing', 'decisionLaneAffinity', 'minDominantOutgoingRatio'])}
            onChange={v => set_(['routing', 'decisionLaneAffinity', 'minDominantOutgoingRatio'], v)}
            min={0.3} max={1.0} step={0.05}
            format={v => `${Math.round(v * 100)}%`}
          />
        </Field>
      </Section>

      {/* ── Protected Structures ─────────────────────────────────── */}
      <Section title="Protected Structures">
        <Field label="Preserve primary spine" hint="Prevent spatial negotiation from disrupting the main flow chain">
          <Toggle value={val(['routing', 'protectedStructures', 'preservePrimarySpine'])} onChange={v => set_(['routing', 'protectedStructures', 'preservePrimarySpine'], v)} />
        </Field>
        <Field label="Preserve decision symmetry" hint="Keep decision gateways symmetric around outgoing branches">
          <Toggle value={val(['routing', 'protectedStructures', 'preserveDecisionSymmetry'])} onChange={v => set_(['routing', 'protectedStructures', 'preserveDecisionSymmetry'], v)} />
        </Field>
        <Field label="Preserve parallel lanes" hint="Maintain parallel lane structure during adjustments">
          <Toggle value={val(['routing', 'protectedStructures', 'preserveParallelLanes'])} onChange={v => set_(['routing', 'protectedStructures', 'preserveParallelLanes'], v)} />
        </Field>
      </Section>

      {/* ── Heuristic Tuning ─────────────────────────────────────── */}
      <Section title="Shape & Heuristic Tuning">
        <Field label="Event diameter">
          <Num value={val(['heuristics', 'eventSize'])} onChange={v => set_(['heuristics', 'eventSize'], v)} min={16} max={80} unit="px" />
        </Field>
        <Field label="Decision diamond size">
          <Num value={val(['heuristics', 'decisionSize'])} onChange={v => set_(['heuristics', 'decisionSize'], v)} min={20} max={100} unit="px" />
        </Field>
        <Field label="Task height">
          <Num value={val(['heuristics', 'taskHeight'])} onChange={v => set_(['heuristics', 'taskHeight'], v)} min={20} max={120} unit="px" />
        </Field>
        <Field label="Boundary band gap" hint="Min gap from lane edge to boundary event centre">
          <Num value={val(['heuristics', 'boundaryBandGapPx'])} onChange={v => set_(['heuristics', 'boundaryBandGapPx'], v)} min={8} max={100} unit="px" />
        </Field>
        <Field label="Estimated char width" hint="Average px per character for label sizing">
          <Num value={val(['heuristics', 'estimatedCharWidth'])} onChange={v => set_(['heuristics', 'estimatedCharWidth'], v)} min={3} max={12} step={0.1} unit="px" />
        </Field>
        <Field label="Text padding X" hint="Horizontal padding inside node labels">
          <Num value={val(['heuristics', 'textPaddingX'])} onChange={v => set_(['heuristics', 'textPaddingX'], v)} min={4} max={40} unit="px" />
        </Field>
        <Field label="Lane spacious factor" hint="Extra height multiplier in spacious channel mode">
          <Slider
            value={val(['heuristics', 'laneSpaciousFactor'])}
            onChange={v => set_(['heuristics', 'laneSpaciousFactor'], v)}
            min={0} max={1} step={0.05}
            format={v => `${Math.round(v * 100)}%`}
          />
        </Field>
      </Section>

      {/* ── Quality Penalties ────────────────────────────────────── */}
      <Section title="Quality Scoring Penalties">
        <Field label="Bend penalty" hint="Cost per elbow/bend in routing — higher = straighter edges preferred">
          <Slider value={val(['quality', 'bendPenalty'])} onChange={v => set_(['quality', 'bendPenalty'], v)} min={0} max={0.5} step={0.01} format={v => v.toFixed(2)} />
        </Field>
        <Field label="Crossing penalty" hint="Cost per edge-edge crossing — higher = crossings avoided more aggressively">
          <Slider value={val(['quality', 'crossingPenalty'])} onChange={v => set_(['quality', 'crossingPenalty'], v)} min={0} max={0.5} step={0.01} format={v => v.toFixed(2)} />
        </Field>
        <Field label="Collision penalty" hint="Cost per node overlap — should stay high">
          <Slider value={val(['quality', 'collisionPenalty'])} onChange={v => set_(['quality', 'collisionPenalty'], v)} min={0} max={1} step={0.05} format={v => v.toFixed(2)} />
        </Field>
      </Section>
    </div>
  );
};
