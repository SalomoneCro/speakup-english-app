import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Azure Speech SDK to work server-side
  serverExternalPackages: ["microsoft-cognitiveservices-speech-sdk"],
};

export default nextConfig;
