// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState();

    const generatorNameElement = document.getElementById('generatorName');
    const questionsElement = document.getElementById('questions');

    console.log(oldState);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'initWizard':
                generatorNameElement.textContent = message.generatorName;
                questionsElement.textContent = "";
                break;
            case 'questions':
                let questions = message.data;
                const answers = {};
                if (questions.length) {
                    for (let i in questions) {
                        const question = questions[i];
                        const p = document.createElement("p");
                        p.textContent = `[${question.type}]: ${question.message}`;
                        questionsElement.appendChild(p);

                        answers[question.name] = `The answer to ${question.message}`;
                    }
                    
                    vscode.postMessage({
                        command: "answers",
                        taskId: message.taskId,
                        data: answers
                    });
                }
                break;
            }
    });
}());