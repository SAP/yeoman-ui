import * as sdk from "@sap/bas-sdk";
import { YeomanUIPanel } from "../panels/YeomanUIPanel.js";
import { window } from "vscode";
import messages from "../messages.js";

// exported for test purpose
export const internal = {
  // MAX_RETRY(150) * DELAY_MS(2000) = 5 minutes
  MAX_RETRY: 150,
  DELAY_MS: 2000,
  retries: 0,
  panelDisposed: false,
  waitForGeneratorsInstallation,
};

/*
 * This is a promise resolver for async timeout
 * @param {number} timeout to wait.
 * returns Promise<void>
 */
async function wait(timeout: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

/** wait until installation finished or max retries or panel disposed*/
async function waitForGeneratorsInstallation(): Promise<void> {
  // don't run in background when panel is disposed
  while (await shouldWaitForGeneratorsInstallation()) {
    await wait(internal.DELAY_MS);
    internal.retries++;
  }
}

function didGeneratorsFinishInstallation(): Promise<boolean | void> {
  return sdk.devspace.didBASGeneratorsFinishInstallation().catch((err) => console.log("Error: ", err));
}

async function shouldWaitForGeneratorsInstallation(): Promise<boolean> {
  return (
    !internal.panelDisposed &&
    internal.retries < internal.MAX_RETRY &&
    // compare result to `false` is necessary in case of error returning `undefined`
    (await didGeneratorsFinishInstallation()) === false
  );
}

export async function notifyGeneratorsInstallationProgress(yeomanUIPanel: YeomanUIPanel): Promise<void | string> {
  // reset `panelDisposed` state for each call (each call is per webview panel creation)
  internal.panelDisposed = false;

  if (await shouldWaitForGeneratorsInstallation()) {
    // notify ui on generators are being installed in background (by sending any param - this will be detected as a message of "generators are being installed...")
    void yeomanUIPanel.notifyGeneratorsChange(["installing generators"]);
    // on panel disposed - stop looping in `waitForGeneratorsInstallation` function bellow
    if (yeomanUIPanel["webViewPanel"]) {
      yeomanUIPanel["webViewPanel"].onDidDispose(() => {
        internal.panelDisposed = true;
      });
    }
    await waitForGeneratorsInstallation();

    if (internal.retries >= internal.MAX_RETRY) {
      // generators didn't complete installation after 5 minutes of retries.
      return window.showErrorMessage(messages.timeout_install_generators);
    }

    // notify ui on generators installation finished (in case of panelDisposed - will just reset the prompt message for next time)
    yeomanUIPanel.notifyGeneratorsChange([]);
  }
}
