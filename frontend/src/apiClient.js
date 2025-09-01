// Create new file: frontend/src/apiClient.js
const API_URL = "http://127.0.0.1:8000";
let activeUserId = null;

/**
 * Sets the active user ID for all subsequent API requests.
 * @param {number | null} userId The ID of the user to set, or null to clear.
 */
export const setActiveUser = (userId) => {
  activeUserId = userId;
  // You could also store this in localStorage to persist the session
};

/**
 * A wrapper around the fetch API that automatically adds the API base URL,
 * required headers (including the X-User-ID), and handles JSON parsing and errors.
 * @param {string} endpoint The API endpoint to call (e.g., '/transactions/').
 * @param {object} options The standard fetch options object (method, body, etc.).
 * @returns {Promise<any>} A promise that resolves with the JSON response.
 */
export const apiFetch = (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (activeUserId) {
    headers['X-User-ID'] = activeUserId;
  } else {
    // For endpoints that don't require a user (like GET /users), we don't add the header.
    // In a real auth system, this is where you'd handle public vs. private routes.
  }

  const config = {
    ...options,
    headers,
  };

  return fetch(`${API_URL}${endpoint}`, config).then(async (res) => {
    if (!res.ok) {
      // Try to parse the error message from the API
      const errorBody = await res.json().catch(() => ({ detail: 'An unknown error occurred' }));
      throw errorBody;
    }
    // Handle responses with no content (like a DELETE 204)
    return res.status === 204 ? null : res.json();
  });
};