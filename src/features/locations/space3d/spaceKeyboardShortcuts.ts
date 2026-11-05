import type { SpaceBuilderEvent, SpaceBuilderState } from './spaceBuilderReducer';

export type SpaceKeyCommand =
  | { kind: 'ignore' }
  | { kind: 'toggle_hud' }
  | { kind: 'undo' }
  | { kind: 'redo' }
  | { kind: 'dispatch'; event: SpaceBuilderEvent }
  | { kind: 'rotate_selected_object'; deltaDeg: number }
  | { kind: 'delete_selected_object'; objectId: string }
  | { kind: 'delete_selected_plant'; plantId: string }
  | { kind: 'reset_selected_wall'; wallId: string }
  | { kind: 'delete_selected_vertex'; vertexIndex: number };

export interface ResolveSpaceKeyInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  isInputFocused?: boolean;
  hasModalOpen?: boolean;
}

export function resolveSpaceKeyCommand(
  input: ResolveSpaceKeyInput,
  state: SpaceBuilderState,
): SpaceKeyCommand {
  if (input.isInputFocused || input.hasModalOpen) {
    return { kind: 'ignore' };
  }

  const { key } = input;
  const isMod = Boolean(input.ctrlKey || input.metaKey);
  const isShift = Boolean(input.shiftKey);
  const lowerKey = key.toLowerCase();

  // Tab NEVER hides HUD, preserving accessibility focus (WCAG)
  if (key === 'Tab') {
    return { kind: 'ignore' };
  }

  // Undo: Ctrl+Z / Cmd+Z (without Shift) in ANY mode
  if (isMod && !isShift && lowerKey === 'z') {
    return { kind: 'undo' };
  }

  // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z in ANY mode
  if ((isMod && lowerKey === 'y') || (isMod && isShift && lowerKey === 'z')) {
    return { kind: 'redo' };
  }

  // If another Ctrl/Cmd combo was pressed, avoid triggering single-key shortcuts
  if (isMod) {
    return { kind: 'ignore' };
  }

  // Escape Ladder
  if (key === 'Escape') {
    return { kind: 'dispatch', event: { type: 'ESCAPE_STEP' } };
  }

  // Toggle HUD (h / H)
  if (lowerKey === 'h') {
    return { kind: 'toggle_hud' };
  }

  // Numeric Mode Switching (1, 2, 3)
  if (key === '1') {
    return {
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'live' },
    };
  }

  if (key === '2') {
    if (state.primaryMode === 'build') {
      const nextSubMode = state.buildSubMode === 'architecture' ? 'props' : 'architecture';
      return {
        kind: 'dispatch',
        event: { type: 'SET_BUILD_SUBMODE', subMode: nextSubMode },
      };
    }
    return {
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'build' },
    };
  }

  if (key === '3') {
    return {
      kind: 'dispatch',
      event: { type: 'SET_PRIMARY_MODE', mode: 'planting' },
    };
  }

  // Inspect tool (v / V)
  if (lowerKey === 'v') {
    return {
      kind: 'dispatch',
      event: { type: 'SET_TOOL', tool: 'inspect' },
    };
  }

  // Universal verb: Rotate (r / R)
  if (lowerKey === 'r') {
    if (state.selectedObjectId !== null) {
      return {
        kind: 'rotate_selected_object',
        deltaDeg: isShift ? -90 : 90,
      };
    }
    if (state.activeTool === 'place_object') {
      const delta = isShift ? 270 : 90;
      const nextRotation = (state.objectRotationDeg + delta) % 360;
      return {
        kind: 'dispatch',
        event: { type: 'SET_OBJECT_ROTATION', rotationDeg: nextRotation },
      };
    }
    return { kind: 'ignore' };
  }

  // Universal verb: Delete / Backspace
  if (key === 'Delete' || key === 'Backspace') {
    if (state.selectedObjectId !== null) {
      return {
        kind: 'delete_selected_object',
        objectId: state.selectedObjectId,
      };
    }
    if (state.selectedPlantId !== null) {
      const isStaged = state.stagedPlants.some((p) => p.id === state.selectedPlantId);
      if (isStaged) {
        return {
          kind: 'dispatch',
          event: { type: 'REMOVE_STAGED_PLANT', plantId: state.selectedPlantId },
        };
      }
      return {
        kind: 'delete_selected_plant',
        plantId: state.selectedPlantId,
      };
    }
    if (state.selectedWallId !== null) {
      return {
        kind: 'reset_selected_wall',
        wallId: state.selectedWallId,
      };
    }
    if (state.selectedVertexIndex !== null) {
      return {
        kind: 'delete_selected_vertex',
        vertexIndex: state.selectedVertexIndex,
      };
    }
    return { kind: 'ignore' };
  }

  // Contextual sub-tools (q, w, e, t)
  if (state.primaryMode === 'build') {
    if (state.buildSubMode === 'architecture') {
      if (lowerKey === 'q') {
        return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'edit_boundary' } };
      }
      if (lowerKey === 'w') {
        return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'walls' } };
      }
      if (lowerKey === 'e') {
        return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'draw_path' } };
      }
      if (lowerKey === 't') {
        return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'roof' } };
      }
    } else if (state.buildSubMode === 'props') {
      if (lowerKey === 'q') {
        return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'place_object' } };
      }
    }
  } else if (state.primaryMode === 'planting') {
    if (lowerKey === 'q') {
      return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'plant_single' } };
    }
    if (lowerKey === 'w') {
      return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'plant_line' } };
    }
    if (lowerKey === 'e') {
      return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'plant_fill_sector' } };
    }
    if (lowerKey === 't') {
      return { kind: 'dispatch', event: { type: 'SET_TOOL', tool: 'place_object' } };
    }
  }

  return { kind: 'ignore' };
}
