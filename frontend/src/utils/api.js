const API_URL = process.env.REACT_APP_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const api = {
  get: async (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${API_URL}${url}?${queryString}` : `${API_URL}${url}`;

    try {
      const res = await fetch(fullUrl, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          data?.error || `Request failed with status ${res.status}`
        );
      }

      return data;
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Is the backend running?");
      }
      throw error;
    }
  },

  post: async (url, data = {}) => {
    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          responseData?.error || `Request failed with status ${res.status}`
        );
      }

      if (res.status === 204) return null;
      return responseData;
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Is the backend running?");
      }
      throw error;
    }
  },

  patch: async (url, data = {}) => {
    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          responseData?.error || `Request failed with status ${res.status}`
        );
      }

      if (res.status === 204) return null;
      return responseData;
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Is the backend running?");
      }
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok && res.status !== 204) {
        const data = await parseResponse(res);
        throw new Error(
          data?.error || `Request failed with status ${res.status}`
        );
      }

      return null;
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Is the backend running?");
      }
      throw error;
    }
  },
};

export default api;
