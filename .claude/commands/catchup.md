Read the file `plan.md` in the project root and output a summary using exactly these three sections:

## What was done
List all tasks whose Status field contains "Completed". For each, include the task title and the `Last session` note if present. If no tasks are completed yet, write "Nothing completed yet."

## What's in progress
For any task whose Status field contains "Design in progress", "Design approved", or "In progress", include:
- Task name and number
- Current status value
- Pending sections or decisions (from the Status line or any notes)
- Files involved (from the `Files to change` section)

If there are multiple in-progress tasks, list all of them.
If no task is in progress, write "No task currently in progress."

## Next action
Write one clear, specific sentence describing the immediate next step for the highest-priority in-progress task. Reference the specific task and action (e.g. "Continue Task 2 section 3: implement the AppServices InheritedWidget in `lib/services/app_services.dart`"). If multiple tasks are in progress, pick the one with the most recent `Last session` date, or the lowest task number if dates are equal.
