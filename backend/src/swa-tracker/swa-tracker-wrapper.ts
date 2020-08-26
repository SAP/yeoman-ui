import { SWATracker } from "@sap/swa-for-sapbas-vsx";
import { getLogger } from "../logger/logger-wrapper";
import _ = require("lodash");

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) SWATracker
 * implementation.
 */

export class SWA {
	private static readonly YEOMAN_UI = "Application Wizard";

	// Event types used by Application Wizard
	private static readonly EVENT_TYPES = {
		PROJECT_GENERATION_STARTED: "Project generation started",
		PROJECT_GENERATED_SUCCESSFULLY: "Project generated successfully",
		PROJECT_GENERATION_FAILED: "Project generation failed",
		EXPLORE_AND_INSTALL_GENERATORS_LINK: "Explore and Install Generators link",
		PREVIOUS_STEP: "One of the previous steps is clicked"
	}; 
	
	private static readonly ERROR_ANALYTICS_TRACKER_NOT_INITIALIZED = 'Analytics tracker has not yet been initialized!';

	private static swaTracker: SWATracker;
	private static startTime: number = Date.now();

	private static isInitialized(): boolean {
		return (SWA.swaTracker !== undefined ) ? true : false;
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
	private static getSWA(): SWATracker {
		if (SWA.isInitialized() === false) {
			throw Error(SWA.ERROR_ANALYTICS_TRACKER_NOT_INITIALIZED);
		}
		return SWA.swaTracker;
	}

	public static createSWATracker() {
		const swaTracker = new SWATracker(
			"SAPSE",
			SWA.YEOMAN_UI,
			// callback for error, one such callback for all the errors we receive via all the track methods
			// error can be string (err.message) or number (response.statusCode)
			(error: string | number) => {
				if (typeof error === 'string') {
					getLogger().error("SAP Web Analytics tracker failed to track", {errorMessage: error});
				} else if (typeof error === 'number') {
					// bug in matomo-tracker: they think that success is 200 or 30[12478], so we are rechecking here
					if (!((error >= 200) && (error <= 299)) && !((error >= 300) && (error <= 399))) {
						getLogger().error("SAP Web Analytics tracker failed to track", {statusCode: error});
					}
				}
			}
		  );
	
		// Update the swa-tracker-wrapper with a reference to the swaTracker.
		SWA.initSWATracker(swaTracker);
		getLogger().info(`SAP Web Analytics tracker was created for ${SWA.YEOMAN_UI}`);
	}
	
	
	public static updateGeneratorStarted(generatorName: string) {
		const eventType = SWA.EVENT_TYPES.PROJECT_GENERATION_STARTED;
		let customEvents = [generatorName];
		SWA.startTime = Date.now();
		SWA.getSWA().track(eventType, customEvents);
		getLogger().trace("SAP Web Analytics tracker was called and start time was initialized", {
			eventType, generatorName, startTime: SWA.startTime, customEvents});
	}
	
	
	public static updateGeneratorEnded(generatorName: string, isSucceeded: boolean, errorMessage?: string) {
		let eventType = SWA.EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY;
		if (!isSucceeded) {
			eventType = SWA.EVENT_TYPES.PROJECT_GENERATION_FAILED;
		}
	
		const endTime = Date.now();
		const generationTimeMilliSec = endTime - SWA.startTime;
		const generationTimeSec = Math.round(generationTimeMilliSec/1000);
		let customEvents = [generatorName, generationTimeSec.toString()];
		if (!_.isNil(errorMessage)) {
			customEvents.push(errorMessage);
		}
		SWA.getSWA().track(eventType, customEvents);
		getLogger().trace("SAP Web Analytics tracker was called", 
			{eventType, generatorName, generationTimeSec, generationTimeMilliSec, endTime, startTime: SWA.startTime, customEvents, errorMessage});
	}
	
	
	public static updateExploreAndInstallGeneratorsLinkClicked() {
		const eventType = SWA.EVENT_TYPES.EXPLORE_AND_INSTALL_GENERATORS_LINK;
		SWA.getSWA().track(eventType);
		getLogger().trace("SAP Web Analytics tracker was called", {eventType});
	}
	
	public static updateOneOfPreviousStepsClicked(generatorName: string) {
		const eventType = SWA.EVENT_TYPES.PREVIOUS_STEP;
		let customEvents = [generatorName];
		SWA.getSWA().track(eventType, customEvents);
		getLogger().trace("SAP Web Analytics tracker was called", {eventType, generatorName, customEvents});  
	}
	
}