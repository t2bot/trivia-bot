import * as fetch from "node-fetch";
import { decodeBase64 } from "matrix-bot-sdk";

export interface TriviaCategory {
    id: number;
    name: string;
}

export interface TriviaQuestionCount {
    category_id: number;
    category_question_count: {
        total_question_count: number;
        total_easy_question_count: number;
        total_medium_question_count: number;
        total_hard_question_count: number;
    };
}

export interface TriviaQuestion {
    category: string; // name
    type: "multiple" | "boolean";
    difficulty: TriviaDifficulty;
    question: string;
    correct_answer: string; // "True" for boolean
    incorrect_answers: string[]; // ["False"] for boolean
}

export type TriviaDifficulty = "easy" | "medium" | "hard";

const API_URL = "https://opentdb.com";

export class OpenTDB {
    private sessionToken: string;

    public constructor() {
    }

    public async getCategories(): Promise<TriviaCategory[]> {
        return (await (await fetch(`${API_URL}/api_category.php`)).json())['trivia_categories'];
    }

    public async getNextQuestion(category: TriviaCategory, difficulty: TriviaDifficulty): Promise<TriviaQuestion> {
        if (!this.sessionToken) await this.generateToken();
        const res = await (await fetch(`${API_URL}/api.php?amount=1&category=${category.id}&difficulty=${difficulty}&encode=base64&token=${this.sessionToken}`)).json();
        if (res['response_code'] !== 0 || res['results'].length !== 1) return null;

        const question = res['results'][0] as TriviaQuestion;
        return {
            category: decodeBase64(question.category).toString(),
            type: decodeBase64(question.type).toString() as "multiple"|"boolean",
            difficulty: decodeBase64(question.difficulty).toString() as TriviaDifficulty,
            question: decodeBase64(question.question).toString(),
            correct_answer: decodeBase64(question.correct_answer).toString(),
            incorrect_answers: question.incorrect_answers.map(q => decodeBase64(q).toString()),
        };
    }

    private async generateToken() {
        const res = await (await fetch(`${API_URL}/api_token.php?command=request`)).json();
        this.sessionToken = res['token'];
    }
}
