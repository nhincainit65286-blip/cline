import { Controller } from "@/core/controller";
import { CommandContext } from "@/hosts/vscode/commandUtils";

export async function generateDocsWithCline(controller: Controller, context: CommandContext) {
    const { selection } = context;
    const fileMention = selection.fileMention;
    const prompt = `Generate documentation for the following code from ${fileMention} in Vietnamese:

`${selection.language}
${selection.content}
````;
    await controller.initTask(prompt);
}
