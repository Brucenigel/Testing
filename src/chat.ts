import { ChatGPTAPI, ChatMessage } from 'chatgpt';
import { Inputs } from './input';
import { Prompts } from './prompt';
import { assessment } from './constant';

export class Chat {
  private chatAPI: ChatGPTAPI;

  constructor(apikey: string) {
    this.chatAPI = new ChatGPTAPI({
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

  private generateReviewPrompt = (filename: string, patch: string) => {
    const prompts = new Prompts();
    const input = new Inputs(filename, patch);
    return input.render(prompts.reviewFilePrompt);
  };

  private generateAssessmentPrompt = (filename: string, patch: string) => {
    const prompts = new Prompts();
    const input = new Inputs(filename, patch);
    return input.render(prompts.assessFileDiff);
  };

  public codeReview = async (filename: string, patch: string) => {
    if (!patch) {
      return '';
    }
    let res: ChatMessage;
    const reviewPrompt = this.generateReviewPrompt(filename, patch);
    const assessmentPrompt = this.generateAssessmentPrompt(filename, patch);
    res = await this.chatAPI.sendMessage(assessmentPrompt);
    if (res.text.includes(assessment.NEEDS_REVIEW)) {
      res = await this.chatAPI.sendMessage(reviewPrompt);
    }
    return res.text;
  };
}
