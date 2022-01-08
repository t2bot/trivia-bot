import { LogService, MatrixClient, MessageEvent, UserID } from "matrix-bot-sdk";
import { runCategoriesCommand } from "./categories";
import { TriviaManager } from "../TriviaManager";
import { runStartCommand } from "./start";

export const COMMAND_PREFIX = "!trivia";

export default class CommandHandler {
    private displayName: string;
    private userId: string;
    private localpart: string;

    constructor(private client: MatrixClient, private trivia: TriviaManager) {
    }

    public async start() {
        await this.prepareProfile();
        this.client.on("room.message", this.onMessage.bind(this));
    }

    private async prepareProfile() {
        this.userId = await this.client.getUserId();
        this.localpart = new UserID(this.userId).localpart;

        try {
            const profile = await this.client.getUserProfile(this.userId);
            if (profile && profile['displayname']) this.displayName = profile['displayname'];
        } catch (e) {
            LogService.warn("CommandHandler", e);
        }
    }

    private async onMessage(roomId: string, ev: any) {
        const event = new MessageEvent(ev);
        if (event.isRedacted) return; // Ignore redacted events that come through
        if (event.sender === this.userId) return; // Ignore ourselves
        if (event.messageType !== "m.text") return; // Ignore non-text messages

        // Ensure that the event is a command before going on. We allow people to ping
        // the bot as well as using our COMMAND_PREFIX.
        const prefixes = [COMMAND_PREFIX, `${this.localpart}:`, `${this.displayName}:`, `${this.userId}:`];
        const prefixUsed = prefixes.find(p => event.textBody.startsWith(p));
        if (!prefixUsed) return; // Not a command (as far as we're concerned)

        const args = event.textBody.substring(prefixUsed.length).trim().split(' ');
        try {
            if (args[0] === "categories") {
                return runCategoriesCommand(roomId, event, args, this.client, this.trivia);
            } else if (args[0] === "easy" || args[0] === "medium" || args[0] === "hard") {
                return runStartCommand(roomId, event, args, this.client, this.trivia);
            } else {
                const help = "<strong>Help:</strong><br /><br />" +
                    "List the available categories: <code>!trivia categories</code><br />" +
                    "Start a new trivia game: <code>!trivia &lt;easy|medium|hard&gt; &lt;num_questions&gt; &lt;...categories&gt; </code>";

                return this.client.replyHtmlNotice(roomId, ev, help);
            }
        } catch (e) {
            // Log the error
            LogService.error("CommandHandler", e);

            // Tell the user there was a problem
            const message = "There was an error processing your command";
            return this.client.replyNotice(roomId, ev, message);
        }
    }
}
