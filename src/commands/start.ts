import { MatrixClient, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import { TriviaManager } from "../TriviaManager";
import { TriviaDifficulty } from "../opentdb/OpenTDB";
import { PowerLevelAction } from "matrix-bot-sdk/lib/models/PowerLevelAction";

export async function runStartCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient, trivia: TriviaManager) {
    if (!(await client.userHasPowerLevelFor(event.sender, roomId, "io.t2bot.trivia", true))) {
        return client.replyNotice(roomId, event.raw, "Sorry, you do not have permission to use this command.");
    }
    if (!(await client.userHasPowerLevelForAction(await client.getUserId(), roomId, PowerLevelAction.RedactEvents))) {
        return client.replyNotice(roomId, event.raw, "Sorry, I do not have permission to redact events in this room and cannot start the game.");
    }

    const categories = await trivia.getCategories();

    const difficulty = args[0]; // validated by handler
    const numQuestions = Number(args[1]);
    const pickedCategories = args.slice(2).map(c => Number(c));

    if (!Number.isFinite(numQuestions) || numQuestions <= 0) {
        return client.replyNotice(roomId, event.raw, "Sorry, please enter a positive number of questions.");
    }

    const mappedCategories = pickedCategories.map(c => categories.find(c2 => c2.id === c));
    if (mappedCategories.some(c => !c) || mappedCategories.length <= 0) {
        return client.replyNotice(roomId, event.raw, "Sorry, one or more of those categories is not known.")
    }

    if (!(await trivia.tryStartGame(roomId, difficulty as TriviaDifficulty, numQuestions, mappedCategories))) {
        return client.replyNotice(roomId, event.raw, "Please finish the current game before starting a new one!");
    } // else the game started
}
