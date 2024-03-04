import { initTelemetrySettings, BASClientFactory, BASTelemetryClient } from "@sap/swa-for-sapbas-vsx";
import { IChildLogger } from "@vscode-logging/logger";
import * as path from "path";

/**
 * A Simple Wrapper for reporting usage analytics
 */
export class AnalyticsWrapper {
  // Event types used by Application Wizard
  private static readonly EVENT_TYPES = {
    PROJECT_GENERATION_STARTED: "Project generation started",
    PROJECT_GENERATOR_SELECTED: "Project generator selected",
    PROJECT_GENERATED_SUCCESSFULLY: "Project generated successfully",
  };

  private static startTime: number = Date.now();

  /**
   * Note the use of a getter function so the value would be lazy resolved on each use.
   * This enables concise and simple consumption of the tracker throughout our Extension.
   *
   * @returns { Tracker }
   */
  public static getTracker(): BASTelemetryClient {
    return BASClientFactory.getBASTelemetryClient();
  }

  public static createTracker(logger?: IChildLogger): void {
    try {
      const packageJson = require(path.join(__dirname, "..", "package.json"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      logger?.info(`SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`);
    } catch (error: any) {
      logger?.error(error);
    }
  }

  private static report(opt: { eventName: string; properties?: any; logger?: IChildLogger }): void {
    // We want to report only if we are not in Local VSCode environment
    const eventName = opt.eventName;
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker().report(opt.eventName, opt.properties);
      opt.logger?.trace("SAP Web Analytics tracker was called", {
        eventName,
      });
    } else {
      opt.logger?.trace("SAP Web Analytics tracker was not called because LANDSCAPE_ENVIRONMENT is not set", {
        eventName,
      });
    }
  }

  public static updateGeneratorStarted(logger?: IChildLogger): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATION_STARTED;
      AnalyticsWrapper.startTime = Date.now();
      AnalyticsWrapper.report({ eventName, logger });
    } catch (error: any) {
      logger?.error(error);
    }
  }

  public static updateGeneratorSelected(generatorName: string, logger?: IChildLogger): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATOR_SELECTED;
      AnalyticsWrapper.startTime = Date.now();
      const properties = { generatorName };
      AnalyticsWrapper.report({ eventName, properties, logger });
    } catch (error: any) {
      logger?.error(error);
    }
  }

  public static updateGeneratorEnded(generatorName: string, logger?: IChildLogger): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY;
      const endTime = Date.now();
      const generationTimeMilliSec = endTime - AnalyticsWrapper.startTime;
      const generationTimeSec = Math.round(generationTimeMilliSec / 1000);
      const properties: any = {
        generatorName,
        generationTime: generationTimeSec.toString(),
      };
      AnalyticsWrapper.report({ eventName, properties, logger });
    } catch (error: any) {
      logger?.error(error);
    }
  }
}
