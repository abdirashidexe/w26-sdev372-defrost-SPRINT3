import { useState, useEffect, useMemo } from "react";
import "./index.css";

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const FROST_THRESHOLD_F = 32;
  const WAKEUP_OFFSET_MINUTES = 15;

  const [phone, setPhone] = useState("");
  const [signupMsg, setSignupMsg] = useState(null);
  const [testMsg, setTestMsg] = useState(null);
  const [long, setLong] = useState(0);
  const [lat, setLat] = useState(0);
  const [locError, setLocError] = useState(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const snowflakes = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${4 + Math.random() * 6}s`,
      delay: `${Math.random() * 6}s`,
      size: `${0.7 + Math.random() * 1.2}em`,
    })),
  []);

  useEffect(() => {
    if (weather?.frostRisk === true) document.body.className = "frost-theme";
    else if (weather?.frostRisk === false) document.body.className = "thaw-theme";
    else document.body.className = "";
  }, [weather?.frostRisk]);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setSignupMsg({ type: "error", text: "Enter a phone number first." });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSignupMsg({ type: "error", text: body?.error || `Signup failed (${res.status})` });
        return;
      }
      setSignupMsg({ type: "success", text: `✓ Signed up as ${body.phoneNumber}` });
    } catch (err) {
      console.error(err);
      setSignupMsg({ type: "error", text: "Cannot reach backend. Start backend and try again." });
    }
  };

  const sendTestMessage = async () => {
    setTestMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestMsg({ type: "error", text: body?.error || `Failed (${res.status})` });
        return;
      }
      setTestMsg({ type: "success", text: "✓ Test message sent!" });
    } catch (err) {
      console.log(err);
      setTestMsg({ type: "error", text: "Cannot reach backend." });
    }
  };

  const locationWeather = async (latitude = lat, longitude = long) => {
    if (!latitude || !longitude) {
      setWeatherError("Get your location first to check frost risk.");
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_min&temperature_unit=fahrenheit&forecast_days=3&timezone=auto`
      );
      if (!res.ok) throw new Error("Weather request failed");
      const body = await res.json();
      const tomorrowLow = body?.daily?.temperature_2m_min?.[1];
      const tomorrowDateRaw = body?.daily?.time?.[1];
      if (typeof tomorrowLow !== "number") throw new Error("Missing forecast data");
      const tomorrowDate = tomorrowDateRaw
        ? new Date(tomorrowDateRaw + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
        : null;
      setWeather({
        tomorrowLow,
        tomorrowDate,
        frostRisk: tomorrowLow <= FROST_THRESHOLD_F,
        suggestedWakeupOffset: tomorrowLow <= FROST_THRESHOLD_F ? WAKEUP_OFFSET_MINUTES : 0,
      });
    } catch (err) {
      console.error(err);
      setWeather(null);
      setWeatherError("Unable to load forecast right now.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onLocSuccess, onLocError);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  function onLocError() {
    setLocError("Unable to get location.");
  }
  function onLocSuccess(position) {
    const { latitude, longitude } = position.coords;
    setLat(latitude);
    setLong(longitude);
    setLocationDetected(true);
    setLocError(null);
    locationWeather(latitude, longitude);
  }

  return (
    <>
      {weather?.frostRisk && (
        <div className="snowflake-container">
          {snowflakes.map(f => (
            <span key={f.id} className="snowflake" style={{ left: f.left, animationDuration: f.duration, animationDelay: f.delay, fontSize: f.size }}>❄</span>
          ))}
        </div>
      )}
      <div className="page">
        <div className="hero">
          <h1><span className="bracket">[</span>Defrost<span className="bracket">]</span></h1>
          <p className="tagline">Morning frost alerts for your car</p>
          <p className="hero-desc">
            Wake up ready. Defrost checks tomorrow's overnight low and sends you a text alert when your car needs defrosting — so you're never caught off guard on a cold morning.
          </p>
        </div>
        <div className="register">
          <div className="phone-input">
            <label htmlFor="phone-number" id="userPrompt">Enter a Phone Number:</label>
            <div className="input-wrapper">
              <span className="input-icon">📱</span>
              <input
                id="phone-number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit}>Sign up</button>
          {signupMsg && <p className={signupMsg.type === "success" ? "status-success" : "error"}>{signupMsg.text}</p>}

          <hr className="divider" />

          <button className="btn" onClick={locationDetected ? () => locationWeather() : getLocation}>
            {locationDetected ? "Refresh Forecast" : "Get Location"}
          </button>
          {locationDetected && !locError && <p className="status-success loc-tag">✓ Location detected</p>}
          {locError && <p className="error">{locError}</p>}

          <button className="btn btn-secondary" onClick={sendTestMessage}>Send Test Message</button>
          {testMsg && <p className={testMsg.type === "success" ? "status-success" : "error"}>{testMsg.text}</p>}
          {weatherError && <p className="error">{weatherError}</p>}

          <div className="weather-card">
            {weatherLoading && (
              <div className="weather-loading">
                <div className="loading-spinner" />
                <p>Fetching forecast...</p>
              </div>
            )}
            {!weatherLoading && weather && (
              <>
                <div className="weather-temp-row">
                  <span className="temp-number">{Math.round(weather.tomorrowLow)}°F</span>
                  {weather.frostRisk && <span className="frost-badge">❄ FROST</span>}
                </div>
                <p className="weather-date">{weather.tomorrowDate ?? "Tomorrow"}</p>
                <div className="weather-details">
                  <p>Defrost reminder → {weather.frostRisk ? "ON" : "OFF"}</p>
                  <p>Suggested alarm → {weather.suggestedWakeupOffset > 0 ? `${weather.suggestedWakeupOffset} min earlier` : "No change needed"}</p>
                </div>
              </>
            )}
            {!weatherLoading && !weather && (
              <p className="weather-placeholder">Press "Get Location" to check frost risk.</p>
            )}
          </div>
        </div>
      </div>
      <footer>Copyright © 2026 Defrost. All rights reserved.</footer>
    </>
  );
}

export default App;
