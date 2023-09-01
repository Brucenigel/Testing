export declare class Chat {
    private chatAPI;
    constructor(apikey: string);
    private generateReviewPrompt;
    private generateAssessmentPrompt;
    codeReview: (filename: string, patch: string) => Promise<string>;
}
