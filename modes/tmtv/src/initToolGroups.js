export const toolGroupIds = {
  CT: 'ctToolGroup',
  PT: 'ptToolGroup',
  Fusion: 'fusionToolGroup',
  MIP: 'mipToolGroup',
  default: 'default',
};

function initToolGroups(toolNames, Enums, ToolGroupService) {
  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.DragProbe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.Magnify },
    ],
    // enabled
    disabled: [{ toolName: toolNames.Crosshairs }],
  };

  const toolsConfig = {
    [toolNames.Crosshairs]: {
      viewportIndicators: false,
      autoPan: {
        enabled: true,
        panSize: 10,
      },
    },
  };

  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.CT,
    tools,
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.PT,
    {
      active: tools.active,
      passive: [
        ...tools.passive,
        { toolName: toolNames.RectangleROIStartEndThreshold },
      ],
      disabled: tools.disabled,
    },
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.Fusion,
    tools,
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.default,
    tools,
    toolsConfig
  );

  const mipTools = {
    active: [
      {
        toolName: toolNames.VolumeRotateMouseWheel,
      },
      {
        toolName: toolNames.MipJumpToClick,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
    ],
  };

  const mipToolsConfig = {
    [toolNames.VolumeRotateMouseWheel]: {
      rotateIncrementDegrees: 0.1,
    },
    [toolNames.MipJumpToClick]: {
      targetViewportIds: ['ptAXIAL', 'ptCORONAL', 'ptSAGITTAL'],
    },
  };

  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.MIP,
    mipTools,
    mipToolsConfig
  );
}

export default initToolGroups;
