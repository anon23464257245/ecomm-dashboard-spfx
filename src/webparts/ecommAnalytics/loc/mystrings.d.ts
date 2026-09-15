declare interface IEcommAnalyticsWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  ApiBaseUrlFieldLabel: string;
  ApiBaseUrlFieldDescription: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
}

declare module 'EcommAnalyticsWebPartStrings' {
  const strings: IEcommAnalyticsWebPartStrings;
  export = strings;
}
