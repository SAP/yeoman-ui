const selectGeneratorQuestionHint =
  "When you create a project using a template, you become the code owner and, as such, you are responsible for any required updates or fixes. We recommend following the industry best practice to use automated vulnerability scanning in the CI/CD pipeline to avoid supply-chain attack and other cyberattacks.";
const selectTargetFolderQuestionHint =
  "The project will contain the relevant files and configurations required to create your application";
const selectWhereToOpenTheProjectQuestionHint = "Where do you want to open the project?";
const artifact_generated_project = `The project has been generated`;

export default {
  explore_gens_title: "Explore and Install Generators",
  panel_title: "Template Wizard",
  generators_loading: "Loading the Yeoman generators...",
  step_is_pending: "Loading...",
  step_is_generating: "Generating...",
  yeoman_ui_title: "Template Wizard",
  select_generator_name: "Select Generator",
  select_generator_question_message: "Generators",
  select_generator_question_hint: selectGeneratorQuestionHint,
  select_generator_not_found: "Could not find any generators.",
  select_target_folder_question_hint: selectTargetFolderQuestionHint,
  select_open_workspace_question_hint: selectWhereToOpenTheProjectQuestionHint,
  channel_name: "Generators",
  select_generator_description: `${selectGeneratorQuestionHint}.\n${selectTargetFolderQuestionHint}.`,
  artifact_generated_project_open_in_a_new_workspace: `${artifact_generated_project} and will be opened in a stand-alone.`,
  artifact_generated_project_add_to_workspace: `${artifact_generated_project} and will be added to your workspace.`,
  artifact_generated_project_saved_for_future: `${artifact_generated_project} and will be saved for future use.`,
  artifact_generated_module: `The module has been generated.`,
  artifact_generated_files: `The files have been generated.`,
  artifact_with_name_generated: (artifactName: string) => `The '${artifactName}' project has been generated.`,
  show_progress_button: "Open Output View",
  show_progress_message: "Generating...",
  add_to_workspace: "Open the project in a multi-root workspace",
  open_in_a_new_workspace: "Open the project in a stand-alone",
  create_and_close: "Create the project and close it for future use",
  generators_are_being_installed: "Generators are being installed in the background...",
  set_default_location: (defaultLocation: string) => `Set generators install location to ${defaultLocation}`,
  change_owner_for_global: (globalNpmPath: string) =>
    `Change owner ${globalNpmPath} to current user (recommended). Admin access required`,
  no_write_access: (globalNpmPath: string) =>
    `You do not have write access to directory "${globalNpmPath}". Choose one of the following:`,
  changing_owner_permissions: (globalNpmPath: string) => `Changing permissions of "${globalNpmPath}" folder...`,
  timeout_install_generators:
    "Some generators were not installed. You can continue to work in SAP Business Application Studio and we will retry next time you restart the dev space.",
  nodejs_install_not_found:
    "Node.js installation cannot be detected. Please ensure you have installed Node.js before attempting to use Template Wizard",
  warn_another_generator_running: (name: string) =>
    `You have unsaved changes in the ${name} generator. Running a new generator will make you lose these changes. Are you sure you want to continue?`,
  bad_project_uri_config_error: "The project configuration is not valid.\nCheck that the generator created the project correctly."
};
