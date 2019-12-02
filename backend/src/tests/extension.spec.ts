import * as sinon from "sinon";
import { expect } from "chai";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";

const testVscode = {
    window: {
        createOutputChannel: () => ""
    }
};
mockVscode(testVscode, "src/extension.ts");
import * as extension from "../extension";

describe('Extension unit test', () => {
    let sandbox: any;
    let windowMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        windowMock = sandbox.mock(testVscode.window);
    });

    afterEach(() => {
        windowMock.verify();
    });

    it("getOutputChannel", () => {
        const testOutputChannel = {};
        windowMock.expects("createOutputChannel").returns(testOutputChannel);
        const channel1 = extension.getOutputChannel();
        expect(channel1 === testOutputChannel).to.be.true;

        const channel2 = extension.getOutputChannel();
        expect(channel2 === testOutputChannel).to.be.true;
    });
});
