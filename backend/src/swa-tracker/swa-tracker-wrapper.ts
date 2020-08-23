import { SWATracker } from "@sap/swa-for-sapbas-vsx";
import { getLogger } from "../logger/logger-wrapper";

const YEOMAN_UI = "Application Wizard";

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

export const ERROR_ANALYTICS_TRACKER_NOT_INITIALIZED = 'Analytics tracker has not yet been initialized!';

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
 * @returns { IVSCodeExtLogger }
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
		(error: string | number) => {
			// TODO: Dulberg - errorListener is always called with 204 (after each call to track).
		  //console.log(error);
		  //getLogger().error(`Failed to create SAP Web Analytics tracker for ${YEOMAN_UI}`, {error, errorMessage: error.toString});
		}
	  );

	// Update the swa-tracker-wrapper with a reference to the swaTracker.
	initSWATracker(swaTracker);
	getLogger().info(`SAP Web Analytics tracker was created for ${YEOMAN_UI}`);
}