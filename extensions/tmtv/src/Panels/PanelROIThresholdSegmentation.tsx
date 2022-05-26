import React, { useEffect, useState, useRef } from 'react';
import { utilities as csToolsUtils } from '@cornerstonejs/core';
import PropTypes from 'prop-types';
import {
  Input,
  SegmentationTable,
  Select,
  Button,
  ButtonGroup,
  Dialog,
} from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import createAndDownloadTMTVReport from '../utils/createAndDownloadTMTVReport';

const options = [
  { value: 'roiStat', label: 'Percentage of Max Value' },
  { value: 'range', label: 'Range Threshold' },
];

export default function PanelRoiThresholdSegmentation({
  servicesManager,
  commandsManager,
}) {
  const { t } = useTranslation('PanelSUV');
  const [showConfig, setShowConfig] = useState(false);
  const [labelmapLoading, setLabelmapLoading] = useState(false);
  const [activeSegmentationId, setActiveSegmentationId] = useState('');
  const [segmentations, setSegmentations] = useState([]);
  const [tmtvValue, setTmtvValue] = useState(0);

  // keep track of old segmentations
  const oldSegmentations = useRef([]);

  const {
    SegmentationService,
    UINotificationService,
    UIDialogService,
  } = servicesManager.services;

  const [config, setConfig] = useState({
    strategy: 'roiStat',
    minValue: 0,
    maxValue: 100,
    numSlices: 1,
    weight: 0.41,
  });

  // useEffect(() => {
  //   // ~~ Initial
  //   setSegmentations(SegmentationService.getSegmentations());

  //   // ~~ Subscription
  //   const added = SegmentationService.EVENTS.SEGMENTATION_ADDED;
  //   const updated = SegmentationService.EVENTS.SEGMENTATION_UPDATED;
  //   const removed = SegmentationService.EVENTS.SEGMENTATION_REMOVED;
  //   const subscriptions = [];

  //   [added, updated, removed].forEach(evt => {
  //     subscriptions.push(
  //       SegmentationService.subscribe(evt, () => {
  //         if (isMounted.current) {
  //           const segmentations = SegmentationService.getSegmentations();
  //           setSegmentations(segmentations);
  //         }
  //       }).unsubscribe
  //     );
  //   });

  //   return () => {
  //     subscriptions.forEach(unsub => {
  //       unsub();
  //     });
  //   };
  // }, [SegmentationService]);

  // // calculate the suv peak value for each segmentation
  // // check if the segmentations have changed compared to the old segmentations
  // useEffect(() => {
  //   if (oldSegmentations.current.length !== segmentations.length) {
  //     const newSegmentation = segmentations.find(seg => {
  //       // check if the segmentationId is not in the old segmentations
  //       return !oldSegmentations.current.find(oldSeg => oldSeg.id === seg.id);
  //     });

  //     if (newSegmentation) {
  //       setActiveSegmentationId(newSegmentation.id);
  //     }
  //     oldSegmentations.current = segmentations;
  //   }
  // }, [segmentations]);

  // useEffect(() => {
  //   const subscription = SegmentationService.subscribe(
  //     SegmentationService.EVENTS.SEGMENTATION_VISIBILITY_CHANGED,
  //     ({ segmentation }) => {
  //       if (isMounted.current) {
  //         const { id } = segmentation;
  //         const { viewport } = commandsManager.runCommand(
  //           'getActiveViewportsEnabledElement'
  //         );

  //         hideSegmentController.toggleSegmentationVisibility(
  //           viewport.element,
  //           id
  //         );
  //       }
  //     }
  //   );
  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, [SegmentationService]);

  const handleCreateLabelmap = () => {
    setLabelmapLoading(true);
    commandsManager.runCommand('createNewLabelmapForPT', {}).then(() => {
      setLabelmapLoading(false);
    });
  };

  const handleRoiThresholding = () => {
    const labelmap = SegmentationService.getSegmentation(activeSegmentationId);

    if (!labelmap) {
      UINotificationService.show({
        title: 'Segmentation Service',
        message: 'No Active Segmentation is Selected',
        type: 'error',
      });
      return;
    }

    const thresholdedLabelmap = commandsManager.runCommand('thresholdVolume', {
      config,
      labelmapUID: activeSegmentationId,
    });

    const lesionStats = commandsManager.runCommand('getLesionStats', {
      labelmap: thresholdedLabelmap,
    });

    // Todo: right now it thresholds based on the active viewport's volume
    const suvPeak = commandsManager.runCommand('calculateSuvPeak', {
      labelmap: thresholdedLabelmap,
    });

    const lesionGlyoclysisStats = commandsManager.runCommand(
      'calculateLesionGlycolysis',
      { lesionStats }
    );

    // update segDetails with the suv peak for the active segmentation
    labelmap.cachedStats = {
      ...lesionStats,
      ...suvPeak,
      ...lesionGlyoclysisStats,
    };

    const notYetUpdatedAtSource = true;
    SegmentationService.update(
      activeSegmentationId,
      labelmap,
      notYetUpdatedAtSource
    );
    handleTMTVCalculation();
  };

  const handleSegmentationEdit = id => {
    onSegmentationItemEditHandler({ id, SegmentationService, UIDialogService });
  };

  const handleSegmentationDelete = segmentationId => {
    SegmentationService.remove(segmentationId);
    handleTMTVCalculation();
  };

  const handleTMTVCalculation = () => {
    const labelmaps = commandsManager.runCommand('getLabelmapVolumes', {});

    if (labelmaps.length === 0) {
      setTmtvValue(0);
      return;
    }

    const tmtv = csToolsUtils.segmentation.calculateTMTV(labelmaps);
    setTmtvValue(tmtv.toFixed(4));
  };

  const handleSegmentationClick = segmentationId => {
    const {
      viewport: { element },
    } = commandsManager.runCommand('getActiveViewportsEnabledElement', {});
    activeLabelmapController.setActiveLabelmapByLabelmapUID(
      element,
      segmentationId
    );
  };

  const handleSegmentationHide = segmentationId => {
    SegmentationService.toggleSegmentationsVisibility([segmentationId]);
  };

  const handleSegmentationHideAll = segmentationIds => {
    SegmentationService.toggleSegmentationsVisibility(segmentationIds);
  };

  const handleExportClick = () => {
    // General Segmentation information
    const segReport = commandsManager.runCommand('getSegmentationReport', {});
    const tlg = commandsManager.runCommand('getTotalLesionGlycolysis', {
      segmentations: SegmentationService.getSegmentations(),
    });

    const additionalReportRows = [
      { key: 'Total Metabolic Tumor Volume', value: { tmtv: tmtvValue } },
      { key: 'Total Lesion Glycolysis', value: { tlg: tlg.toFixed(4) } },
      { key: 'Threshold Configuration', value: { ...config } },
    ];

    createAndDownloadTMTVReport(segReport, additionalReportRows);
  };

  const handleRTExport = () => {
    // get all the RoiThresholdManual Rois
    const toolStates = getDefaultToolStateManager();

    // iterate inside all the frameOfReferenceUIDs inside the toolState
    let roiThresholdManualRois = [];

    const framesOfReference = toolStates.getFramesOfReference();
    framesOfReference.forEach(frameOfReferenceUID => {
      const toolState = toolStates.get(
        frameOfReferenceUID,
        'RectangleRoiStartEndThreshold'
      );

      if (toolState) {
        roiThresholdManualRois = roiThresholdManualRois.concat(toolState);
      }
    });

    commandsManager.runCommand('saveRTReport', {
      toolState: roiThresholdManualRois,
    });
  };

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      <div className="flex flex-col items-center justify-center h-auto px-1 py-4">
        <div className="text-center">
          <span className="text-base font-bold tracking-wide text-white uppercase">
            {t('Roi Threshold Segmentation')}
          </span>
        </div>
      </div>
      <div>
        <div className="flex mx-4 mb-4 space-x-4">
          <Button
            color="primary"
            onClick={() => handleCreateLabelmap()}
            className="text-xs text-white border-b border-transparent "
          >
            New Label
          </Button>
          <Button
            color="primary"
            onClick={() => handleRoiThresholding()}
            className="text-xs text-white border-b border-transparent "
          >
            Run
          </Button>
        </div>
        <div
          className="flex items-center justify-around h-8 mb-2 border-t outline-none cursor-pointer select-none bg-secondary-dark first:border-0 border-secondary-light"
          onClick={() => {
            setShowConfig(!showConfig);
          }}
        >
          <div className="px-4 text-base text-white">{t('Configuration')}</div>
        </div>
        {showConfig && (
          <RoiThresholdConfiguration
            config={config}
            setConfig={setConfig}
            commandsManager={commandsManager}
          />
        )}
        {labelmapLoading ? (
          <div className="text-white">Loading Segmentation Panel ... </div>
        ) : null}
        {tmtvValue && (
          <div className="flex items-baseline justify-between px-2 py-1 mt-10 bg-secondary-dark">
            <span className="text-base font-bold tracking-widest text-white uppercase">
              {'TMTV:'}
            </span>
            <div className="text-white">{`${tmtvValue} mL`}</div>
          </div>
        )}
        {/* show segmentation table */}
        <div className="mt-4">
          {segmentations && segmentations.length && (
            <SegmentationTable
              title={t('Segmentations')}
              amount={segmentations.length}
              segmentations={segmentations}
              activeSegmentationId={activeSegmentationId}
              onClick={id => {
                setActiveSegmentationId(id);
                handleSegmentationClick(id);
              }}
              onToggleVisibility={id => {
                handleSegmentationHide(id);
              }}
              onToggleVisibilityAll={ids => {
                handleSegmentationHideAll(ids);
              }}
              onDelete={id => {
                handleSegmentationDelete(id);
              }}
              onEdit={id => {
                handleSegmentationEdit(id);
              }}
            />
          )}
        </div>
        {segmentations?.length ? (
          <div className="flex justify-center mt-4 space-x-2">
            <ButtonGroup color="black" size="inherit">
              <Button
                className="px-2 py-2 text-base"
                onClick={handleExportClick}
              >
                {t('Export CSV')}
              </Button>
            </ButtonGroup>
            <ButtonGroup color="black" size="inherit">
              <Button className="px-2 py-2 text-base" onClick={handleRTExport}>
                {t('Create RT Report')}
              </Button>
            </ButtonGroup>
          </div>
        ) : null}
      </div>
    </div>
  );
}

PanelRoiThresholdSegmentation.propTypes = {
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }),
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      SegmentationService: PropTypes.shape({
        getSegmentation: PropTypes.func.isRequired,
        getSegmentations: PropTypes.func.isRequired,
        toggleSegmentationsVisibility: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

function onSegmentationItemEditHandler({
  id,
  SegmentationService,
  UIDialogService,
}) {
  const segmentation = SegmentationService.getSegmentation(id);

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save': {
        SegmentationService.update(
          id,
          {
            ...segmentation,
            ...value,
          },
          true
        );
      }
    }
    UIDialogService.dismiss({ id: 'enter-annotation' });
  };

  UIDialogService.create({
    id: 'enter-annotation',
    centralize: true,
    isDraggable: false,
    showOverlay: true,
    content: Dialog,
    contentProps: {
      title: 'Enter your annotation',
      noCloseButton: true,
      value: { label: segmentation.label || '' },
      body: ({ value, setValue }) => {
        const onChangeHandler = event => {
          event.persist();
          setValue(value => ({ ...value, label: event.target.value }));
        };

        const onKeyPressHandler = event => {
          if (event.key === 'Enter') {
            onSubmitHandler({ value, action: { id: 'save' } });
          }
        };
        return (
          <div className="p-4 bg-primary-dark">
            <Input
              autoFocus
              className="mt-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={value.label}
              onChange={onChangeHandler}
              onKeyPress={onKeyPressHandler}
            />
          </div>
        );
      },
      actions: [
        // temp: swap button types until colors are updated
        { id: 'cancel', text: 'Cancel', type: 'primary' },
        { id: 'save', text: 'Save', type: 'secondary' },
      ],
      onSubmit: onSubmitHandler,
    },
  });
}

function RoiThresholdConfiguration({ config, setConfig, commandsManager }) {
  const { t } = useTranslation('RoiThresholdConfiguration');

  return (
    <div className="flex flex-col px-4 mb-8 space-y-4 bg-primary-dark">
      <div className="flex items-end space-x-2">
        <div className="flex flex-col w-1/2 mt-2">
          <Select
            label={t('Strategy')}
            closeMenuOnSelect={true}
            className="mr-2 bg-black border-primary-main"
            options={options}
            placeholder={'Strategy'}
            value={config.strategy}
            onChange={({ value }) => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  strategy: value,
                };
              });
            }}
          />
        </div>
        <div className="w-1/2">
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              onClick={() =>
                commandsManager.runCommand(
                  'setStartSliceForROIThresholdTool',
                  {}
                )
              }
            >
              {t('Start')}
            </Button>
          </ButtonGroup>
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              onClick={() =>
                commandsManager.runCommand('setEndSliceForROIThresholdTool', {})
              }
            >
              {t('End')}
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {config.strategy === 'roiStat' && (
        <Input
          label={t('Percentage')}
          labelClassName="text-white"
          className="mt-2 bg-black border-primary-main"
          type="text"
          containerClassName="mr-2"
          value={config.weight}
          onChange={e => {
            setConfig((prevConfig = {}) => {
              return {
                ...prevConfig,
                weight: Number(e.target.value),
              };
            });
          }}
        />
      )}
      {config.strategy !== 'roiStat' && (
        <div className="flex justify-between">
          <Input
            label={t('Min Value')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.minValue}
            onChange={e => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  minValue: Number(e.target.value),
                };
              });
            }}
          />
          <Input
            label={t('Max Value')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.maxValue}
            onChange={e => {
              setConfig((prevConfig = {}) => {
                return {
                  ...prevConfig,
                  maxValue: Number(e.target.value),
                };
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
