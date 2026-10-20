# Git Workflow Automation Rule

After completing any task, bugfix, or meaningful code change:
1. Stage all changes: `git add .`
2. Commit changes using conventional commits describing the task:
   - Format: `git commit -m "<type>(<scope>): <task description>"`
   - Never add "Co-Authored-By" or AI attribution.
3. Push commits to the current remote tracking branch: `git push`
