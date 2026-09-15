import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'EcommAnalyticsWebPartStrings';
import App from '../../app/App';
import '../../app/styles/app.css';

export interface IEcommAnalyticsWebPartProps {
  apiBaseUrl: string;
}

/**
 * Thin SPFx host — all UI lives under `src/app`.
 * Property pane `apiBaseUrl` becomes `{apiBaseUrl}/api/...` fetch origin.
 */
export default class EcommAnalyticsWebPart extends BaseClientSideWebPart<IEcommAnalyticsWebPartProps> {
  private _root: Root | undefined;

  public render(): void {
    const element: React.ReactElement = React.createElement(App, {
      apiBaseUrl: this.properties.apiBaseUrl ?? ''
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }

    this._root.render(element);
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('apiBaseUrl', {
                  label: strings.ApiBaseUrlFieldLabel,
                  description: strings.ApiBaseUrlFieldDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
