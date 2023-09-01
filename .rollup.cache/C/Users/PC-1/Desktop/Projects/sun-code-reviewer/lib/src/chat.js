"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const chatgpt_1 = require("chatgpt");
const input_1 = require("./input");
const prompt_1 = require("./prompt");
const constant_1 = require("./constant");
class Chat {
    chatAPI;
    constructor(apikey) {
        this.chatAPI = new chatgpt_1.ChatGPTAPI({
            apiKey: apikey,
            apiBaseUrl: 'https://api.openai.com/v1',
            completionParams: {
                model: 'gpt-3.5-turbo',
                temperature: +(process.env.temperature || 0) || 1,
                top_p: +(process.env.top_p || 0) || 1,
                max_tokens: process.env.max_tokens
                    ? +process.env.max_tokens
                    : undefined,
            },
        });
    }
    generateReviewPrompt = (filename, patch) => {
        const prompts = new prompt_1.Prompts();
        const input = new input_1.Inputs(filename, patch);
        return input.render(prompts.reviewFilePrompt);
    };
    generateAssessmentPrompt = (filename, patch) => {
        const prompts = new prompt_1.Prompts();
        const input = new input_1.Inputs(filename, patch);
        return input.render(prompts.assessFileDiff);
    };
    codeReview = async (filename, patch) => {
        if (!patch) {
            return '';
        }
        let res;
        const reviewPrompt = this.generateReviewPrompt(filename, patch);
        const assessmentPrompt = this.generateAssessmentPrompt(filename, patch);
        res = await this.chatAPI.sendMessage(assessmentPrompt);
        if (res.text.includes(constant_1.assessment.NEEDS_REVIEW)) {
            res = await this.chatAPI.sendMessage(reviewPrompt);
        }
        return res.text;
    };
}
exports.Chat = Chat;
//# sourceMappingURL=chat.js.map