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
		// callback for error, one such callback for all the errors we receive via all the track methods err can be string (err.message) or number (response.statusCode)
		(error: string | number) => {
			if (typeof error === 'string') {
				getLogger().error("SAP Web Analytics tracker failed to track", {errorMessage: error});
			} else if (typeof error === 'number') {
				if ((error >= 200) && (error <= 299) ) {
					getLogger().trace("SAP Web Analytics tracker succeeded to track", {statusCode: error});
				} else {
					getLogger().error("SAP Web Analytics tracker failed to track", {statusCode: error});
				}
			}
		}
	  );

	// Update the swa-tracker-wrapper with a reference to the swaTracker.
	initSWATracker(swaTracker);
	getLogger().info(`SAP Web Analytics tracker was created for ${YEOMAN_UI}`);
}