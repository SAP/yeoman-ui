import { expect } from "chai";
import { YouiEvents } from '../src/youi-events';
import { IMethod, IPromiseCallbacks, IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { GeneratorFilter } from "../src/filter";
import { AppWizard } from "@sap-devx/yeoman-ui-types";
import { YouiAdapter } from '../src/youi-adapter';
import { YeomanUI } from "../src/yeomanui";
import messages from "../src/messages";

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
    
    class TestRpc implements IRpc {
	public timeout: number;
	public promiseCallbacks: Map<number, IPromiseCallbacks>;
	public methods: Map<string, IMethod>;
	public sendRequest(): void {
		return;
	}
	public sendResponse(): void {
		return;
	}
	public setResponseTimeout(): void {
		return;
	}
	public registerMethod(): void {
		return;
	}
	public unregisterMethod(): void {
		return;
	}
	public listLocalMethods(): string[] {
		return [];
	}
	public handleResponse(): void {
		return;
	}
	public listRemoteMethods(): Promise<string[]> {
		return Promise.resolve([]);
	}
	public invoke(): Promise<any> {
		return Promise.resolve();
	}
	public handleRequest(): Promise<void> {
		return Promise.resolve();
	}
    }

    const testLogger = {
	debug: () => true, error: () => true,
	fatal: () => true, warn: () => true, info: () => true, trace: () => true, getChildLogger: () => { return testLogger; }
    };

    const rpc = new TestRpc();
    const outputChannel: any = {
	appendLine: () => "",
	show: () => ""
    };
    
    const youiEvents = new TestEvents();
    
    const yeomanUi: YeomanUI = new YeomanUI(rpc, youiEvents, outputChannel, testLogger,
	{ filter: GeneratorFilter.create(), messages }, undefined);

    describe('#prompt()', () => {
        
        it('passes null call back', async () => {
            const firstName = "john";
	    const lastName = "doe";
	    (rpc.invoke as (methodName: string, params: any[]) => Promise<any>) = async (methodName: string, params: any[]) => {
                const questionName: string = params[0][0].name;
		if (questionName === "q1") {
			return {
				firstName,
				lastName
			};
		} else {
			return {};
		}
            };
            
            const youiAdapter = new YouiAdapter(youiEvents, outputChannel); 
            youiAdapter.setYeomanUI(yeomanUi);
            const questions = [{ name: "q1" }];
            let response = await youiAdapter.prompt(questions, null);
            expect(response.firstName).to.equal(firstName);
            expect(response.lastName).to.equal(lastName);
        });
    });
});
