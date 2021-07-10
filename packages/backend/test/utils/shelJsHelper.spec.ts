// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mocha from "mocha";
import { expect } from "chai";
import { apply } from "../../src/utils/shellJsWorkarounds";

describe("applyExecWorkaround", () => {
  let shellJs: any;

  before(() => {
    apply();
    shellJs = require("shelljs");
  });

  it("shelljs.exec(git config --get user.email) should return {stdout: ''}", () => {
    const result = shellJs.exec("git config --get user.email", { silent: true }).stdout.trim();
    expect(result).to.be.equal("");
  });

  it("shelljs.exec( GIT config --get  USER.NAME  ) should return {stdout: ''}", () => {
    const result = shellJs.exec(" GIT config --get  USER.NAME  ", { silent: true }).stdout.trim();
    expect(result).to.be.equal("");
  });

  it("shelljs.exec(node --version) should return a result", () => {
    const result = shellJs.exec("node --version", { silent: true }).stdout.trim();
    expect(result).to.be.not.equal("");
  });
});
