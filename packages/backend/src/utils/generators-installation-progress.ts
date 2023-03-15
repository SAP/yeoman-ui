import * as sdk from "@sap/bas-sdk";
import { YeomanUIPanel } from "../panels/YeomanUIPanel";
import { WebviewPanel, window } from "vscode";
import messages from "../messages";

// exported for test purpose
export const internal = {
  // MAX_RETRY(150) * DELAY_MS(2000) = 5 minutes
  MAX_RETRY: 6,
  DELAY_MS: 2000,
  retries: 0,
  panelDisposed: false,
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
  while (
    !internal.panelDisposed &&
    internal.retries < internal.MAX_RETRY &&
    (await didGeneratorsFinishInstallation()) === false
  ) {
    await wait(internal.DELAY_MS);
    internal.retries++;
  }
}

function didGeneratorsFinishInstallation(): Promise<boolean | void> {
  return sdk.devspace.didBASGeneratorsFinishInstallation().catch((err) => console.log("Error: ", err));
}

export async function notifyGeneratorsInstallationProgress(
  yeomanUIPanel: YeomanUIPanel,
  webviewPanel: WebviewPanel
): Promise<void | string> {
  if (internal.retries < internal.MAX_RETRY && (await didGeneratorsFinishInstallation()) === false) {
    // notify ui on generators are being installed in background (by sending any param - this will be detected as a message of "generators are being installed...")
    void yeomanUIPanel.notifyGeneratorsChange(["installing generators"]);
    // on panel disposed - stop looping in `waitForGeneratorsInstallation` function bellow
    webviewPanel.onDidDispose(() => {
      internal.panelDisposed = true;
    });

    await waitForGeneratorsInstallation();

    if (internal.retries >= internal.MAX_RETRY) {
      // generators didn't complete installation after 5 minutes of retries..
      return window.showErrorMessage(messages.timeout_install_generators);
    }
    if (!internal.panelDisposed) {
      // notify ui on generators installation finished
      return yeomanUIPanel.notifyGeneratorsChange([]);
    }
    // reset `panelDisposed` state for next panel loading
    internal.panelDisposed = false;
  }
}
