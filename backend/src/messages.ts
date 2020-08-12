const selectGeneratorQuestionHint = "Select the generator that best fits the type of application you want to develop";
const selectTargetFolderQuestionHint = "The project will contain the relevant files and configurations required to create your application";

export default {
    panel_title: "Yeoman UI",
	generators_loading: "Loading the Yeoman generators...",
	step_is_pending: "Loading...",
	step_is_generating: "Generating...",
    yeoman_ui_title: "Yeoman Generators",
    select_generator_name: "Select Generator",
    select_generator_question_message: "Generators",
    select_generator_question_hint: selectGeneratorQuestionHint,
    select_generator_not_found: "Could not find any generators.",
    select_target_folder_question_hint: selectTargetFolderQuestionHint,
    channel_name: "Generators",
    select_generator_description: `${selectGeneratorQuestionHint}.\n${selectTargetFolderQuestionHint}.`,
    artifact_generated: `The project has been generated.`,
    artifact_with_name_generated: (artifactName: string) => `The '${artifactName}' project has been generated.`
}; 
