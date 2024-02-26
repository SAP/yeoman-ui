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
    const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
    try {
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      if (logger) {
        logger.info(`SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`);
      }
    } catch (error) {
      logger.error(error);
    }
  }

  public static updateGeneratorStarted(logger?: IChildLogger) {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATION_STARTED;
      AnalyticsWrapper.startTime = Date.now();

      void AnalyticsWrapper.getTracker().report(eventName);
      if (logger) {
        logger.trace("SAP Web Analytics tracker was called and start time was initialized", {
          eventName,
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }

  public static updateGeneratorSelected(generatorName: string, logger?: IChildLogger) {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATOR_SELECTED;
      AnalyticsWrapper.startTime = Date.now();
      const properties = { generatorName };
      void AnalyticsWrapper.getTracker().report(eventName, properties);
      if (logger) {
        logger.trace("SAP Web Analytics tracker was called", {
          eventName,
          properties,
        });
      }
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
      void AnalyticsWrapper.getTracker().report(eventName, properties);
      if (logger) {
        logger.trace("SAP Web Analytics tracker was called", {
          eventName,
          properties,
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
