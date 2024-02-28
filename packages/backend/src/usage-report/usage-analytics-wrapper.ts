import { initTelemetrySettings, BASClientFactory, BASTelemetryClient } from "@sap/swa-for-sapbas-vsx";
import { IChildLogger } from "@vscode-logging/logger";
import * as fs from "fs";
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

  public static createTracker(logger?: IChildLogger) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      if (logger) {
        logger.info(`SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`);
      }
    } catch (error) {
      logger.error(error);
    }
  }

  private static report(eventName: string, properties?: any, logger?: IChildLogger) {
    // We want to report only if we are not in Local VSCode environment
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker().report(eventName, properties);
      logger?.trace("SAP Web Analytics tracker was called and start time was initialized", {
        eventName,
      });
    }
    else {
      logger?.trace("SAP Web Analytics tracker was not called because LANDSCAPE_ENVIRONMENT is not set", {
        eventName,
      });
    }
  }

  public static updateGeneratorStarted(logger?: IChildLogger) {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATION_STARTED;
      AnalyticsWrapper.startTime = Date.now();
      AnalyticsWrapper.report(eventName, undefined, logger);
    } catch (error) {
      logger?.error(error);
    }
  }

  public static updateGeneratorSelected(generatorName: string, logger?: IChildLogger) {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATOR_SELECTED;
      AnalyticsWrapper.startTime = Date.now();
      const properties = { generatorName };
      AnalyticsWrapper.report(eventName, properties, logger);
    } catch (error) {
      logger.error(error);
    }
  }

  public static updateGeneratorEnded(generatorName: string, logger?: IChildLogger) {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY;
      const endTime = Date.now();
      const generationTimeMilliSec = endTime - AnalyticsWrapper.startTime;
      const generationTimeSec = Math.round(generationTimeMilliSec / 1000);
      const properties: any = {
        generatorName,
        generationTime: generationTimeSec.toString(),
      };
      AnalyticsWrapper.report(eventName, properties, logger);
    } catch (error) {
      logger.error(error);
    }
  }
}
