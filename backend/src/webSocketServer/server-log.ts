import { RpcCommon } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import stripAnsi = require("strip-ansi");


module.exports = (rpc: RpcCommon, isOutputVisible: boolean) => {
	let isVisible = isOutputVisible;

	function log(value: string) {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.write = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.writeln = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.create = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.force = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.conflict = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.identical = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.skip = (value: string) => {
		rpc.invoke("log", [stripAnsi(value) + '\n']);
		return log;
	}

	log.showOutput = (): boolean => {
		isVisible = !isVisible;
        return !isVisible;
	}

	return log;
}