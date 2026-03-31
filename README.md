# JavaScript/Web Example Coach

This extension bundle is the JavaScript/web implementation of the Coding Coach pipeline for the CIS560-style program.

## Scope

This version supports only one student-facing action:

- `Provide an Example`

It does not implement `Explain an Error` or `Summarize Instructions`.

## Pipeline

The extension uses a three-step pipeline:

1. `AGENT_STEP_1_LOCATE_TASKS`
   - Shared prompt
   - Locates task units and determines `NOT_STARTED` vs `HAS_ATTEMPTED`
2. `AGENT_STEP_2_ANALYZE_JS_WEB`
   - JavaScript/web-specific prompt
   - Selects the task to address and diagnoses the concept to teach
3. `AGENT_STEP_3_PROVIDE_EXAMPLE_JS_WEB`
   - JavaScript/web-specific response prompt
   - Produces one bounded example and explanation

## Required Prompt IDs

- `AGENT_STEP_1_LOCATE_TASKS`
- `AGENT_STEP_2_ANALYZE_JS_WEB`
- `AGENT_STEP_3_PROVIDE_EXAMPLE_JS_WEB`

## Environment Guidance

This extension loads:

- [step1_environment_guidance_js_web.json](/Users/tblanchard/Codex%20Projects/Coding%20Coach%20Prompts/Javascript%20Version/Extension%20files/step1_environment_guidance_js_web.json)

The guidance file is passed into the shared step-1 prompt as `ENVIRONMENT_GUIDANCE`.

## Notes On Context Collection

The extension attempts to gather:

- current guide-page content
- worked-example content when available
- relevant student file contents exposed in Coach context
- editable-file hints
- task-boundary hints
- lightweight assessment context

The current implementation does not depend on a hardcoded `interactivity.js` filename, although many course projects use that file.

If secure solution content becomes available through Coach context in the future, the extension can pass it in the `INSTRUCTOR_REFERENCE` variable without changing the prompt contract.
