"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const chat_1 = require("./chat");
const constant_1 = require("./constant");
const OPENAI_API_KEY = 'OPENAI_API_KEY';
const MAX_PATCH_COUNT = process.env.MAX_PATCH_LENGTH
    ? +process.env.MAX_PATCH_LENGTH
    : Infinity;
const loadChat = async (context) => {
    if (process.env.OPENAI_API_KEY) {
        return new chat_1.Chat(process.env.OPENAI_API_KEY);
    }
    const repo = context.repo();
    try {
        // Check env on the repository
        const { data } = (await context.octokit.request('GET /repos/{owner}/{repo}/actions/variables/{name}', {
            owner: repo.owner,
            repo: repo.repo,
            name: OPENAI_API_KEY,
        }));
        if (!data?.value) {
            return null;
        }
        return new chat_1.Chat(data.value);
    }
    catch {
        await context.octokit.issues.createComment({
            repo: repo.repo,
            owner: repo.owner,
            issue_number: context.pullRequest().pull_number,
            body: `OPENAI_API_KEY is not set in Variables/Secrets on this repository`,
        });
        return null;
    }
};
const Bot = (app) => {
    app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
        // Get current repository details
        const repo = context.repo();
        // Initialize ChatGPT
        const chat = await loadChat(context);
        if (!chat) {
            throw new Error('Chat initialization failed');
        }
        //Check pull request event type
        const pull_request = context.payload.pull_request;
        if (pull_request.state === 'closed' ||
            pull_request.locked ||
            pull_request.draft) {
            console.log('Invalid pull request event');
            throw new Error('Invalid pull request event');
        }
        // Get commit data from current repository and pull request
        const data = await context.octokit.repos.compareCommits({
            owner: repo.owner,
            repo: repo.repo,
            base: pull_request.base.sha,
            head: pull_request.head.sha,
        });
        let { files: changedFiles, commits } = data.data;
        // This will run when and every new commit is pushed to the pull request
        if (context.payload.action === 'synchronize' && commits.length >= 2) {
            const { data: { files }, } = await context.octokit.repos.compareCommits({
                owner: repo.owner,
                repo: repo.repo,
                base: commits[commits.length - 2].sha,
                head: commits[commits.length - 1].sha,
            });
            const filesNames = files?.map((file) => file.filename) || [];
            changedFiles = changedFiles?.filter((file) => filesNames.includes(file.filename));
        }
        if (!changedFiles?.length) {
            throw new Error('No changes were made');
        }
        // Loop through the changed files to get commit patches to be fed in  chatGPT
        for (let i = 0; i < changedFiles.length; i++) {
            const file = changedFiles[i];
            const patch = file.patch || '';
            if (file.status !== 'modified' && file.status !== 'added') {
                continue;
            }
            if (!patch || patch.length > MAX_PATCH_COUNT) {
                console.log(`${file.filename} skipped due to large diff`);
                continue;
            }
            try {
                const res = await chat?.codeReview(file.filename, patch);
                if (!!res) {
                    await context.octokit.pulls.createReviewComment({
                        repo: repo.repo,
                        owner: repo.owner,
                        pull_number: context.pullRequest().pull_number,
                        commit_id: commits[commits.length - 1].sha,
                        path: file.filename,
                        body: res.includes(constant_1.assessment.APPROVED)
                            ? `${constant_1.assessment.APPROVED} :white_check_mark:`
                            : `### NEEDS REVIEW :bangbang: \n\n${res}`,
                        line: patch.split('\n').length > 1 ? patch.split('\n').length - 1 : 1,
                    });
                }
            }
            catch (e) {
                throw new Error(`Review on ${file.filename} failed.\n ${e}`);
            }
        }
    });
};
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map