import { useState, useEffect, useMemo } from 'react';

export default function Register() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
    const PIRATE_WEATHER_KEY = import.meta.env.VITE_PIRATE_WEATHER_KEY;
    const FROST_THRESHOLD_F = 32;
    const WAKEUP_OFFSET_MINUTES = 15;
    const weatherKeyPresent = Boolean(PIRATE_WEATHER_KEY?.trim());
    const weatherKeyMissingMessage = "Set VITE_PIRATE_WEATHER_KEY in .env to check frost risk.";

    const [email, setEmail] = useState("");
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
        if (!email.trim()) {
            setSignupMsg({ type: "error", text: "Enter your email to sign up." });
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setSignupMsg({ type: "error", text: body?.error || `Signup failed (${res.status})` });
                return;
            }
            setSignupMsg({ type: "success", text: `✓ Signed up as ${body.email ?? email}` });
        } catch (err) {
            console.error(err);
            setSignupMsg({ type: "error", text: "Cannot reach backend. Start backend and try again." });
        }
    };

    const sendTestMessage = async () => {
        setTestMsg(null);
        try {
            const res = await fetch(`${API_BASE_URL}/send-test-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weather }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setTestMsg({ type: "error", text: body?.error || `Failed (${res.status})` });
                return;
            }
            setTestMsg({ type: "success", text: "✓ Test email sent!" });
        } catch (err) {
            console.log(err);
            setTestMsg({ type: "error", text: "Cannot reach backend." });
        }
    };

    const locationWeather = async (latitude = lat, longitude = long) => {
        if (!weatherKeyPresent) {
            setWeatherError(weatherKeyMissingMessage);
            setWeather(null);
            setWeatherLoading(false);
            return;
        }
        if (!latitude || !longitude) {
            setWeatherError("Get your location first to check frost risk.");
            return;
        }
        setWeatherLoading(true);
        setWeatherError(null);
        try {
            const res = await fetch(
                `https://api.pirateweather.net/forecast/${PIRATE_WEATHER_KEY}/${latitude},${longitude}?units=us&exclude=currently,minutely,hourly,alerts`
            );
            if (!res.ok) throw new Error("Weather request failed");
            const body = await res.json();
            const tomorrow = body?.daily?.data?.[1];
            const tomorrowLow = tomorrow?.temperatureLow;
            if (typeof tomorrowLow !== "number") throw new Error("Missing forecast data");
            const tomorrowDate = tomorrow?.time
                ? new Date(tomorrow.time * 1000).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
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
        if (!weatherKeyPresent) {
            setWeatherError(weatherKeyMissingMessage);
            return;
        }
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
            <div className="register">
                <div className="email-input">
                    <label htmlFor="email-input" id="userPrompt">Enter your email:</label>
                    <div className="input-wrapper">
                        <span className="input-icon">📩</span>
                        <input
                            id="email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="you@example.com"
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

                <button className="btn btn-secondary" onClick={sendTestMessage}>Send Test Email</button>
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
                            <p className="weather-date">{weather.tomorrowDate ?? "Tomorrow"}</p>
                            <div className="weather-temp-row">
                                <div>
                                    <p className="temp-label">Overnight Low</p>
                                    <span className={`temp-number ${weather.frostRisk ? "temp-cold" : "temp-warm"}`}>{Math.round(weather.tomorrowLow)}°F</span>
                                </div>
                                {weather.frostRisk && <span className="frost-badge">❄ FROST</span>}
                            </div>
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
        </>
    )
}
