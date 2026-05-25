const BASE_URL = "http://localhost:5116";

// ---------------------------
// SAFE FETCH WRAPPER
// ---------------------------

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);

  const text = await res.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // always throw structured error
  if (!res.ok) {
    const message =
      data?.error ||
      data?.message ||
      data ||
      "Request failed";

    throw new Error(message);
  }

  return data;
}
// ---------------------------
// COMPLETE PROFILE
// ---------------------------

export async function completeCandidateProfile(token: string, body: any) {
  return safeFetch(
    `${BASE_URL}/candidates/complete-profile/${token}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}
// ---------------------------
// EXAM PAGE DATA
// ---------------------------

export async function getExamPageData(token: string) {
  const res = await safeFetch(
    `${BASE_URL}/candidates/exam-page/${token}`,
    { method: "GET" }
  );

  // 🔥 FORCE FAILURE IF BACKEND RETURNS ERROR
  if (!res || res.success === false) {
    throw new Error(res?.error || "Exam not available");
  }

  return res;
}
// ---------------------------
// START EXAM
// ---------------------------
export async function startExam(token: string) {
  const res = await safeFetch(
    `${BASE_URL}/candidates/start-exam/${token}`,
    { method: "POST" }
  );

  return res;
}

// ---------------------------
// SUBMIT EXAM
// ---------------------------
export async function submitExam(token: string, payload: any) {
  return safeFetch(
    `${BASE_URL}/api/submission/submit/${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
}
