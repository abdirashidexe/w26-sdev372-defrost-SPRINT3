import { useState } from "react";
import "./index.css";

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const FROST_THRESHOLD_F = 32;
  const WAKEUP_OFFSET_MINUTES = 15;

  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(null);
  const [long, setLong] = useState(0);
  const [lat, setLat] = useState(0);
  const [locError, setLocError] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setStatus("Enter a phone number first.");
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
        setStatus(body?.error || `Signup failed (${res.status})`);
        return;
      }

      setStatus(`Saved as ${body.phoneNumber}`);
      alert("Thank you for your submission!");

    } catch (err) {
      console.error(err);
      setStatus(`Cannot reach backend at ${API_BASE_URL}. Start backend and try again.`);
    }
  };

  const sendTestMessage = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/send-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(body?.error || `SText failed (${res.status})`);
        return;
      }
    } catch (err) {
      console.log(err)
    }
  }

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
      if (typeof tomorrowLow !== "number") throw new Error("Missing forecast data");

      setWeather({
        tomorrowLow,
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
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  function error() {
    setLocError("Unable to get location.");
  }
  function success(position) {
    const { latitude, longitude } = position.coords;
    setLat(latitude);
    setLong(longitude);
    setLocationText(`Latitude: ${latitude}, Longitude: ${longitude}`);
    setLocError(null);
    locationWeather(latitude, longitude);
  }

  return (
    <>
      <h1><span>[Defrost]</span></h1>
      <div className="register">
        <div className="phone-input">
          <label htmlFor="phone-number" id="userPrompt">
            Enter a Phone Number:
            <input
              id="phone-number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </label>
        </div>
        <button className="btn" onClick={handleSubmit}>
          Sign up
        </button>
        {status && <p>{status}</p>}
        <br />
        <button className="btn" onClick={getLocation}>
          Get Location
        </button>
        <br />
        <button className="btn" onClick={sendTestMessage}>
          GSend Test Message to Virtual Phone
        </button>
        <button className="btn" onClick={() => locationWeather()}>
          Check Frost Risk
        </button>
        {locError && <p className="error">{locError}</p>}
        {weatherError && <p className="error">{weatherError}</p>}
        <p>{locationText}</p>

        <div className="weather-card">
          <h2>Tomorrow's Morning</h2>
          {weatherLoading && <p>Loading forecast...</p>}
          {!weatherLoading && weather && (
            <>
              <p>Forecast low ￫ {Math.round(weather.tomorrowLow)}°F</p>
              <p>Defrost reminder ￫ {weather.frostRisk ? "ON" : "OFF"}</p>
              <p>
                Suggested alarm ￫ {" "}
                {weather.suggestedWakeupOffset > 0
                  ? `${weather.suggestedWakeupOffset} minutes earlier`
                  : "No earlier alarm needed"}
              </p>
            </>
          )}
          {!weatherLoading && !weather && <p>Press "Check Frost Risk" after getting location.</p>}
        </div>
      </div>
      <footer>Copyright © 2026 Defrost. All rights reserved.</footer>
    </>
  );
}

export default App;
