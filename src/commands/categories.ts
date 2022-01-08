import { MatrixClient, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import { TriviaManager } from "../TriviaManager";

export async function runCategoriesCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient, trivia: TriviaManager) {
    const categories = await trivia.getCategories();

    const html = "" +
        "<strong>Available categories:</strong>" +
        "<p>Use the category number in the <code>!trivia</code> command when starting a new game.</p>" +
        `<ul>${categories.map(c => `<li>${c.id} - ${htmlEscape(c.name)}</li>`).join("")}</ul>`;
    await client.replyHtmlNotice(roomId, event.raw, html);
}
