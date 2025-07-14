<template>
  <v-app id="app" class="vld-parent" @contextmenu.prevent>
    <loading
      v-model:active="showBusyIndicator"
      :is-full-page="true"
      :height="64"
      :width="64"
      :color="isLoadingColor"
      background-color="transparent"
      loader="spinner"
    />

    <YOUIHeader
      v-if="prompts.length"
      id="header"
      :header-title="headerTitle"
      :header-info="headerInfo"
      :step-name="promptIndex < prompts.length ? prompts[promptIndex].name : ''"
      :rpc="rpc"
      :is-in-vs-code="isInVsCode()"
      :is-generic="isGeneric"
      @parent-show-console="toggleConsole"
    />

    <v-row class="main-row ma-0 pa-0">
      <v-col class="left-col ma-0 pa-0" cols="3">
        <YOUINavigation
          v-if="prompts.length"
          :prompt-index="promptIndex"
          :prompts="prompts"
          :prompt-answers="currentAnswerTexts"
          @on-goto-step="gotoStep"
        />
      </v-col>
      <v-col cols="9" class="right-col">
        <v-row class="prompts-col">
          <v-col>
            <YOUIDone v-if="isDone" :done-status="doneStatus" :done-message="doneMessage" :done-path="donePath" />
            <YOUIBanner
              v-if="shouldDisplayBanner"
              :banner-props="bannerProps"
              @parent-execute-command="executeCommand"
            />
            <YOUIPromptInfo v-if="currentPrompt && !isDone" :current-prompt="currentPrompt" />
            <v-slide-x-transition>
              <Form
                ref="form"
                :questions="currentPrompt ? currentPrompt.questions : []"
                @parent-execute-command="executeCommand"
                @answered="onAnswered"
                @set-busy-indicator="setBusyIndicator"
              />
            </v-slide-x-transition>
            <YOUIInfo
              v-if="isNoGenerators"
              :info-message="messages ? messages.select_generator_not_found : ``"
              :info-url="'https://wwww.sap.com'"
            />
          </v-col>
        </v-row>
        <v-divider bold />
        <v-row
          v-if="prompts.length > 0 && !isDone && showButtons"
          style="height: 4rem; margin: 0; align-items: left"
          sm="auto"
        >
          <div class="bottom-buttons-col" style="display: flex">
            <v-btn
              v-show="promptIndex > 0"
              id="back"
              variant="elevated"
              :disabled="promptIndex < 1 || isReplaying"
              style="min-width: 90px"
              @click="back"
            >
              <v-icon left> mdi-chevron-left </v-icon>{{ backButtonText }}
            </v-btn>
            <v-btn id="next" :disabled="!stepValidated" style="min-width: 90px" variant="elevated" @click="next">
              {{ nextButtonText }}
              <v-icon v-if="nextButtonText !== `Finish`" right> mdi-chevron-right </v-icon>
            </v-btn>
          </div>
          <div v-if="toShowPromptMessage" class="prompt-message">
            <img style="vertical-align: middle; padding-left: 12px" :src="promptMessageIcon" alt="" />
            <v-tooltip location="right" :disabled="promptMessageToDisplay.length < messageMaxLength">
              <template #activator="{ props: tooltipProps }">
                <span :class="promptMessageClass" v-bind="tooltipProps">{{ shortPrompt }}</span>
              </template>
              <span>{{ promptMessageToDisplay }}</span>
            </v-tooltip>
          </div>
          <v-spacer />
        </v-row>
      </v-col>
    </v-row>

    <!-- TODO Handle scroll of above content when console is visible. low priority because it is for localhost console only -->
    <v-card v-show="showConsole" :class="consoleClass">
      <v-footer absolute class="font-weight-medium" style="max-height: 300px; overflow-y: auto">
        <v-col class cols="12">
          <div id="logArea" placeholder="No log entry">
            {{ logText }}
          </div>
        </v-col>
      </v-footer>
    </v-card>
  </v-app>
</template>

<script>
import { reactive } from "vue";
import Loading from "vue-loading-overlay";
import YOUIHeader from "../components/YOUIHeader.vue";
import YOUINavigation from "../components/YOUINavigation.vue";
import YOUIDone from "../components/YOUIDone.vue";
import YOUIInfo from "../components/YOUIInfo.vue";
import YOUIPromptInfo from "../components/YOUIPromptInfo.vue";
import YOUIBanner from "../components/YOUIBanner.vue";
import { RpcBrowser } from "@sap-devx/webview-rpc/out.browser/rpc-browser";
import { RpcBrowserWebSockets } from "@sap-devx/webview-rpc/out.browser/rpc-browser-ws";
import _size from "lodash/size";
import _get from "lodash/get";
import _cloneDeep from "lodash/cloneDeep";
import _compact from "lodash/compact";
import _find from "lodash/find";
import _isNil from "lodash/isNil";
import _forEach from "lodash/forEach";
import _isEmpty from "lodash/isEmpty";
import { Severity } from "@sap-devx/yeoman-ui-types";
import utils from "../utils/utils";
import answerUtils from "../utils/answerUtils";

const FUNCTION = "__Function";
const PENDING = "pending";
const EVALUATING = "evaluating";
const INSTALLING = "Installing dependencies...";

function initialState() {
  return {
    generatorName: "",
    generatorPrettyName: "",
    stepValidated: false,
    prompts: [],
    promptIndex: 0,
    rpc: Object,
    resolve: Object,
    reject: Object,
    isDone: false,
    doneMessage: Object,
    doneStatus: false,
    consoleClass: "",
    logText: "",
    showConsole: false,
    messages: {},
    showBusyIndicator: false,
    expectedShowBusyIndicator: false,
    promptsInfoToDisplay: [],
    isReplaying: false,
    numOfSteps: 1,
    isGeneric: false,
    isToolsSuiteTypeGen: false,
    isWriting: false,
    showButtons: true,
    promptMessageToDisplay: "",
    shortPrompt: "",
    toShowPromptMessage: false,
    promptMessageClass: "",
    promptMessageIcon: null,
    messageMaxLength: 100,
    headerTitleProvided: "",
    headerInfo: "",
    currentAnswerTexts: {}, // Answer state for navigation answer history
    bannerProps: {
      text: "",
      ariaLabel: "Banner",
      icon: {},
      action: {},
      triggerActionFrom: "banner",
      displayBannerForStep: "",
    },
  };
}

export default {
  name: "App",
  components: {
    YOUIHeader,
    YOUINavigation,
    YOUIDone,
    YOUIInfo,
    YOUIPromptInfo,
    YOUIBanner,
    Loading,
  },
  props: {
    plugins: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return initialState();
  },
  computed: {
    backButtonText() {
      if (this.promptIndex === 1 && this.selectGeneratorPromptExists()) {
        return "Start Over";
      }
      return "Back";
    },
    nextButtonText() {
      if (
        (!this.selectGeneratorPromptExists() && this.promptIndex === _size(this.promptsInfoToDisplay) - 1) ||
        (this.selectGeneratorPromptExists() &&
          this.promptIndex > 0 &&
          this.promptIndex === _size(this.promptsInfoToDisplay)) ||
        this.isWriting
      ) {
        return "Finish";
      } else if (this.isGeneratorsPrompt()) {
        return "Start";
      }
      return "Next";
    },
    isLoadingColor() {
      return (
        getComputedStyle(document.documentElement).getPropertyValue("--vscode-progressBar-background") || "#0e70c0"
      );
    },
    headerTitle() {
      // If the header title is externally set then this overrides the default behaviour
      if (!_isEmpty(this.headerTitleProvided)) {
        return this.headerTitleProvided;
      }
      const titleSuffix = _isEmpty(this.generatorPrettyName) ? "" : ` - ${this.generatorPrettyName}`;
      return `${_get(this.messages, "yeoman_ui_title")}${titleSuffix}`;
    },
    currentPrompt() {
      return _get(this.prompts, "[" + this.promptIndex + "]");
    },
    shouldDisplayBanner() {
      if (this.bannerProps.displayBannerForStep) {
        return (
          this.bannerProps.displayBannerForStep === this.currentPrompt?.name &&
          !!this.bannerProps.text &&
          !!this.bannerProps.ariaLabel
        );
      }
      return !!this.bannerProps.text && !!this.bannerProps.ariaLabel;
    },
    isNoGenerators() {
      const promptName = _get(this.currentPrompt, "name");
      const message = _get(this.messages, "select_generator_name", "");
      if (promptName && promptName === message) {
        const questions = _compact(_get(this.currentPrompt, "questions"));
        const generatorQuestion = _find(questions, (question) => {
          return _get(question, "name") === "generator";
        });
        return _isEmpty(_get(generatorQuestion, "choices"));
      }
      return false;
    },
  },
  watch: {
    prompts: {
      handler() {
        this.setBusyIndicator();
      },
      deep: true,
    },
    "currentPrompt.status": {
      handler() {
        this.setBusyIndicator();
      },
    },
    isDone: {
      handler() {
        this.setBusyIndicator();
      },
    },
  },
  created() {
    this.setupRpc();
  },
  mounted() {
    this.init();
    // TODO: remove after a solution is found for DEVXBUGS-8741
    utils.addAndRemoveClass("header", "material-icons");
  },
  methods: {
    showPromptMessage(message, type, image) {
      this.promptMessageToDisplay = message;
      this.shortPrompt =
        message.length < this.messageMaxLength ? message : message.substr(0, this.messageMaxLength) + "...";
      this.toShowPromptMessage = true;
      this.promptMessageIcon = image;

      if (type === Severity.error) {
        this.promptMessageClass = "error-prompt-message";
      } else if (type === Severity.information) {
        this.promptMessageClass = "info-warn-prompt-message";
      } else if (type === Severity.warning) {
        this.promptMessageClass = "info-warn-prompt-message";
      }
    },
    resetPromptMessage() {
      // reset prompt values to initial state
      this.promptMessageToDisplay = "";
      this.shortPrompt = "";
      this.toShowPromptMessage = false;
      this.promptMessageClass = "";
      this.promptMessageIcon = null;
    },
    /**
     * Set the busy indicator based on the current prompt status.
     * If an optional boolean value is provided this will override the prompt status when determining if the busy indicator should be on or off
     * This can be used by custom plugins to activate/deactivate the busy indicator internally
     */
    setBusyIndicator: utils.debounce(function (showBusy) {
      this.expectedShowBusyIndicator =
        showBusy === true ||
        _isEmpty(this.prompts) ||
        (this.currentPrompt &&
          (this.currentPrompt.status === PENDING || this.currentPrompt.status === EVALUATING) &&
          !this.isDone &&
          showBusy !== false);

      if (this.expectedShowBusyIndicator) {
        setTimeout(() => {
          if (this.expectedShowBusyIndicator) {
            this.showBusyIndicator = true;
          }
        }, 1500);
      } else {
        this.showBusyIndicator = false;
      }
    }, 300),
    executeCommand(cmdOrEvent) {
      let command = cmdOrEvent;
      if (cmdOrEvent.target) {
        command.id = cmdOrEvent.target.getAttribute("command");
        command.params = cmdOrEvent.target.getAttribute("params");
      }
      const params = command.params ? JSON.parse(JSON.stringify(command.params)) : null;
      this.rpc.invoke("executeCommand", [command.id, params]);
    },
    back() {
      return this.gotoStep(1); // go 1 step back
    },
    gotoStep(numOfSteps) {
      // go numOfSteps step back
      try {
        this.stepValidated = false; // reset the step validation to disable the next button
        this.toShowPromptMessage = false;
        this.isReplaying = true;
        this.numOfSteps = numOfSteps;
        const answers = this.currentPrompt.answers;
        if (this.promptIndex - numOfSteps > 0) {
          return this.rpc.invoke("back", [
            answers !== undefined ? JSON.parse(JSON.stringify(answers)) : answers,
            numOfSteps,
          ]);
        }

        return this.reload();
      } catch (error) {
        this.rpc.invoke("logError", [error]);
        this.reject(error);
      }
    },
    setBanner({ icon, text, action, ariaLabel, triggerActionFrom, displayBannerForStep }) {
      this.bannerProps = {
        displayBannerForStep,
        text,
        ariaLabel,
        icon: icon ? { source: icon.source, type: icon.type } : undefined,
        action: action ? { ...action } : undefined,
        triggerActionFrom: triggerActionFrom ?? "banner",
      };
    },
    setHeaderTitle(title, info) {
      this.headerTitleProvided = title;
      this.headerInfo = info;
    },
    setGenInWriting(value) {
      this.isWriting = value;
      this.showButtons = !this.isWriting;
      if (this.currentPrompt) {
        this.currentPrompt.name = this.getInProgressStepName();
      }
    },
    getInProgressStepName() {
      return this.isWriting ? _get(this.messages, "step_is_generating") : _get(this.messages, "step_is_pending");
    },
    next() {
      if (this.resolve === null) {
        return;
      }

      this.stepValidated = false;
      this.toShowPromptMessage = false;
      this.resolve(
        this.currentPrompt.answers !== undefined
          ? JSON.parse(JSON.stringify(this.currentPrompt.answers))
          : this.currentPrompt.answers,
      );

      if (this.promptIndex >= _size(this.prompts) - 1) {
        const prompt = {
          questions: [],
          name: this.getInProgressStepName(),
          status: PENDING,
        };
        this.setPrompts([prompt]);
      }

      this.promptIndex++;
      this.prompts[this.promptIndex - 1].active = false;
      this.prompts[this.promptIndex].active = true;
    },
    onAnswered(answers, issues) {
      const currentPrompt = this.currentPrompt;
      if (currentPrompt) {
        this.stepValidated =
          currentPrompt.status === PENDING || _isEmpty(currentPrompt.questions) ? false : _isNil(issues);

        currentPrompt.answers = answers;
        this.currentAnswerTexts = {
          promptName: currentPrompt.name,
          answers: answerUtils.getLabelsForAnswers(currentPrompt.questions),
        };

        if (currentPrompt.answers.generator) {
          this.isToolsSuiteTypeGen = this.isToolsSuiteType(currentPrompt.answers.generator);
        }
        if (currentPrompt.status === EVALUATING) {
          currentPrompt.status = undefined;
        }
      }
    },
    isToolsSuiteType(genName) {
      const questions = _compact(_get(this.currentPrompt, "questions"));
      const generatorQuestion = _find(questions, (question) => {
        return _get(question, "name") === "generator";
      });
      if (generatorQuestion) {
        const choices = _compact(_get(generatorQuestion, "choices"));
        if (choices) {
          const isToolsSuiteGen = _find(choices, (choice) => {
            return _get(choice, "isToolsSuiteType") === true && _get(choice, "value") === genName;
          });
          return _isEmpty(isToolsSuiteGen) === false;
        }
      }
      return false;
    },
    selectGeneratorPromptExists() {
      const firstPromptQuestions = _get(this, "prompts[0].questions", []);
      return !_isNil(
        _find(firstPromptQuestions, (question) => {
          return (
            _get(question, "name") === "generator" &&
            _get(question, "type") === "list" &&
            _get(question, "guiType") === "tiles"
          );
        }),
      );
    },
    setPromptList(prompts) {
      let promptIndex = this.promptIndex;
      if (this.isReplaying) {
        // TODO: is 1st prompt always Generator Selection?
        this.prompts = [this.prompts[0]];
        promptIndex = 0;
      }
      prompts = prompts || [];
      this.promptsInfoToDisplay = _cloneDeep(prompts);

      // replace all existing prompts except 1st (generator selection) and current prompt
      // The index at which to start changing the array.
      let startIndex = promptIndex;
      if (this.selectGeneratorPromptExists()) {
        startIndex = promptIndex + 1;
      }

      // The number of elements in the array to remove from startIndex
      const deleteCount = _size(this.prompts) - promptIndex;

      let itemsToInsert;
      if (this.selectGeneratorPromptExists() || promptIndex === 0) {
        itemsToInsert = prompts.splice(promptIndex, _size(prompts));
      } else {
        startIndex = promptIndex + 1;
        itemsToInsert = prompts.splice(startIndex, _size(prompts));
      }

      this.prompts.splice(startIndex, deleteCount, ...itemsToInsert);
    },
    setPrompts(prompts) {
      const firstIncomingPrompt = _get(prompts, "[0]");
      if (firstIncomingPrompt) {
        let startIndex = this.promptIndex;
        let deleteCount = prompts.length;
        if (!this.currentPrompt || firstIncomingPrompt.status === PENDING) {
          startIndex = this.promptIndex + 1;
          deleteCount = 0;
        }
        this.prompts.splice(startIndex, deleteCount, ...prompts);
      }
    },
    prepQuestions(questions) {
      if (this.currentPrompt) {
        this.currentPrompt.status = EVALUATING;
      }

      for (let question of questions) {
        for (let prop in question) {
          if (question[prop] === FUNCTION) {
            const that = this;
            question[prop] = async (...args) => {
              if (this.currentPrompt) {
                this.currentPrompt.status = EVALUATING;
              }

              try {
                return await that.rpc.invoke("evaluateMethod", [
                  args !== undefined ? JSON.parse(JSON.stringify(args)) : args,
                  question.name,
                  prop,
                ]);
              } catch (e) {
                that.showBusyIndicator = false;
                throw e;
              }
            };
          }
        }
      }

      if (this.currentPrompt) {
        this.currentPrompt.status = undefined;
      }
    },

    async updateGeneratorsPrompt(questions) {
      const generatorsPrompt = _get(this.prompts, "[0]");
      if (generatorsPrompt) {
        generatorsPrompt.questions = questions;
      }
    },

    isGeneratorsPrompt() {
      return this.promptIndex === 0 && this.selectGeneratorPromptExists();
    },

    showPrompt(questions, name) {
      this.stepValidated = false;
      this.prepQuestions(questions);
      if (this.isReplaying) {
        this.promptIndex -= this.numOfSteps;
        this.isReplaying = false;
      }
      const prompt = this.createPrompt(questions, name);
      this.setPrompts([prompt]);
      if (this.isWriting) {
        this.showButtons = true;
      }

      if (this.nextButtonText === "Finish" && this.isToolsSuiteTypeGen) {
        const message = "The generated project will not open in a stand-alone.";
        const image =
          "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxNyIgaGVpZ2h0PSIxNyIgdmlld0JveD0iMCAwIDE3IDE3Ij4NCiAgPGRlZnM+DQogICAgPGNsaXBQYXRoIGlkPSJjbGlwLWluZm9fdmNvZGUiPg0KICAgICAgPHJlY3Qgd2lkdGg9IjE3IiBoZWlnaHQ9IjE3Ii8+DQogICAgPC9jbGlwUGF0aD4NCiAgPC9kZWZzPg0KICA8ZyBpZD0iaW5mb192Y29kZSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtaW5mb192Y29kZSkiPg0KICAgIDxnIGlkPSJHcm91cF8zNTQ0IiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDQiPg0KICAgICAgPGcgaWQ9Ikdyb3VwXzM1NDMiIGRhdGEtbmFtZT0iR3JvdXAgMzU0MyI+DQogICAgICAgIDxnIGlkPSJHcm91cF8zNTQyIiBkYXRhLW5hbWU9Ikdyb3VwIDM1NDIiPg0KICAgICAgICAgIDxnIGlkPSJFbGxpcHNlXzU0IiBkYXRhLW5hbWU9IkVsbGlwc2UgNTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLXdpZHRoPSIxLjUiPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI4LjUiIHN0cm9rZT0ibm9uZSIvPg0KICAgICAgICAgICAgPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSI3Ljc1IiBmaWxsPSJub25lIi8+DQogICAgICAgICAgPC9nPg0KICAgICAgICAgIDxwYXRoIGlkPSJQYXRoXzE2NDAiIGRhdGEtbmFtZT0iUGF0aCAxNjQwIiBkPSJNMTg1Mi41LTI3NzkuNzMxdjQuNTA2IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTg0NCAyNzg3Ljc1KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmZiYWY3IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+DQogICAgICAgICAgPHBhdGggaWQ9IlBhdGhfMTY0MSIgZGF0YS1uYW1lPSJQYXRoIDE2NDEiIGQ9Ik0xODUyLjUtMjc3NC43MzFoMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE4NDQgMjc4MCkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZmYmFmNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiLz4NCiAgICAgICAgPC9nPg0KICAgICAgPC9nPg0KICAgIDwvZz4NCiAgPC9nPg0KPC9zdmc+DQo=";
        this.showPromptMessage(message, Severity.information, image);
      }

      const promptPromise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
      promptPromise.then(() => {
        this.resolve = null;
        this.reject = null;
        if (this.isWriting) {
          this.showButtons = false;
        }
      });
      return promptPromise;
    },
    createPrompt(questions, name) {
      let promptDescription = "";
      let promptName = "";
      if (name === "select_generator") {
        promptDescription = _get(this.messages, "select_generator_description");
        promptName = _get(this.messages, "select_generator_name");
      } else {
        const promptIndex = this.selectGeneratorPromptExists() ? this.promptIndex - 1 : this.promptIndex;
        const promptToDisplay = _get(this.promptsInfoToDisplay, `[${promptIndex}]`);
        promptDescription = _get(promptToDisplay, "description", "");
        promptName = _get(promptToDisplay, "name", name);
      }

      const prompt = reactive({
        questions: questions,
        name: promptName,
        description: promptDescription,
        answers: {},
        active: true,
        status: _get(this.currentPrompt, "status"),
      });
      return prompt;
    },
    log(log) {
      this.logText += log;
      return true;
    },
    generatorInstall() {
      this.currentPrompt.name = "Installing";
      this.doneMessage = INSTALLING;
      this.donePath = "";
      this.doneStatus = true;
      this.isDone = true;
    },
    generatorDone(succeeded, message, targetPath) {
      this.currentPrompt.name = "Summary";
      this.doneMessage = message;
      this.donePath = targetPath;
      this.doneStatus = succeeded;
      this.isDone = true;
    },
    runGenerator(generatorName) {
      this.rpc.invoke("runGenerator", [generatorName]);
    },
    isInVsCode() {
      return typeof acquireVsCodeApi !== "undefined";
    },
    getVsCodeApi() {
      if (this.isInVsCode()) {
        if (!window.vscode) {
          // eslint-disable-next-line
          window.vscode = acquireVsCodeApi();
        }

        return window.vscode;
      }
    },
    setupRpc() {
      /* istanbul ignore if */
      if (this.isInVsCode()) {
        this.rpc = new RpcBrowser(window, this.getVsCodeApi());
        this.initRpc();
      } else {
        const ws = new WebSocket("ws://127.0.0.1:8081");
        /* istanbul ignore next */
        ws.onopen = () => {
          this.rpc = new RpcBrowserWebSockets(ws);
          this.initRpc();
        };
      }
    },
    initRpc() {
      const functions = [
        "showPrompt",
        "setPromptList",
        "generatorInstall",
        "generatorDone",
        "log",
        "updateGeneratorsPrompt",
        "isGeneratorsPrompt",
        "setGenInWriting",
        "showPromptMessage",
        "resetPromptMessage",
        "setHeaderTitle",
        "setBanner",
      ];
      _forEach(functions, (funcName) => {
        this.rpc.registerMethod({
          func: this[funcName],
          thisArg: this,
          name: funcName,
        });
      });

      this.displayGeneratorsPrompt();
    },
    async setMessagesAndSaveState() {
      const uiOptions = await this.rpc.invoke("getState");
      this.messages = _get(uiOptions, "messages");
      this.isGeneric = _get(this.messages, "panel_title") === "Template Wizard";
      const vscodeApi = this.getVsCodeApi();
      if (vscodeApi) {
        vscodeApi.setState(uiOptions);
      }
    },
    async displayGeneratorsPrompt() {
      await this.setMessagesAndSaveState();
      await this.rpc.invoke("receiveIsWebviewReady", []);
    },
    toggleConsole() {
      this.showConsole = !this.showConsole;
    },
    registerPlugin(plugin) {
      if (plugin) {
        const registerPluginFunc = _get(this.$refs, "form.registerPlugin");
        registerPluginFunc(plugin);
      }
    },
    init() {
      // register custom inquirer-gui plugins

      if (Array.isArray(this.plugins)) {
        this.plugins.forEach((plugin) => {
          this.registerPlugin(plugin);
        });
      }

      this.isInVsCode() ? (this.consoleClass = "consoleClassHidden") : (this.consoleClass = "consoleClassVisible");
    },
    reload() {
      const dataObj = initialState();
      dataObj.rpc = this.rpc;
      Object.assign(this.$data, dataObj);
      this.init();

      this.displayGeneratorsPrompt();
    },
  },
};
</script>
<style scoped>
@import "./../../node_modules/vue-loading-overlay/dist/css/index.css";

.consoleClassVisible {
  visibility: visible;
}

.consoleClassHidden {
  visibility: hidden;
}

div.consoleClassVisible .v-footer {
  background-color: var(--vscode-editor-background, #1e1e1e);
  color: var(--vscode-foreground, #cccccc);
}

#logArea {
  font-family: monospace;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.prompts-col {
  overflow-y: auto;
  margin: 0px;
  padding-bottom: 20px;
}

.main-row,
.prompts-col {
  height: calc(100% - 4rem);
}

.left-col,
.right-col,
.right-row,
#step-component-div,
#QuestionTypeSelector,
#QuestionTypeSelector > .col,
#QuestionTypeSelector > .col > div {
  height: 100%;
}

.right-col {
  padding: 0 !important;
}

.bottom-left-col {
  background: var(--vscode-editor-background, #1e1e1e);
  overflow: hidden;
  margin: 0px;
}

.bottom-buttons-col {
  padding: 12px;
  padding-right: 0px;
  margin: auto !important;
}

.bottom-buttons-col > .v-btn:not(:last-child) {
  margin-right: 10px !important;
}

.prompt-message {
  padding: 12px;
  margin: auto;
}

/* Error prompt message*/
.error-prompt-message {
  font-size: 14px;
  padding-left: 12px;
  color: var(--vscode-errorForeground, #ff5252);
  vertical-align: middle;
}

/* Info and Warning prompt message*/
.info-warn-prompt-message {
  color: var(--vscode-editorCodeLens-foreground, #999999);
  padding-left: 12px;
  font-size: 14px;
  vertical-align: middle;
}

.v-divider {
  border-top: 2px solid var(--vscode-editorWidget-background, #252526) !important;
}

.v-theme--light.v-btn.v-btn--disabled:not(.v-btn--variant-flat):not(.v-btn--variant-flat):not(.v-btn--variant-flat) {
  background-color: var(--vscode-descriptionForeground, #717171) !important;
}
</style>
