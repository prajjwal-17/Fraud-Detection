import axios from "axios";
import { env } from "../config/env.js";

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 4000
});

export const predictFraud = async (payload) => {
  const response = await client.post("/predict", payload);
  return response.data;
};
