const selectGeneratorQuestionHint = "Select the generator that best fits the type of application you want to develop";
const selectTargetFolderQuestionHint = "The project will contain the relevant files and configurations required to create your application";
const selectWhereToOpenTheProjectQuestionHint = "Where do you want to open the project?";

export default {
    panel_title: "Application Wizard",
	generators_loading: "Loading the Yeoman generators...",
	step_is_pending: "Loading...",
	step_is_generating: "Generating...",
    yeoman_ui_title: "Application Wizard",
    select_generator_name: "Select Generator",
    select_generator_question_message: "Generators",
    select_generator_question_hint: selectGeneratorQuestionHint,
    select_generator_not_found: "Could not find any generators.",
    select_target_folder_question_hint: selectTargetFolderQuestionHint,
    select_open_workspace_question_hint: selectWhereToOpenTheProjectQuestionHint,
    channel_name: "Generators",
    select_generator_description: `${selectGeneratorQuestionHint}.\n${selectTargetFolderQuestionHint}.`,
    artifact_generated_project: `The project has been generated.`,
    artifact_generated_module: `The module has been generated.`,
    artifact_generated_files: `The files have been generated.`,
    artifact_with_name_generated: (artifactName: string) => `The '${artifactName}' project has been generated.`,
    show_progress_button: "Open Output View",
    show_progress_message: "Generating..."
}; 
