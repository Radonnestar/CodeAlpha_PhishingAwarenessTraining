export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.error ?? "Something went wrong. Please try again.", response.status);
  }

  return payload;
}

const modulePath = (moduleId) => `/modules/${encodeURIComponent(moduleId)}`;
const attemptPath = (attemptId) => `/attempts/${encodeURIComponent(attemptId)}`;

export const api = {
  progress: () => request("/progress"),
  module: (moduleId) => request(modulePath(moduleId)),
  completeLesson: (moduleId) => request(`${modulePath(moduleId)}/lesson-complete`, { method: "POST" }),
  startQuiz: (moduleId) => request(`${modulePath(moduleId)}/quiz`, { method: "POST" }),
  startFinalExam: () => request("/final-exam/quiz", { method: "POST" }),
  answer: (attemptId, questionId, choice) =>
    request(`${attemptPath(attemptId)}/answer`, {
      method: "POST",
      body: { question_id: questionId, choice },
    }),
  finish: (attemptId) => request(`${attemptPath(attemptId)}/finish`, { method: "POST" }),
  reset: () => request("/reset", { method: "POST" }),
};