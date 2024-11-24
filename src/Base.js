import { ProxyAgent } from 'undici';

class BaseApiClient {
  constructor(proxyUrl = null) {
    this.baseUrl = "https://zero-api.kaisar.io";
    this.headers = {
      "sec-ch-ua-platform": "\"macOS\"",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Brave\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "content-type": "application/json",
      "sec-ch-ua-mobile": "?0",
      "accept": "*/*",
      "sec-gpc": "1",
      "accept-language": "en-US,en;q=0.7",
      "origin": "https://zero.kaisar.io",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "referer": "https://zero.kaisar.io/",
      "priority": "u=1, i"
    };

    this.agent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
  }

  async post(endpoint, body) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        dispatcher: this.agent
      });

      return await this.handleResponse(response);
    } catch (error) {
    //   console.error("Fetch error:", error);
      throw error;
    }
  }

  async get(endpoint, accessToken) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.headers,
      "authorization": `Bearer ${accessToken}`
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
        dispatcher: this.agent
      });

      return await this.handleResponse(response);
    } catch (error) {
    //   console.error("Fetch error:", error);
      throw error;
    }
  }

  async handleResponse(response) {
    const result = await response.json();
    if (response.ok) {
      return result;
    } else {
    //   console.error("API Error:", result);
      throw new Error(result.message || "API request failed");
    }
  }

  async register(email, password, referrer) {
    return await this.post("/auth/register", { email, password, referrer });
  }

  async login(email, password) {
    return await this.post("/auth/login", { email, password });
  }

  async getProfile(accessToken) {
    return await this.get("/user/profile", accessToken);
  }

  async summaryPoint(accessToken) {
    return await this.get("/user/summary", accessToken);
  }
}

export default BaseApiClient;
