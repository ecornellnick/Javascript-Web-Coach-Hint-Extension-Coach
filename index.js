// JS/Web example coach extension for Codio
(async function(codioIDE, window) {
  codioIDE.coachBot.register(
    "customExampleJSWeb",
    "Provide an Example",
    onButtonPress
  );

  async function onButtonPress() {
    codioIDE.coachBot.showThinkingAnimation();

    try {
      const context = await codioIDE.coachBot.getContext();
      const environmentGuidance = await loadEnvironmentGuidance();

      const guideInstructions = getGuideInstructions(context);
      const workedExample = getWorkedExample(context);
      const studentFiles = collectRelevantFiles(context);
      const editableTargets = buildEditableTargets(studentFiles);
      const taskBoundaryHints = buildTaskBoundaryHints();
      const assessmentContext = buildAssessmentContext(context, studentFiles);
      const instructorReference = getInstructorReference(context);

      const step1Vars = {
        CONTEXT_TYPE: "file_project",
        STUDENT_CONTEXT: JSON.stringify(studentFiles),
        INSTRUCTOR_REFERENCE: instructorReference,
        GUIDE_INSTRUCTIONS: guideInstructions,
        WORKED_EXAMPLE: workedExample,
        EDITABLE_TARGETS: JSON.stringify(editableTargets),
        TASK_BOUNDARY_HINTS: JSON.stringify(taskBoundaryHints),
        ASSESSMENT_CONTEXT: JSON.stringify(assessmentContext),
        ENVIRONMENT_GUIDANCE: JSON.stringify(environmentGuidance)
      };

      const step1Result = await codioIDE.coachBot.ask({
        systemPrompt: "You locate student task units and determine NOT_STARTED vs HAS_ATTEMPTED. Return only valid JSON.",
        userPrompt: "{% prompt 'AGENT_STEP_1_LOCATE_TASKS' %}",
        vars: step1Vars
      }, { stream: false, preventMenu: true });

      const step2Result = await codioIDE.coachBot.ask({
        systemPrompt: "You analyze JavaScript/web student work and choose the best task to address. Return only valid JSON.",
        userPrompt: "{% prompt 'AGENT_STEP_2_ANALYZE_JS_WEB' %}",
        vars: {
          CONTEXT_TYPE: "file_project",
          STUDENT_CONTEXT: JSON.stringify(studentFiles),
          INSTRUCTOR_REFERENCE: instructorReference,
          GUIDE_INSTRUCTIONS: guideInstructions,
          WORKED_EXAMPLE: workedExample,
          EDITABLE_TARGETS: JSON.stringify(editableTargets),
          TASK_BOUNDARY_HINTS: JSON.stringify(taskBoundaryHints),
          ASSESSMENT_CONTEXT: JSON.stringify(assessmentContext),
          ENVIRONMENT_GUIDANCE: JSON.stringify(environmentGuidance),
          STEP_1: step1Result.result
        }
      }, { stream: false, preventMenu: true });

      codioIDE.coachBot.hideThinkingAnimation();

      await codioIDE.coachBot.ask({
        systemPrompt: "You provide one short, bounded programming example for learning. Return only plain text.",
        userPrompt: "{% prompt 'AGENT_STEP_3_PROVIDE_EXAMPLE_JS_WEB' %}",
        vars: {
          GUIDE_INSTRUCTIONS: guideInstructions,
          WORKED_EXAMPLE: workedExample,
          STEP_1: step1Result.result,
          STEP_2: step2Result.result
        }
      });
    } catch (error) {
      handlePipelineError(error);
    }
  }

  async function loadEnvironmentGuidance() {
    try {
      const response = await fetch("step1_environment_guidance_js_web.json");
      if (!response.ok) {
        throw new Error("Unable to load step1 environment guidance");
      }
      return await response.json();
    } catch (error) {
      console.error("Guidance load error:", error);
      return {
        context_type: "file_project",
        fallback: true,
        note: "No external environment guidance could be loaded."
      };
    }
  }

  function getGuideInstructions(context) {
    if (context && context.guidesPage && typeof context.guidesPage.content === "string") {
      return context.guidesPage.content;
    }
    return "";
  }

  function getWorkedExample(context) {
    if (context && context.guidesPage && typeof context.guidesPage.content === "string") {
      const title = String(context.guidesPage.title || "").toLowerCase();
      if (title.includes("example") || title.includes("walkthrough")) {
        return context.guidesPage.content;
      }
    }
    return "";
  }

  function getInstructorReference(context) {
    // Leave room for secure solution exposure if the platform provides it later.
    if (context && typeof context.instructorReference === "string") {
      return context.instructorReference;
    }
    return "";
  }

  function collectRelevantFiles(context) {
    const results = [];
    const seen = new Set();

    function visit(value, pathHint) {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach((item, index) => visit(item, pathHint + "[" + index + "]"));
        return;
      }

      if (typeof value !== "object") return;

      if (typeof value.path === "string" && typeof value.content === "string") {
        const filePath = value.path;
        if (seen.has(filePath)) return;
        if (ignoreFile(filePath)) return;
        seen.add(filePath);
        results.push({
          path: filePath,
          content: value.content
        });
      }

      Object.keys(value).forEach(function(key) {
        visit(value[key], pathHint ? pathHint + "." + key : key);
      });
    }

    visit(context, "");
    return results;
  }

  function ignoreFile(filePath) {
    return (
      filePath.includes("node_modules/") ||
      filePath.includes(".guides/secure/") ||
      filePath.endsWith(".png") ||
      filePath.endsWith(".jpg") ||
      filePath.endsWith(".jpeg") ||
      filePath.endsWith(".gif") ||
      filePath.endsWith(".pdf") ||
      filePath.endsWith(".zip")
    );
  }

  function buildEditableTargets(studentFiles) {
    return {
      files: studentFiles.map(function(file) { return file.path; }),
      likely_editable: studentFiles
        .filter(function(file) {
          return file.path.endsWith(".js") || file.path.endsWith(".html") || file.path.endsWith(".css");
        })
        .map(function(file) { return file.path; })
    };
  }

  function buildTaskBoundaryHints() {
    return {
      editable_markers: [
        "// YOUR CODE STARTS HERE",
        "// YOUR CODE ENDS HERE"
      ],
      freeze_markers: [
        "// FREEZE CODE BEGIN",
        "// FREEZE CODE END"
      ],
      todo_patterns: [
        "TODO",
        "Step 1",
        "Step 2",
        "Step 3",
        "Part One",
        "Part Two",
        "Part Three"
      ],
      infer_from_solution: true
    };
  }

  function buildAssessmentContext(context, studentFiles) {
    return {
      guide_title: context && context.guidesPage ? context.guidesPage.title || "" : "",
      file_count: studentFiles.length,
      student_files: studentFiles.map(function(file) { return file.path; })
    };
  }

  function handlePipelineError(error) {
    console.error("JS/web example pipeline error:", error);
    codioIDE.coachBot.hideThinkingAnimation();
    codioIDE.coachBot.write("I'm having trouble generating an example right now. Please try again.");
    codioIDE.coachBot.showMenu();
  }
})(window.codioIDE, window);
