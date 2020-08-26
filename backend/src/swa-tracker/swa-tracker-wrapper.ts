import { SWATracker } from "@sap/swa-for-sapbas-vsx";
import { getLogger } from "../logger/logger-wrapper";
import _ = require("lodash");

const YEOMAN_UI = "Application Wizard";

// Event types used by Application Wizard
const EVENT_TYPES = {
	PROJECT_GENERATION_STARTED: "Project generation started",
	PROJECT_GENERATED_SUCCESSFULLY: "Project generated successfully",
	PROJECT_GENERATION_FAILED: "Project generation failed",
	EXPLORE_AND_INSTALL_GENERATORS_LINK: "Explore and Install Generators link",
	PREVIOUS_STEP: "One of the previous steps is clicked"
}; 

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) SWATracker
 * implementation.
 */

const ERROR_ANALYTICS_TRACKER_NOT_INITIALIZED = 'Analytics tracker has not yet been initialized!';

let swaTracker: SWATracker;

function isInitialized(): boolean {
	return (swaTracker !== undefined ) ? true : false;
}

function initSWATracker(newSwaTracker: SWATracker) {
	swaTracker = newSwaTracker;
}

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the swaTracker throughout our Extension.
 *
 * @returns { SWATracker }
 */
export function getSWA(): SWATracker {
	if (isInitialized() === false) {
		throw Error(ERROR_ANALYTICS_TRACKER_NOT_INITIALIZED);
	}
	return swaTracker;
}

export function createSWATracker() {
	const swaTracker = new SWATracker(
		"SAPSE",
		YEOMAN_UI,
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
	initSWATracker(swaTracker);
	getLogger().info(`SAP Web Analytics tracker was created for ${YEOMAN_UI}`);
}

export function updateGeneratorStarted(generatorName: string, startTime: number) {
	const eventType = EVENT_TYPES.PROJECT_GENERATION_STARTED;
	let customEvents = [generatorName];
	getSWA().track(eventType, customEvents);
	getLogger().trace("SAP Web Analytics tracker was called and start time was initialized", {
		eventType, generatorName, startTime, customEvents});
}

export function updateGeneratorEnded(generatorName: string, isSucceeded: boolean, startTime: number, errorMessage?: string) {
	if (_.isNil(startTime)) {
		getLogger().error("Start generation time was not initialized");
		return;
	}
	
	let eventType = EVENT_TYPES.PROJECT_GENERATED_SUCCESSFULLY;
	if (!isSucceeded) {
		eventType = EVENT_TYPES.PROJECT_GENERATION_FAILED;
	}

	const endTime = Date.now();
	const generationTimeMilliSec = endTime - startTime;
	const generationTimeSec = Math.round(generationTimeMilliSec/1000);
	let customEvents = [generatorName, generationTimeSec.toString()];
	if (!_.isNil(errorMessage)) {
		customEvents.push(errorMessage);
	}
	getSWA().track(eventType, customEvents);
	getLogger().trace("SAP Web Analytics tracker was called", 
		{eventType, generatorName, generationTimeSec, generationTimeMilliSec, endTime, startTime, customEvents, errorMessag});
}

export function updateExploreAndInstallGeneratorsLinkClicked() {
	const eventType = EVENT_TYPES.EXPLORE_AND_INSTALL_GENERATORS_LINK;
	getSWA().track(eventType);
	getLogger().trace("SAP Web Analytics tracker was called", {eventType});
}

export function updateOneOfPreviousStepsClicked(generatorName: string) {
	const eventType = EVENT_TYPES.PREVIOUS_STEP;
	let customEvents = [generatorName];
	getSWA().track(eventType, customEvents);
	getLogger().trace("SAP Web Analytics tracker was called", {eventType, generatorName, customEvents});  
}
