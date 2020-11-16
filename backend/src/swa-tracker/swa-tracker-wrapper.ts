import { SWATracker } from "@sap/swa-for-sapbas-vsx";
import { IChildLogger } from "@vscode-logging/logger";
import _ = require("lodash");

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) SWATracker
 * implementation.
 */

export class SWA {
	private static readonly YEOMAN_UI = "ApplicationWizard";

	// Event types used by Application Wizard
	private static readonly EVENT_TYPES = {
		PROJECT_GENERATION_STARTED: "Project generation started",
		PROJECT_GENERATED_SUCCESSFULLY: "Project generated successfully",
		PROJECT_GENERATION_FAILED: "Project generation failed",
		EXPLORE_AND_INSTALL_GENERATORS_LINK: "Explore and Install Generators link",
		PREVIOUS_STEP: "One of the previous steps is clicked"
	}; 

	private static swaTracker: SWATracker;
	private static startTime: number = Date.now();

	private static isInitialized(): boolean {
		return !_.isUndefined(SWA.swaTracker);
	}
	
	private static initSWATracker(newSwaTracker: SWATracker) {
		SWA.swaTracker = newSwaTracker;
	}
	
	/**
	 * Note the use of a getter function so the value would be lazy resolved on each use.
	 * This enables concise and simple consumption of the swaTracker throughout our Extension.
	 *
	 * @returns { SWATracker }
	 */
	public static getSWATracker(): SWATracker {
		if (SWA.isInitialized() === false) {
			return;
		}
		return SWA.swaTracker;
	}

	public static createSWATracker(logger?: IChildLogger) {
		try {
			const swaTracker = new SWATracker(
				"SAPSE",
				SWA.YEOMAN_UI,
				// callback for error, one such callback for all the errors we receive via all the track methods
				// error can be string (err.message) or number (response.statusCode)
				(error: string | number) => {
					if (logger) {
						if (typeof error === 'string') {
							logger.error("SAP Web Analytics tracker failed to track", {errorMessage: error});
						} else if (typeof error === 'number') {
							// bug in matomo-tracker: they think that success is 200 or 30[12478], so we are rechecking here
							if (!((error >= 200) && (error <= 299)) && !((error >= 300) && (error <= 399))) {
								logger.error("SAP Web Analytics tracker failed to track", {statusCode: error});
							}
						}
					}
				}
			);
		
			// Update the swa-tracker-wrapper with a reference to the swaTracker.
			SWA.initSWATracker(swaTracker);
			if (logger) {
				logger.info(`SAP Web Analytics tracker was created for ${SWA.YEOMAN_UI}`);
			}
		} catch (error) {
			logger.error(error);
		}
	}
	
	
	public static updateGeneratorStarted(generatorName: string, logger?: IChildLogger) {
		try {
			if (SWA.isInitialized()) {
				const eventType = SWA.EVENT_TYPES.PROJECT_GENERATION_STARTED;
				const customEvents = [generatorName];
				SWA.startTime = Date.now();
				SWA.getSWATracker().track(eventType, customEvents);
				if (logger) {
					logger.trace("SAP Web Analytics tracker was called and start time was initialized", {
						eventType, generatorName, startTime: SWA.startTime, customEvents});
				}
			}
		} catch (error) {
			logger.error(error);
		}
	}
	
	
	public static updateGeneratorEnded(generatorName: string, isSucceeded: boolean, logger?: IChildLogger, errorMessage?: string) {
		try {
			if (SWA.isInitialized()) {
				const eventType = isSucceeded ? 
					SWA.EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY : SWA.EVENT_TYPES.PROJECT_GENERATION_FAILED;
			
				const endTime = Date.now();
				const generationTimeMilliSec = endTime - SWA.startTime;
				const generationTimeSec = Math.round(generationTimeMilliSec/1000);
				const customEvents = [generatorName, generationTimeSec.toString()];
				if (!_.isNil(errorMessage)) {
					customEvents.push(errorMessage);
				}
				SWA.getSWATracker().track(eventType, customEvents);
				if (logger) {
					logger.trace("SAP Web Analytics tracker was called", 
						{eventType, generatorName, generationTimeSec, generationTimeMilliSec, endTime, startTime: SWA.startTime, customEvents, errorMessage});
				}
			}
		} catch (error) {
			logger.error(error);
		}
	}
	
	
	public static updateExploreAndInstallGeneratorsLinkClicked(logger?: IChildLogger) {
		try {
			if (SWA.isInitialized()) {
				const eventType = SWA.EVENT_TYPES.EXPLORE_AND_INSTALL_GENERATORS_LINK;
				SWA.getSWATracker().track(eventType);
				if (logger) {
					logger.trace("SAP Web Analytics tracker was called", {eventType});
				}
			}
		} catch (error) {
			logger.error(error);
		}
	}
	
	public static updateOneOfPreviousStepsClicked(generatorName: string, logger?: IChildLogger) {
		try {
			if (SWA.isInitialized()) {
				const eventType = SWA.EVENT_TYPES.PREVIOUS_STEP;
				const customEvents = [generatorName];
				SWA.getSWATracker().track(eventType, customEvents);
				if (logger) {
					logger.trace("SAP Web Analytics tracker was called", {eventType, generatorName, customEvents});  
				}
			}
		} catch (error) {
			logger.error(error);
		}
	}
}
