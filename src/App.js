import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner
} from "react-bootstrap";

const API_KEY = "97e64286799de2ee1b720111ca494848";

export default function ClimaverseApp() {
  const [city, setCity] = useState("");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState([]);
  const [dailyWeather, setDailyWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useNightIcons, setUseNightIcons] = useState(false);
  const [istanbulTime, setIstanbulTime] = useState("");

  const hourlyRef = useRef(null);
  const dailyRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
    
      const day = now.toLocaleDateString("en-US", {
        timeZone: "Europe/Istanbul",
        weekday: "short"
      });
    
      const date = now.toLocaleDateString("en-US", {
        timeZone: "Europe/Istanbul",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    
      const time = now.toLocaleTimeString("en-US", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false // change to true if you want AM/PM format
      });
    
      setIstanbulTime(`📅 ${day},  ${date} — 🕒 ${time}`);
    };
    

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (city.trim() === "") return;
    setLoading(true);

    try {
      const [currentRes, forecastRes] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
      ]);

      setCurrentWeather({
        temp: Math.round(currentRes.data.main.temp),
        feels_like: Math.round(currentRes.data.main.feels_like),
        temp_min: Math.round(currentRes.data.main.temp_min), 
        temp_max: Math.round(currentRes.data.main.temp_max), 
        description: currentRes.data.weather[0].main,
        icon: currentRes.data.weather[0].icon,
        name: currentRes.data.name,
        country: currentRes.data.sys.country
      });

      const { hourly, daily } = processForecastData(forecastRes.data);
      setHourlyWeather(hourly);
      setDailyWeather(daily);
      setCity("");
    } catch (error) {
      alert("City not found. Please try a different name.");
      setCurrentWeather(null);
      setHourlyWeather([]);
      setDailyWeather([]);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const processForecastData = (data) => {
    const hourly = data.list.slice(0, 8).map((item) => ({
      time: item.dt_txt.split(" ")[1].slice(0, 5),
      temp: Math.round(item.main.temp),
      icon: item.weather[0].icon,
      description: item.weather[0].main
    }));

    const dailyMap = {};
    data.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];
      if (!dailyMap[date]) {
        const dayName = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "short" });
        dailyMap[date] = {
          day: dayName,
          temp: Math.round(item.main.temp),
          icon: item.weather[0].icon,
          description: item.weather[0].main
        };
      }
    });

    const daily = Object.values(dailyMap).slice(0, 7);
    return { hourly, daily };
  };

  const toggleIconVersion = (icon) => icon.replace(/.$/, useNightIcons ? "n" : "d");

  const scrollHorizontally = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === "left" ? -100 : 100, behavior: "smooth" });
    }
  };

  const backgroundClass = useNightIcons ? "night-bg" : "day-bg";

  return (
    <div className={`climaverse-bg text-white py-5 ${backgroundClass}`}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <div className="text-center mb-4">
              <h1 className="display-5 fw-bold">Climaverse</h1>
              <div className="text-white-50">Your Climate Companion</div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
              <Form.Check 
                type="switch"
                id="icon-style-toggle"
                label={useNightIcons ? "Night Mode" : "Day Mode"}
                checked={useNightIcons}
                onChange={() => setUseNightIcons(!useNightIcons)}
                className="text-white"
              />
              <div className="text-white small" style={{ fontSize: "1rem" }}>
               {istanbulTime}
              </div>
            </div>

            <Form onSubmit={handleSubmit} className="mb-4">
              <Form.Group className="d-flex search-glass rounded-pill">
                <Form.Control
                  type="text"
                  placeholder="Enter city"
                  className="bg-transparent text-white border-0 shadow-none px-3"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Button type="submit" variant="light" className="rounded-pill px-4">
                  Search
                </Button>
              </Form.Group>
            </Form>

            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="light" />
                <div className="mt-3 fs-5">Fetching weather...</div>
              </div>
            ) : (
              <>
                {currentWeather && (
                  <div className="main-weather-card text-center mb-4 p-4">
                    <div className="weather-icon mb-2">
                      <img
                        src={`https://openweathermap.org/img/wn/${toggleIconVersion(currentWeather.icon)}@4x.png`}
                        alt={currentWeather.description}
                      />
                    </div>
                    <h2 className="mt-2">{currentWeather.name}, {currentWeather.country}</h2>
                    <h3 className="display-3 fw-bold">{currentWeather.temp}°</h3>
                    <p className="lead text-capitalize">{currentWeather.description}</p>
                    <p className="small">Feels like {currentWeather.feels_like}°</p>
                    <div className="d-flex gap-3 px-2 justify-content-center">
  <span>Low: {currentWeather.temp_min}°</span>
  <span>High: {currentWeather.temp_max}°</span>
</div>

                  </div>
                )}

                {hourlyWeather.length > 0 && (
                  <div className="glass-card p-3 rounded mb-4">
                    <h5 className="text-center mb-3">Next 24 Hours</h5>
                    <div className="scroll-wrapper">
                      <button className="scroll-arrow me-2" onClick={() => scrollHorizontally(hourlyRef, "left")}>&#11207;</button>
                      <div className="d-flex overflow-auto no-scrollbar" ref={hourlyRef}>
                        {hourlyWeather.map((hour, index) => (
                          <div
                            key={index}
                            className="text-center flex-shrink-0 mx-2 p-2 rounded small-hour-card"
                          >
                            <div>{hour.time}</div>
                            <img
                              src={`https://openweathermap.org/img/wn/${toggleIconVersion(hour.icon)}.png`}
                              alt={hour.description}
                            />
                            <div>{hour.temp}°</div>
                          </div>
                        ))}
                      </div>
                      <button className="scroll-arrow ms-2" onClick={() => scrollHorizontally(hourlyRef, "right")}>&#11208;</button>
                    </div>
                  </div>
                )}

                {dailyWeather.length > 0 && (
                  <div className="glass-card p-3 rounded">
                    <h5 className="text-center mb-3">Next 7 Days</h5>
                    <div className="scroll-wrapper">
                      <button className="scroll-arrow me-2" onClick={() => scrollHorizontally(dailyRef, "left")}>&#11207;</button>
                      <div className="d-flex overflow-auto no-scrollbar" ref={dailyRef}>
                        {dailyWeather.map((day, index) => (
                          <div
                            key={index}
                            className="text-center flex-shrink-0 mx-2 p-2 rounded small-day-card"
                          >
                            <div className="fw-bold">{day.day}</div>
                            <img
                              src={`https://openweathermap.org/img/wn/${toggleIconVersion(day.icon)}.png`}
                              alt={day.description}
                            />
                            <div>{day.temp}°</div>
                          </div>
                        ))}
                      </div>
                      <button className="scroll-arrow ms-2" onClick={() => scrollHorizontally(dailyRef, "right")}>&#11208;</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
