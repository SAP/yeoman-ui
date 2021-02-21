import { expect } from "chai";
import { YouiEvents } from '../src/youi-events';
import { AppWizard } from "@sap-devx/yeoman-ui-types";
import { YouiAdapter } from '../src/youi-adapter';

describe('YouiAdapter', () => {

  class TestEvents implements YouiEvents {
      public doGeneratorDone(success: boolean, message: string, selectedWorkspace: string, type: string, targetPath?: string): void {
        return;
      }
      public doGeneratorInstall(): void {
        return;
      }
      public showProgress(message?: string): void {
        return;
      }
      public getAppWizard(): AppWizard {
        return;
      }
      public executeCommand(command: string, ...rest: any[]): Thenable<any> {
        return;
      }
	}   

	const outputChannel: any = {
		appendLine: () => "",
		show: () => ""
  };
    
	const youiEvents = new TestEvents();

  describe('#prompt()', () => {
        it('passes null call back', async () => {
            const youiAdapter = new YouiAdapter(youiEvents, outputChannel); 
            const response = await youiAdapter.prompt([], null);
            expect(response).to.be.empty;
        });
  });
});
