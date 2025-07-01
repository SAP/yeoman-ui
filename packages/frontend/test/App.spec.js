import { initComponent, unmount } from "./Utils";
import App from "../src/youi/App";
import { WebSocket } from "mock-socket";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import YOUIBanner from "../src/components/YOUIBanner.vue";

global.WebSocket = WebSocket;

let wrapper;

describe("App.vue", () => {
  afterEach(() => {
    unmount(wrapper);
  });

  it("createPrompt - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.prompts = [{ questions: [{ name: "generator", type: "list", guiType: "tiles" }] }];
    wrapper.vm.rpc = {
      invoke: jest.fn().mockImplementation(async () => {
        return { data: {} };
      }),
    };
    expect(wrapper.vm.createPrompt().name).toBe();
    expect(wrapper.vm.createPrompt([]).name).toBe();
    expect(wrapper.vm.createPrompt([], "name").name).toBe("name");
    expect(wrapper.vm.createPrompt([], "select_generator")).toBeDefined();
  });

  describe("currentPrompt - computed", () => {
    it("questions are not defined", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.currentPrompt.answers).toBeUndefined();
    });
  });

  describe("backButtonText - computed", () => {
    it("promptIndex is 1", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [
        {
          questions: [
            {
              name: "generator",
              type: "list",
              guiType: "tiles",
            },
          ],
        },
        {},
        {},
      ];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.backButtonText).toEqual("Start Over");
    });

    it("promptIndex is 3", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [
        {
          questions: [
            {
              name: "generator",
              type: "list",
              guiType: "tiles",
            },
          ],
        },
        {},
        {},
      ];
      wrapper.vm.promptIndex = 3;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.backButtonText).toEqual("Back");
    });
  });

  describe("nextButtonText - computed", () => {
    it("promptIndex is 0", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [
        {
          questions: [
            {
              name: "generator-other",
              type: "list",
              guiType: "tiles",
            },
            {
              name: "generator",
              type: "list",
              guiType: "tiles",
            },
          ],
        },
        {},
        {},
      ];
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.nextButtonText).toEqual("Start");
    });

    it("promptIndex is 1", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptsInfoToDisplay = [{}, {}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.nextButtonText).toEqual("Next");
    });

    it("promptIndex is 2", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptsInfoToDisplay = [{}, {}, {}];
      wrapper.vm.promptIndex = 2;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      expect(wrapper.vm.nextButtonText).toEqual("Finish");
    });
  });

  describe("updateGeneratorsPrompt - method", () => {
    it("there are no prompts", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [];
      wrapper.vm.promptIndex = -1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.updateGeneratorsPrompt();
      expect(wrapper.vm.prompts).toHaveLength(0);
    });

    it("there are prompts", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [{}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.updateGeneratorsPrompt([{}]);
      expect(wrapper.vm.prompts[0].questions).toHaveLength(1);
    });
  });

  describe("isGeneratorsPrompt - method", () => {
    it("promptIndex = 0, selectGeneratorPromptExists = true", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.selectGeneratorPromptExists = () => true;
      const result = wrapper.vm.isGeneratorsPrompt();
      expect(result).toBeTruthy();
    });
    it("promptIndex = 0, selectGeneratorPromptExists = false", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.selectGeneratorPromptExists = () => false;
      const result = wrapper.vm.isGeneratorsPrompt();
      expect(result).toBeFalsy();
    });
    it("promptIndex > 0, selectGeneratorPromptExists = true", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.selectGeneratorPromptExists = () => true;
      const result = wrapper.vm.isGeneratorsPrompt();
      expect(result).toBeFalsy();
    });
    it("promptIndex > 0, selectGeneratorPromptExists = false", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 1;
      wrapper.vm.selectGeneratorPromptExists = () => false;
      const result = wrapper.vm.isGeneratorsPrompt();
      expect(result).toBeFalsy();
    });
  });

  describe("isNoGenerators - method", () => {
    it("no generators", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{ name: "Select Generator", questions: [{ choices: [] }] }];
      wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
      expect(wrapper.vm.isNoGenerators).toBeTruthy();
    });

    it("generators exist", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [
        {
          name: "Select Generator",
          questions: [{}, { name: "generator", choices: [{}] }],
        },
      ];
      wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
      expect(wrapper.vm.isNoGenerators).toBeFalsy();
    });

    it("generators exist question.name != 'generator'", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{ name: "Select Generator", questions: [{}, { choices: [{}] }] }];
      wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
      expect(wrapper.vm.isNoGenerators).toBeTruthy();
    });

    it("prompt name != generators", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 0;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{ name: "Prompt Name", questions: [{ choices: [{}] }] }];
      wrapper.vm.$data.messages = { select_generator_name: "Select Generator" };
      expect(wrapper.vm.isNoGenerators).toBeFalsy();
    });
  });

  describe("onAnswered - method", () => {
    it("the project is a fiori project", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setPromptList([]);

      const answerFiori = {
        generator: "fiori-generator",
      };
      const question = [
        {
          choices: [
            {
              isToolsSuiteType: true,
              value: "fiori-generator",
            },
          ],
          name: "generator",
        },
      ];
      wrapper.vm.currentPrompt.answers = answerFiori;
      wrapper.vm.currentPrompt.questions = question;
      wrapper.vm.onAnswered(answerFiori, "");

      expect(wrapper.vm.isToolsSuiteTypeGen).toBe(true);
    });

    it("the project is not a fiori project", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setPromptList([]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      const answerFiori = {
        generator: "stam-generator",
      };
      const question = [
        {
          choices: [
            {
              isToolsSuiteType: false,
              value: "stam-generator",
            },
          ],
          name: "generator",
        },
      ];
      wrapper.vm.currentPrompt.answers = answerFiori;
      wrapper.vm.currentPrompt.questions = question;
      wrapper.vm.onAnswered(answerFiori, "");

      expect(wrapper.vm.isToolsSuiteTypeGen).toBe(false);
    });

    it("questions have no question with name: generator", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setPromptList([]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      const answerFiori = {
        generator: "stam-generator",
      };
      const question = [
        {
          choices: [
            {
              isToolsSuiteType: false,
              value: "stam-generator",
            },
          ],
          name: "not-generator",
        },
      ];
      wrapper.vm.currentPrompt.answers = answerFiori;
      wrapper.vm.currentPrompt.questions = question;
      wrapper.vm.onAnswered(answerFiori, "");

      expect(wrapper.vm.isToolsSuiteTypeGen).toBe(false);
    });
  });

  describe("setQuestionProps - method", () => {
    // the delay ensures we call the busy indicator
    it("validate() with delay", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((methodName, question) => {
          return new Promise((resolve) => setTimeout(() => resolve(question[1]), 1500));
        }),
      };

      const questions = [{ name: "validateQ", validate: "__Function" }];
      wrapper.vm.showPrompt(questions, "promptName");
      await nextTick();

      const response = await questions[0].validate({});
      expect(response).toBe(questions[0].name);
    });

    it("set props", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((methodName, question) => {
          return question[1];
        }),
      };

      const questions = [
        { name: "defaultQ", default: "__Function" },
        { name: "whenQ", when: "__Function" },
        { name: "messageQ", message: "__Function" },
        { name: "choicesQ", choices: "__Function" },
        { name: "filterQ", filter: "__Function" },
        { name: "validateQ", validate: "__Function" },
        { name: "whenQ6", default: "whenAnswer6", type: "confirm" },
      ];
      wrapper.vm.showPrompt(questions, "promptName");

      let response = await questions[0].default();
      expect(response).toBe(questions[0].name);

      response = await questions[1].when();
      expect(response).toBe(questions[1].name);

      response = await questions[2].message();
      expect(response).toBe(questions[2].name);

      response = await questions[3].choices();
      expect(response).toBe(questions[3].name);

      response = await questions[4].filter();
      expect(response).toBe(questions[4].name);

      response = await questions[5].validate();
      expect(response).toBe(questions[5].name);
    });

    it("method that doesn't exist", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          throw "error";
        }),
      };

      const questions = [{ name: "validateQ", validate: "__Function" }];
      wrapper.vm.prepQuestions(questions, "promptName");
      await expect(questions[0].validate()).rejects.toEqual("error");
    });

    it("fiori project will not open in a stand-alone", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((methodName, question) => {
          return question[1];
        }),
      };

      wrapper.vm.promptsInfoToDisplay = [{}, {}, {}];
      wrapper.vm.promptIndex = 2;

      wrapper.vm.isToolsSuiteTypeGen = true;
      const message = "The generated project will not open in a stand-alone.";
      const image =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWluZm9fdmNvZGUiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iaW5mb192Y29kZSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtaW5mb192Y29kZSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTQ0IiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDQiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM1NDMiIGRhdGEtbmFtZT0iR3JvdXAgMzU0MyI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNTQyIiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDIiPg0KICAgICAgICAgIDxnIGlkPSJFbGxpcHNlXzU0IiBkYXRhLW5hbWU9IkVsbGlwc2UgNTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLXdpZHRoPSIxLjUiPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI4LjUiIHN0cm9rZT0ibm9uZSIvPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI3Ljc1IiBmaWxsPSJub25lIi8+DQogICAgICAgICAgPC9nPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzE2NDAiIGRhdGEtbmFtZT0iUGF0aCAxNjQwIiBkPSJNMTg1Mi41LTI3NzkuNzMxdjQuNTA2IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTg0NCAyNzg3Ljc1KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmZiYWY3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfMTY0MSIgZGF0YS1uYW1lPSJQYXRoIDE2NDEiIGQ9Ik0xODUyLjUtMjc3NC43MzFoMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE4NDQgMjc4MCkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";

      const questions = [
        { name: "defaultQ", default: "__Function" },
        { name: "whenQ", when: "__Function" },
        { name: "messageQ", message: "__Function" },
        { name: "choicesQ", choices: "__Function" },
        { name: "filterQ", filter: "__Function" },
        { name: "validateQ", validate: "__Function" },
        { name: "whenQ6", default: "whenAnswer6", type: "confirm" },
      ];
      wrapper.vm.showPrompt(questions, "promptName");

      expect(wrapper.vm.promptMessageToDisplay).toEqual(message);
      expect(wrapper.vm.promptMessageIcon).toEqual(image);
    });
  });

  describe("getVsCodeApi - method", () => {
    it("not in vscode", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.isInVsCode = () => false;
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      const vscodeApi = wrapper.vm.getVsCodeApi();
      expect(vscodeApi).toBeUndefined();
    });
  });

  describe("showPrompt - method", () => {
    it("questions are empty array", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      const promise = wrapper.vm.showPrompt([], "test");
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.$data.resolve({});
      await promise;
      expect(wrapper.vm.$data.resolve).toBe(null);
      expect(wrapper.vm.$data.reject).toBe(null);
    });
  });

  describe("setMessagesAndSaveState - method", () => {
    it("vscode api exists", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.getVsCodeApi = () => {
        return { setState: () => true };
      };
      wrapper.vm.setMessagesAndSaveState();
    });

    it("vscode api no exists", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: () => new Promise({ data: {} }),
      };
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.getVsCodeApi = () => undefined;
      wrapper.vm.setMessagesAndSaveState();
    });
  });

  it("initRpc - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn(),
    };

    wrapper.vm.showPrompt = jest.fn();
    wrapper.vm.setPrompts = jest.fn();
    wrapper.vm.generatorInstall = jest.fn();
    wrapper.vm.generatorDone = jest.fn();
    wrapper.vm.log = jest.fn();

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");
    const registerMethodSpy = jest.spyOn(wrapper.vm.rpc, "registerMethod");
    wrapper.vm.initRpc();

    expect(registerMethodSpy).toHaveBeenCalledWith({
      func: wrapper.vm.showPrompt,
      thisArg: wrapper.vm,
      name: "showPrompt",
    });
    expect(registerMethodSpy).toHaveBeenCalledWith({
      func: wrapper.vm.generatorInstall,
      thisArg: wrapper.vm,
      name: "generatorInstall",
    });
    expect(registerMethodSpy).toHaveBeenCalledWith({
      func: wrapper.vm.generatorDone,
      thisArg: wrapper.vm,
      name: "generatorDone",
    });
    expect(registerMethodSpy).toHaveBeenCalledWith({
      func: wrapper.vm.log,
      thisArg: wrapper.vm,
      name: "log",
    });
    expect(invokeSpy).toHaveBeenCalledWith("getState");

    invokeSpy.mockRestore();
    registerMethodSpy.mockRestore();
  });

  it("runGenerator - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.rpc = {
      invoke: jest.fn(),
    };

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");
    wrapper.vm.runGenerator("testGenerator");

    expect(invokeSpy).toHaveBeenCalledWith("runGenerator", ["testGenerator"]);

    invokeSpy.mockRestore();
  });

  it("log - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.logText = "test_";
    wrapper.vm.rpc = {
      invoke: jest.fn().mockImplementation(async () => {
        return { data: {} };
      }),
    };
    wrapper.vm.log("test_log");

    expect(wrapper.vm.logText).toBe("test_test_log");
  });

  it("executeCommand:event - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.rpc = {
      invoke: jest.fn(),
    };

    const event = {
      target: {
        getAttribute: jest.fn().mockImplementation((key) => {
          return key === "command" ? "vscode.open" : key === "params" ? ["param"] : "";
        }),
      },
    };
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");
    wrapper.vm.executeCommand(event);

    expect(invokeSpy).toHaveBeenCalledWith("executeCommand", ["vscode.open", ["param"]]);

    invokeSpy.mockRestore();
  });

  it("executeCommand:command - method", () => {
    wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
    wrapper.vm.rpc = {
      invoke: jest.fn(),
    };
    /**
     * @see {IValidationLink.link.command}
     */
    const command = {
      id: "vscode.open",
      params: {
        a: {
          b: 1,
        },
        c: ["2", "3"],
      },
    };
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");
    wrapper.vm.executeCommand(command);

    expect(invokeSpy).toHaveBeenCalledWith("executeCommand", ["vscode.open", command.params]);

    invokeSpy.mockRestore();
  });

  describe("next - method", () => {
    it("resolve is null", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.promptIndex = 1;
      wrapper.vm.stepValidated = true;
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.resolve = null;

      wrapper.vm.next();

      expect(wrapper.vm.stepValidated).toBeTruthy();
    });
    it("promptIndex is greater than prompt quantity, resolve is defined", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.resolve = jest.fn();
      wrapper.vm.reject = jest.fn();
      wrapper.vm.promptIndex = 1;
      wrapper.vm.stepValidated = true;
      wrapper.vm.prompts = [{}, {}];
      const resolveSpy = jest.spyOn(wrapper.vm, "resolve");

      wrapper.vm.next();

      expect(resolveSpy).toHaveBeenCalled();
      expect(wrapper.vm.promptIndex).toBe(2);
      expect(wrapper.vm.prompts).toHaveLength(3);
      expect(wrapper.vm.prompts[0].active).toBeFalsy();
      expect(wrapper.vm.prompts[2].active).toBeTruthy();
      resolveSpy.mockRestore();
    });

    it("promptIndex is less than prompt length", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.resolve = jest.fn();
      wrapper.vm.reject = jest.fn();
      wrapper.vm.promptIndex = 0;
      wrapper.vm.stepValidated = true;
      wrapper.vm.prompts = [{}, {}];
      const resolveSpy = jest.spyOn(wrapper.vm, "resolve");

      wrapper.vm.next();

      expect(resolveSpy).toHaveBeenCalled();
      expect(wrapper.vm.promptIndex).toBe(1);
      expect(wrapper.vm.prompts).toHaveLength(2);
      expect(wrapper.vm.prompts[0].active).toBeFalsy();
      expect(wrapper.vm.prompts[1].active).toBeTruthy();
      resolveSpy.mockRestore();
    });

    it("resolve method exists", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);

      wrapper.vm.resolve = () => true;
      wrapper.vm.promptIndex = 1;
      wrapper.vm.stepValidated = true;
      wrapper.vm.prompts = [{}, {}];

      wrapper.vm.next();

      expect(wrapper.vm.promptIndex).toBe(2);
      expect(wrapper.vm.prompts[0].active).toBeFalsy();
      expect(wrapper.vm.prompts[2].active).toBeTruthy();
    });
  });

  describe("back - method", () => {
    test("promptIndex is 0 (Select Generator)", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn(),
      };
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 1;
      wrapper.vm.prompts = [{}, {}];

      wrapper.vm.back();

      expect(wrapper.vm.promptIndex).toBe(0);
      expect(wrapper.vm.prompts.length).toBe(0);
      expect(wrapper.vm.isReplaying).toBe(false);
      expect(invokeSpy).toHaveBeenCalledWith("getState");
    });

    // TODO - check the error
    test("promptIndex is updated", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn(),
      };
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 2;
      wrapper.vm.prompts = [{}, {}, { questions: [] }];

      wrapper.vm.back();

      expect(wrapper.vm.isReplaying).toBe(true);
      expect(wrapper.vm.numOfSteps).toBe(1);
      expect(invokeSpy).toHaveBeenCalledWith("back", [undefined, 1]);
    });

    test("set props", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((...args) => {
          return args[1][1];
        }),
      };
      const questions = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.isReplaying = true;
      wrapper.vm.isWriting = true;
      wrapper.vm.showPrompt(questions, "promptName");
      await nextTick();
      expect(wrapper.vm.promptIndex).toBe(0);
    });
  });

  describe("gotoStep - method", () => {
    test("promptIndex is 1, goto 1 step back -> (Select Generator)", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn(),
      };
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 1;
      wrapper.vm.prompts = [{}, {}];

      wrapper.vm.gotoStep(1);

      expect(wrapper.vm.promptIndex).toBe(0);
      expect(wrapper.vm.prompts.length).toBe(0);
      expect(wrapper.vm.isReplaying).toBe(false);
      expect(invokeSpy).toHaveBeenCalledWith("getState");
    });

    // TODO - check the error
    test("promptIndex is 3, goto 2 step back", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn(),
      };
      const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");

      wrapper.vm.resolve = undefined;
      wrapper.vm.promptIndex = 3;
      wrapper.vm.prompts = [{}, {}, {}, { questions: [] }];

      wrapper.vm.gotoStep(2);

      expect(wrapper.vm.isReplaying).toBe(true);
      expect(wrapper.vm.numOfSteps).toBe(2);
      expect(invokeSpy).toHaveBeenCalledWith("back", [undefined, 2]);
    });

    test("promptIndex is 3, goto 3, exception thrown", async () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn(),
        registerMethod: jest.fn(),
      };
      const err = new Error("error");
      wrapper.vm.reload = jest.fn().mockImplementation(() => {
        throw err;
      });
      wrapper.vm.reject = jest.fn();
      wrapper.vm.promptIndex = 3;
      wrapper.vm.prompts = [{}, {}, {}, { questions: [] }];
      wrapper.vm.gotoStep(3);

      expect(wrapper.vm.rpc.invoke).toHaveBeenCalledWith("logError", [err]);
      expect(wrapper.vm.reject).toHaveBeenCalledWith(err);
    });
  });

  describe("setPromptList - method", () => {
    it("prompts is empty array", () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.setPromptList([]);

      expect(wrapper.vm.prompts).toHaveLength(2);
    });

    it("prompts is undefined", () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.setPromptList();

      expect(wrapper.vm.prompts).toHaveLength(2);
    });

    it("while replaying", () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [
        {
          questions: [
            {
              name: "generator",
              type: "list",
              guiType: "tiles",
            },
          ],
        },
        {},
      ];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.isReplaying = true;
      wrapper.vm.currentPrompt.status = "pending";

      const prompts = [{}, {}, {}];
      wrapper.vm.setPromptList(prompts);

      expect(wrapper.vm.prompts).toHaveLength(4);
      expect(wrapper.vm.isReplaying).toBe(true);
    });
  });

  describe("generatorInstall - method", () => {
    it("status is pending", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.generatorInstall();

      expect(wrapper.vm.isDone).toBeTruthy();
    });
  });

  describe("generatorDone - method", () => {
    test("status is pending", () => {
      wrapper = initComponent(App, { donePath: "testDonePath" });
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.generatorDone(true, "testMessage", "/test/path");

      expect(wrapper.vm.doneMessage).toBe("testMessage");
      expect(wrapper.vm.donePath).toBe("/test/path");
      expect(wrapper.vm.isDone).toBeTruthy();
      expect(wrapper.vm.currentPrompt.name).toBe("Summary");
    });
  });

  describe("setBusyIndicator - method", () => {
    beforeEach(() => {
      jest.useFakeTimers("modern");
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("prompts is empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [];
      wrapper.vm.setBusyIndicator();
      // setBusyIndicator() triggers with 300 ms debounce delay
      jest.advanceTimersByTime(350);
      expect(wrapper.vm.showBusyIndicator).toBeFalsy();
      expect(wrapper.vm.expectedShowBusyIndicator).toBeTruthy();
    });

    it("isDone is false, status is pending, prompts is not empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.isDone = false;
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setBusyIndicator();
      // setBusyIndicator() triggers with 300 ms debounce delay
      jest.advanceTimersByTime(350);
      expect(wrapper.vm.showBusyIndicator).toBeFalsy();
      expect(wrapper.vm.expectedShowBusyIndicator).toBeTruthy();
    });

    it("isDone is true, status is pending, prompts is not empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.isDone = true;
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setBusyIndicator();
      // setBusyIndicator() triggers with 300 ms debounce delay
      jest.advanceTimersByTime(350);
      expect(wrapper.vm.showBusyIndicator).toBeFalsy();
      expect(wrapper.vm.expectedShowBusyIndicator).toBeFalsy();
    });

    it("Busy indicator can be set manually (to support custom plugin control)", () => {
      wrapper = initComponent(App);
      wrapper.vm.setBusyIndicator(true);
      // setBusyIndicator() triggers with 300 ms debounce delay
      jest.advanceTimersByTime(350);
      expect(wrapper.vm.expectedShowBusyIndicator).toBeTruthy();
      // 1.5 second delay before busy indicator is shown
      jest.advanceTimersByTime(1550);
      expect(wrapper.vm.showBusyIndicator).toBeTruthy();

      // If a custom plugin function is evaluating it can explicitly cancel the busy indicator on callback
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.isDone = false;
      wrapper.vm.currentPrompt.status = "evaluating";
      wrapper.vm.setBusyIndicator(false);
      // setBusyIndicator() triggers with 300 ms debounce delay
      jest.advanceTimersByTime(350);
      expect(wrapper.vm.showBusyIndicator).toBeFalsy();
    });
  });

  describe("toggleConsole - method", () => {
    it("showConsole property updated from toggleConsole()", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.toggleConsole();
      expect(wrapper.vm.showConsole).toBeTruthy();
      wrapper.vm.toggleConsole();
      expect(wrapper.vm.showConsole).toBeFalsy();
    });
  });

  describe("init - method", () => {
    it("isInVsCode = true", () => {
      wrapper = initComponent(App);

      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(true);
      wrapper.vm.init();

      expect(wrapper.vm.promptIndex).toBe(0);
      expect(wrapper.vm.prompts).toStrictEqual([]);
      expect(wrapper.vm.consoleClass).toBe("consoleClassHidden");
    });

    it("isInVsCode = false", () => {
      wrapper = initComponent(App);

      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(false);
      wrapper.vm.init();

      expect(wrapper.vm.consoleClass).toBe("consoleClassVisible");
    });

    it("registers form plugins", () => {
      const registerMethodSpy = jest.fn();
      wrapper = initComponent(App, { plugins: [{}, {}, {}] }, true, {
        Form: {
          template: "<span />",
          methods: {
            registerPlugin: registerMethodSpy,
          },
        },
      });
      expect(registerMethodSpy).toHaveBeenCalledTimes(3);
    });
  });

  it("reload - method", () => {
    wrapper = initComponent(App);

    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn(),
    };
    const invokeSpy = jest.spyOn(wrapper.vm.rpc, "invoke");

    wrapper.vm.init = jest.fn();
    const initSpy = jest.spyOn(wrapper.vm, "init");

    wrapper.vm.reload();

    expect(initSpy).toHaveBeenCalled();
    expect(invokeSpy).toHaveBeenCalledWith("getState");

    invokeSpy.mockRestore();
  });

  describe("headerTitle - computed", () => {
    it("generatorPrettyName is empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.$data.generatorPrettyName = null;
      wrapper.vm.$data.messages = { yeoman_ui_title: "yeoman_ui_title" };
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title");
    });

    it("generatorPrettyName is not empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.$data.generatorPrettyName = "testGeneratorPrettyName";
      wrapper.vm.$data.messages = { yeoman_ui_title: "yeoman_ui_title" };
      expect(wrapper.vm.headerTitle).toEqual("yeoman_ui_title - testGeneratorPrettyName");
    });

    it("setHeaderTtle overrides", () => {
      const testTitle = "testHeaderTitle";
      const testInfo = "testHeaderInfo";
      wrapper = initComponent(App);
      wrapper.vm.setHeaderTitle(testTitle, testInfo);
      expect(wrapper.vm.headerTitle).toEqual(testTitle);
      expect(wrapper.vm.headerInfo).toEqual(testInfo);
    });
  });

  describe("setGenInWriting", () => {
    // TODO - check the error
    it("in writing state", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{}, { questions: [] }];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.setGenInWriting(true);
      expect(wrapper.vm.isWriting).toBe(true);
      expect(wrapper.vm.showButtons).toBe(false);
    });

    // TODO - check the error
    it("not in writing state", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{}, { questions: [] }];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.setGenInWriting(false);
      expect(wrapper.vm.isWriting).toBe(false);
      expect(wrapper.vm.showButtons).toBe(true);
    });

    it("not in writing state, currentprompt is undefined", () => {
      wrapper = initComponent(App, {}, false, ["vscode-textfield"]);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async () => {
          return { data: {} };
        }),
      };
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 3;
      wrapper.vm.setGenInWriting(false);
      expect(wrapper.vm.isWriting).toBe(false);
      expect(wrapper.vm.showButtons).toBe(true);
    });
  });

  describe("showPromptMessage", () => {
    it("error message", () => {
      wrapper = initComponent(App);
      wrapper.vm.showPromptMessage("errorMessage", 0, "image");
      expect(wrapper.vm.promptMessageToDisplay).toEqual("errorMessage");
      expect(wrapper.vm.shortPrompt).toEqual("errorMessage");
      expect(wrapper.vm.promptMessageIcon).toEqual("image");
      expect(wrapper.vm.promptMessageClass).toEqual("error-prompt-message");
    });

    it("warning message", () => {
      wrapper = initComponent(App);
      wrapper.vm.showPromptMessage("warnMessage", 1, "image");
      expect(wrapper.vm.promptMessageToDisplay).toEqual("warnMessage");
      expect(wrapper.vm.shortPrompt).toEqual("warnMessage");
      expect(wrapper.vm.promptMessageIcon).toEqual("image");
      expect(wrapper.vm.promptMessageClass).toEqual("info-warn-prompt-message");
    });

    it("info message", () => {
      wrapper = initComponent(App);
      wrapper.vm.showPromptMessage("infoMessage", 2, "image");
      expect(wrapper.vm.promptMessageToDisplay).toEqual("infoMessage");
      expect(wrapper.vm.shortPrompt).toEqual("infoMessage");
      expect(wrapper.vm.promptMessageIcon).toEqual("image");
      expect(wrapper.vm.promptMessageClass).toEqual("info-warn-prompt-message");
    });

    it("no valid message", () => {
      wrapper = initComponent(App);
      wrapper.vm.showPromptMessage("infoMessage", "neta", "image");
      expect(wrapper.vm.promptMessageToDisplay).toEqual("infoMessage");
      expect(wrapper.vm.shortPrompt).toEqual("infoMessage");
      expect(wrapper.vm.promptMessageIcon).toEqual("image");
    });

    it("long message", () => {
      wrapper = initComponent(App);
      wrapper.vm.messageMaxLength = 3;
      wrapper.vm.showPromptMessage("infoMessage", 2, "image");
      expect(wrapper.vm.promptMessageToDisplay).toEqual("infoMessage");
      expect(wrapper.vm.shortPrompt).toEqual("inf...");
      expect(wrapper.vm.promptMessageIcon).toEqual("image");
      expect(wrapper.vm.promptMessageClass).toEqual("info-warn-prompt-message");
    });
  });

  describe("resetPromptMessage", () => {
    it("should reset prompt values to initial state", () => {
      wrapper = initComponent(App);
      wrapper.vm.promptMessageToDisplay = "test message";
      wrapper.vm.shortPrompt = "short message...";
      wrapper.vm.toShowPromptMessage = true;
      wrapper.vm.promptMessageIcon = "image";
      wrapper.vm.promptMessageClass = "message-class";

      wrapper.vm.resetPromptMessage();

      expect(wrapper.vm.promptMessageToDisplay).toEqual("");
      expect(wrapper.vm.shortPrompt).toEqual("");
      expect(wrapper.vm.toShowPromptMessage).toEqual(false);
      expect(wrapper.vm.promptMessageIcon).toEqual(null);
      expect(wrapper.vm.promptMessageClass).toEqual("");
    });
  });

  describe("YOUIBanner Component in App.vue", () => {
    let wrapper;

    afterEach(() => {
      if (wrapper) {
        wrapper.unmount();
      }
    });

    test("renders YOUIBanner when bannerProps.showBanner is true", () => {
      wrapper = mount(App, {
        data() {
          return {
            bannerProps: {
              text: "Test Banner",
              ariaLabel: "Test Banner Label",
              showBanner: true,
              triggerActionFrom: "banner",
            },
          };
        },
      });

      // Check if YOUIBanner is rendered
      const banner = wrapper.findComponent(YOUIBanner);
      expect(banner.exists()).toBe(true);

      // Check if props are passed correctly
      expect(banner.props("bannerProps")).toEqual({
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        showBanner: true,
        triggerActionFrom: "banner",
      });

      // Check if the banner text is rendered correctly
      const bannerText = banner.find(".banner-text span");
      expect(bannerText.exists()).toBe(true);
      expect(bannerText.text()).toBe("Test Banner");
    });

    test("does not render YOUIBanner when bannerProps.showBanner is false", () => {
      wrapper = mount(App, {
        data() {
          return {
            bannerProps: {
              text: "Test Banner",
              ariaLabel: "Test Banner Label",
              showBanner: false, // Banner should not be displayed
              triggerActionFrom: "banner",
            },
          };
        },
      });

      // Check if YOUIBanner is not rendered
      const banner = wrapper.findComponent(YOUIBanner);
      expect(banner.exists()).toBe(false);
    });

    test("setBanner method updates bannerProps correctly", () => {
      const bannerProps = {
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        showBanner: true,
        icon: { source: "mdi-check-circle", type: "mdi" },
        action: { text: "Click Me", url: "https://example.com" },
        triggerActionFrom: "banner",
        linkText: "Learn More",
      };

      wrapper = mount(App, {
        data() {
          return {
            bannerProps,
          };
        },
      });

      // Call setBanner method
      wrapper.vm.setBanner(bannerProps);

      // Check if bannerProps are updated correctly
      expect(wrapper.vm.bannerProps).toEqual({
        text: "Test Banner",
        ariaLabel: "Test Banner Label",
        showBanner: true,
        icon: { source: "mdi-check-circle", type: "mdi" },
        action: { text: "Click Me", url: "https://example.com" },
        triggerActionFrom: "banner",
        linkText: "Learn More",
      });
    });
  });
});
