import axios from "axios";
import Device from "../models/deviceModel.js";

const API_KEY = "9VBVFJRD5A2ZB6JE";
const CHANNEL_ID = "3073978";

// Simple in-memory cache to tolerate transient ThingSpeak outages
let lastGoodDevice = null;
let lastGoodAt = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

const axiosGetWithRetry = async (url, attempts = 3, timeout = 3000) => {
  let delay = 300;
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.get(url, { timeout });
    } catch (err) {
      const status = err?.response?.status;
      // If client error (4xx) don't retry
      if (status && status >= 400 && status < 500) throw err;
      if (i === attempts - 1) throw err;
      // exponential backoff-ish
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

export const getDeviceData = async (req, res) => {
  try {
    // return cached recent device if available
    if (lastGoodDevice && (Date.now() - lastGoodAt) < CACHE_TTL_MS) {
      return res.json([lastGoodDevice]);
    }

    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&results=1`;
    const response = await axiosGetWithRetry(url, 3, 3000);

    // ensure JSON content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Unexpected content-type: ${contentType}`);
    }

    const feed = response.data.feeds[0];
    if (!feed) {
      return res.status(404).json({ message: "No data found" });
    }

    const lastUpdated = new Date(feed.created_at);
    const now = new Date();
    const diffSeconds = (now - lastUpdated) / 1000;

    const isOnline = diffSeconds < 30; // offline if no data for > 30s

    const device = new Device(
      "PRO-ESP8266",
      `${feed.field1 || "0"} °C`,
      `${feed.field2 || "0"} %`,
      feed.created_at,
      isOnline ? "online" : "offline",
      Math.floor(Math.random() * 100)
    );

    // cache last good device
    lastGoodDevice = device;
    lastGoodAt = Date.now();

    res.json([device]);
  } catch (error) {
    // Log more details for debugging: HTTP status and response body when available
    console.error('ThingSpeak fetch failed:', error?.response?.status, error?.response?.data || error.message);

    // Return cached device if available, otherwise a safe offline fallback
    if (lastGoodDevice) {
      return res.json([lastGoodDevice]);
    }

    const fallback = {
      deviceId: 'PRO-ESP8266',
      temperature: '0 °C',
      humidity: '0 %',
      lastUpdated: new Date().toISOString(),
      status: 'offline',
      battery: 0
    };

    return res.json([fallback]);
  }
};
