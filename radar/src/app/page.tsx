// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface WeatherData { city: string; temperature: number; humidity: number; timestamp: string; }

export default function Dashboard() {
  const [data, setData] = useState<Map<string, WeatherData>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001", { transports: ["websocket"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("weather-update", (update: WeatherData) => setData(prev => new Map(prev).set(update.city, update)));
    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>Radar</h1>
        <div className="status">{connected ? "● Live stream" : "○ Disconnected"}</div>
      </header>

      {!data.size ? <div className="empty">Waiting for data...</div> : (
        <div className="grid">
          {Array.from(data.values()).map(w => (
            <div key={w.city} className="card">
              <div className="city">{w.city}</div>
              <div className="temp">{w.temperature.toFixed(1)}°</div>
              <div className="meta">
                <span>{w.humidity.toFixed(1)}% H</span>
                <span>{w.timestamp.split("T")[1].substring(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
