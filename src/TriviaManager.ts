import { TriviaGame } from "./TriviaGame";
import { MatrixClient } from "matrix-bot-sdk";
import { OpenTDB, TriviaCategory, TriviaDifficulty } from "./opentdb/OpenTDB";

export class TriviaManager {
    private games = new Map<string, TriviaGame>();
    private localDb = new OpenTDB();
    private cachedCategories: TriviaCategory[];

    public constructor(private client: MatrixClient) {
    }

    public async getCategories(): Promise<TriviaCategory[]> {
        if (!this.cachedCategories) {
            this.cachedCategories = await this.localDb.getCategories();
        }
        return this.cachedCategories;
    }

    public async tryStartGame(roomId: string, difficulty: TriviaDifficulty, questions: number, categories: TriviaCategory[]): Promise<boolean> {
        if (this.games.has(roomId)) {
            return false;
        }

        const game = new TriviaGame(roomId, this.client, categories, questions, 15000, difficulty, () => this.games.delete(roomId));
        this.games.set(roomId, game);
        await game.begin();
        return true;
    }
}
