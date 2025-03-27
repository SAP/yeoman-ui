# Contributing to an SAP Open Source Project

## General Remarks

You are welcome to contribute content (code, documentation etc.) to this open source project.

There are some important things to know:

1. You must **comply to the license of this project**, **accept the Developer Certificate of Origin** (see below) before being able to contribute. The acknowledgement to the DCO will usually be requested from you as part of your first pull request to this project.
2. Please **adhere to our [Code of Conduct](CODE_OF_CONDUCT.md)**.
3. If you plan to use **generative AI for your contribution**, please see our guideline below.
4. **Not all proposed contributions can be accepted**. Some features may fit another project better or doesn't fit the general direction of this project. Of course, this doesn't apply to most bug fixes, but a major feature implementation for instance needs to be discussed with one of the maintainers first. Possibly, one who touched the related code or module recently. The more effort you invest, the better you should clarify in advance whether the contribution will match the project's direction. The best way would be to just open an issue to discuss the feature you plan to implement (make it clear that you intend to contribute). We will then forward the proposal to the respective code owner. This avoids disappointment.

## Developer Certificate of Origin (DCO)

Contributors will be asked to accept a DCO before they submit the first pull request to this projects, this happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## Contributing with AI-generated code

As artificial intelligence evolves, AI-generated code is becoming valuable for many software projects, including open-source initiatives. While we recognize the potential benefits of incorporating AI-generated content into our open-source projects there a certain requirements that need to be reflected and adhered to when making contributions.

Please see our [guideline for AI-generated code contributions to SAP Open Source Software Projects](CONTRIBUTING_USING_GENAI.md) for these requirements.

## How to Contribute

1. Make sure the change is welcome (see [General Remarks](#general-remarks)).
2. Create a branch by forking the repository and apply your change.
3. Commit and push your change on that branch.
4. Create a pull request in the repository using this branch.
5. Follow the link posted by the CLA assistant to your pull request and accept it, as described above.
6. Wait for our code review and approval, possibly enhancing your change on request.
   - Note that the maintainers have many duties. So, depending on the required effort for reviewing, testing, and clarification, this may take a while.
7. Once the change has been approved and merged, we will inform you in a comment.
8. Celebrate!

## Legal

All contributors must sign the DCO

- https://cla-assistant.io/SAP/yeoman-ui

This is managed automatically via https://cla-assistant.io/ pull request voter.

## Development Environment

### pre-requisites

- [Yarn](https://yarnpkg.com/lang/en/docs/install/) >= 1.4.2
- A [Long-Term Support version](https://nodejs.org/en/about/releases/) of node.js
- (optional) [commitizen](https://github.com/commitizen/cz-cli#installing-the-command-line-tool) for managing commit messages.
- [VSCode](https://code.visualstudio.com/) 1.39.2 or higher or [Theia](https://www.theia-ide.org/) 0.12 or higher.

### Initial Setup

The initial setup is trivial:

- clone this repo
- `yarn`

### Commit Messages format.

This project enforces the [conventional-commits][conventional_commits] commit message formats.
The possible commits types prefixes are limited to those defined by [conventional-commit-types][commit_types].
This promotes a clean project history and enabled automatically generating a changelog.

The commit message format will be inspected both on a git pre-commit hook
and during the central CI build and will **fail the build** if issues are found.

It is recommended to use `git cz` to construct valid conventional commit messages.

- requires [commitizen](https://github.com/commitizen/cz-cli#installing-the-command-line-tool) to be installed.

[commit_types]: https://github.com/commitizen/conventional-commit-types/blob/master/index.json
[conventional_commits]: https://www.conventionalcommits.org/en/v1.0.0/

### Formatting.

[Prettier](https://prettier.io/) is used to ensure consistent code formatting in this repository.
This is normally transparent as it automatically activated in a pre-commit hook using [lint-staged](https://github.com/okonet/lint-staged).
However, this does mean that dev flows that do not use a full dev env (e.g editing directly on github)
may result in voter failures due to formatting errors.

If you get the following error regarding formatting:

![image](https://github.com/SAP/yeoman-ui/assets/9718939/0750ff0f-fe17-43f9-8fc9-8d66310828ea)

you can run `yarn format:fix`.

### Compiling

First time run `yarn ci` on the root level.

Use the following npm scripts at the repo's **root** to compile **all** the TypeScript sub-packages.

- `yarn compile`
- `yarn compile:watch` (will watch files for changes and re-compile as needed)

These scripts may also be available inside the sub-packages. However, it is recommended to
use the top-level compilation scripts to avoid forgetting to (re-)compile a sub-package's dependency.

#### Run the yeoman framework in dev mode

Dev mode allows you to run the yeoman framework in the browser, using vue cli for fast development cycles, and easy debug tools.
To run it do the following:

- comment out the [logger instantiating](/packages/backend/src/utils/env.ts#L38) in env.ts source file.
- in the packages/backend folder run `webpack` or `webpack-dev:watch`, then run the server.
  ```bash
  yarn webpack
  yarn ws:run
  ```
- in the packages/frontend folder run `serve`
  ```bash
  yarn serve
  ```
- open the broswer on `http://localhost:5173/index.html` to access the framework.

#### Run the explore generators framework in dev mode

Dev mode allows you to run the explore generators framework in the browser, using vue cli for fast development cycles, and easy debug tools.
To run it do the following:

- comment out the [logger instantiating](/packages/backend/src/utils/env.ts#L38) in env.ts source file.
- in the packages/backend folder run `webpack` or `webpack-dev:watch`, then run the server.
  ```bash
  yarn webpack-dev:watch
  yarn ws:egRun
  ```
- in the packages/frontend folder run `serve`
  ```bash
  yarn serve
  ```
- open the broswer on `http://localhost:5173/exploregens/index.html` to access the framework.

#### Run the VSCode extension

- Start VSCode on your local machine, and click on open workspace. Select this repo folder.
- On the debug panel choose `Run Extension`, and click on the `Run` button.

#### Advanced scenarios

- [Build & install the yeoman example generator](packages/generator-foodq/README.md)

### Testing

[Mocha][mocha] and [Chai][chai] are used for unit-testing and [Istanbul/Nyc][istanbul] for coverage reports for the TypeScript sub-packages and [Jest][jest] is used for unit-testing and coverage reports for the Vue sub-packages.

[mocha]: https://mochajs.org/
[chai]: https://www.chaijs.com
[istanbul]: https://istanbul.js.org/
[jest]: https://jestjs.io/

- To run the tests execute `yarn test` in a specific sub-package.
- To run the tests with **coverage** run `yarn coverage` in a specific sub-package.

### Code Coverage

Code Coverage is enforced for all productive code in this mono repo.

- Specific statements/functions may be [excluded][ignore_coverage] from the report.
  - However, the reason for each exclusion must be documented.

[ignore_coverage]: https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md

### Full Build

To run the full **C**ontinuous **I**ntegration build run `yarn ci` in either the top-level package or a specific subpackage.
(When running in a specific package, ensure to run at least once in the top-level package.)

### Release Life-Cycle.

This monorepo uses Lerna's [Fixed/Locked][lerna-mode] which means all the sub-packages share the same version number.

[lerna-mode]: https://github.com/lerna/lerna#fixedlocked-mode-default

### Release Process

Performing a release requires push permissions to the repository.

- Ensure you are on the default branch and synced with origin.
- `yarn run release:version`
- Follow the lerna CLI instructions.
- Track the build system until successful completion
- Once the tag builds have successfully finished:
  - Inspect the npm registry to see the new sub packages versions.
  - Inspect the new github release and verify it contains the `.vsix` artifact.
