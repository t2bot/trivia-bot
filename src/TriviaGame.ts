import { MatrixClient } from "matrix-bot-sdk";
import { OpenTDB, TriviaCategory, TriviaDifficulty, TriviaQuestion } from "./opentdb/OpenTDB";

const MEDAL_INDEX = ['🥇', '🥈', '🥉'];

function place(i: number): string {
    const placed = `${i}`;
    if (placed.endsWith("1") && !placed.endsWith("11")) return `${placed}st`;
    if (placed.endsWith("2") && !placed.endsWith("12")) return `${placed}nd`;
    if (placed.endsWith("3") && !placed.endsWith("13")) return `${placed}rd`;
    return `${placed}th`;
}

export class TriviaGame {
    private scores = new Map<string, number>();
    private emptyCategories: TriviaCategory[] = [];
    private db = new OpenTDB();
    private ended = false;
    private numAsked = 0;

    // Current question stuff
    private question: TriviaQuestion;
    private questionEventId: string;
    private responses = new Map<string, string>();

    public constructor(
        private roomId: string,
        private client: MatrixClient,
        private categories: TriviaCategory[],
        private numQuestions: number,
        private timeToAnswerMs: number,
        private difficulty: TriviaDifficulty,
        private onDone: () => void,
    ) {
        this.client.on("room.event", this.onEvent);
    }

    public async begin() {
        await this.client.sendHtmlText(this.roomId, "<h1>Let the games begin</h1><p>When the question appears, answer by clicking the option you think is correct. Be careful though - only your first choice will be taken!</p>");

        // noinspection ES6MissingAwait
        this.askQuestion();
    }

    private pickCategory(): TriviaCategory {
        const available = this.categories.filter(c => !this.emptyCategories.includes(c));
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    }

    private async askQuestion() {
        if (this.questionEventId) {
            await this.client.sendEvent(this.roomId, "org.matrix.msc3381.poll.end", {
                "m.relates_to": {
                    "rel_type": "m.reference",
                    "event_id": this.questionEventId,
                },
                "org.matrix.msc3381.poll.end": {},
                "org.matrix.msc1767.text": `Time ran out! The correct answer was ${this.question.correct_answer}`,
            });
            await this.client.sendText(this.roomId, `The correct answer was ${this.question.correct_answer}!`);
            for (const response of this.responses.entries()) {
                if (!this.scores.has(response[0])) this.scores.set(response[0], 0);
                if (response[1] === this.question.correct_answer) {
                    this.scores.set(response[0], this.scores.get(response[0]) + 1);
                }
            }
        }

        if (this.numAsked >= this.numQuestions) {
            return this.end();
        }

        let question: TriviaQuestion;
        do {
            const category = this.pickCategory();
            if (!category) return this.end();
            question = await this.db.getNextQuestion(category, this.difficulty);
            if (!question) this.emptyCategories.push(category);
        } while (!question);

        const answers = [question.correct_answer, ...question.incorrect_answers]
            .map(a => ({a, s: Math.random()}))
            .sort((a, b) => a.s - b.s)
            .map(a => a.a);

        this.responses = new Map<string, string>();
        this.question = question;
        this.questionEventId = await this.client.sendEvent(this.roomId, "org.matrix.msc3381.poll.start", {
            "org.matrix.msc3381.poll.start": {
                question: {
                    "org.matrix.msc1767.text": `[${this.question.category}] ${this.question.question}`,
                },
                kind: "org.matrix.msc3381.poll.undisclosed",
                answers: answers.map(a => ({id: a, "org.matrix.msc1767.text": a})),
            },
            "org.matrix.msc1767.text": `[${this.question.category}] ${this.question.question}\n${answers.map(a => a).join('\n')}`,
        });

        this.numAsked++;

        setTimeout(() => this.askQuestion(), this.timeToAnswerMs);
    }

    private async end() {
        this.ended = true;
        this.client.off("room.event", this.onEvent);
        this.onDone();

        // Print scores for good measure, but after we stop tracking everything (just in case)
        const scores = "<h1>Final scores</h1>" +
            Array.from(this.scores.entries())
                .sort((a, b) => b[1] - a[1])
                .map((s, i) => `${MEDAL_INDEX[i] ?? place(i + 1)}: ${s[0]} (${s[1]}/${this.numAsked} points)`)
                .join("<br/>");
        await this.client.sendHtmlText(this.roomId, scores);
    }

    private onEvent = async (roomId: string, event: any) => {
        if (this.ended) return; // just in case

        if (event['type'] === 'org.matrix.msc3381.poll.response') {
            const relEventId = event['content']?.['m.relates_to']?.['event_id'];
            if (relEventId === this.questionEventId) {
                const response = event['content']?.['org.matrix.msc3381.poll.response']?.['answers'];
                if (!Array.isArray(response)) return;
                const answer = response[0];
                if (typeof(answer) !== 'string') return;
                if (this.responses.has(event['sender'])) {
                    await this.client.redactEvent(this.roomId, event['event_id'], "Answer already given!");
                } else {
                    this.responses.set(event['sender'], answer);
                }
            }
        }
    };
}
