import type { ExtensionContext } from "vscode";
import { initTelemetrySettings, BASClientFactory, BASTelemetryClient } from "@sap/swa-for-sapbas-vsx";
import { getLogger } from "../logger/logger-wrapper";
import * as path from "path";

/**
 * A Simple Wrapper for reporting usage analytics
 */
export class AnalyticsWrapper {
  // Event types used by Application Wizard
  private static readonly EVENT_TYPES = {
    PROJECT_GENERATION_STARTED: "Project generation started",
    PROJECT_GENERATOR_SELECTED: "Project generator selected",
    PROJECT_GENERATOR_CLOSED: "Project generator was closed manually",
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

  public static createTracker(context: ExtensionContext): void {
    try {
      const packageJson = require(path.join(context.extensionPath, "package.json"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      getLogger().info(`SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`);
    } catch (error) {
      getLogger().error(error);
    }
  }

  private static report(opt: { eventName: string; properties?: any }): void {
    // We want to report only if we are not in Local VSCode environment
    const eventName = opt.eventName;
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker().report(opt.eventName, opt.properties);
      getLogger().trace("SAP Web Analytics tracker was called", {
        eventName,
      });
    } else {
      getLogger().trace("SAP Web Analytics tracker was not called because LANDSCAPE_ENVIRONMENT is not set", {
        eventName,
      });
    }
  }

  public static updateGeneratorStarted(): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATION_STARTED;
      AnalyticsWrapper.startTime = Date.now();
      AnalyticsWrapper.report({ eventName });
    } catch (error) {
      getLogger().error(error);
    }
  }

  public static updateGeneratorSelected(generatorName: string): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATOR_SELECTED;
      AnalyticsWrapper.startTime = Date.now();
      const properties = { generatorName };
      AnalyticsWrapper.report({ eventName, properties });
    } catch (error) {
      getLogger().error(error);
    }
  }

  public static updateGeneratorEnded(generatorName: string): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY;
      const endTime = Date.now();
      const generationTimeMilliSec = endTime - AnalyticsWrapper.startTime;
      const generationTimeSec = Math.round(generationTimeMilliSec / 1000);
      const properties: any = {
        generatorName,
        generationTime: generationTimeSec.toString(),
      };
      AnalyticsWrapper.report({ eventName, properties });
    } catch (error) {
      getLogger().error(error);
    }
  }

  public static updateGeneratorClosedManually(
    generatorName: string,
    wizardStepName: string,
    currentStep: number,
    totalNumOfSteps: number,
  ): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_GENERATOR_CLOSED;
      const properties: any = {
        generatorName,
        wizardStepName,
        currentStep,
        totalNumOfSteps,
      };
      AnalyticsWrapper.report({ eventName, properties });
    } catch (error) {
      getLogger().error(error);
    }
  }
}
