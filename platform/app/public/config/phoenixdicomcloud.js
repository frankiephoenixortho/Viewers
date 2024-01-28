window.config = {
whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement(
        'a',
        {
          target: '_self',
          rel: 'noopener noreferrer',
          className: 'text-purple-600 line-through',
          href: '/',
        },
        React.createElement('img', {
          src: './customLogo.svg',
           className: 'w-8 h-8',
        })
      );
    },
  },

  routerBasename: '/ohif/',
  extensions: [],
  modes: [],
  showStudyList: true,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // filterQueryParam: false,
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Phoenix Ortho DICOMCloud',
        name: 'PhoenixDICOMCloud',
        wadoUriRoot: 'https://dicomcloud2.phoenixortho.net:8088/api/wadouri',
        qidoRoot: 'https://dicomcloud2.phoenixortho.net:8088/api',
        wadoRoot: 'https://dicomcloud2.phoenixortho.net:8088/api',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
};
