import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { compareDateOnly } from '../../utils/dateUtils';

// Map OWM icon codes to Bootstrap Icons
const owmIconMap = {
  '01d': 'sun', '01n': 'sun',
  '02d': 'cloud-sun', '02n': 'cloud-sun',
  '03d': 'cloudy', '03n': 'cloudy',
  '04d': 'clouds', '04n': 'clouds',
  '09d': 'cloud-rain', '09n': 'cloud-rain',
  '10d': 'cloud-drizzle', '10n': 'cloud-drizzle',
  '11d': 'cloud-lightning', '11n': 'cloud-lightning',
  '13d': 'snow', '13n': 'snow',
  '50d': 'cloud-haze', '50n': 'cloud-haze',
};

// Map WMO weather codes (Open-Meteo) to Bootstrap Icons
const wmoIconMap = (code) => {
  if (code === 0) 
    return 'sun';
  if (code === 1 || code === 2) 
    return 'cloud-sun';
  if (code === 3) 
    return 'cloudy';
  if (code >= 45 && code <= 48) 
    return 'cloud-haze';
  if (code >= 51 && code <= 55) 
    return 'cloud-drizzle';
  if (code >= 56 && code <= 57) 
    return 'cloud-drizzle';
  if (code >= 61 && code <= 65) 
    return 'cloud-rain';
  if (code >= 66 && code <= 67) 
    return 'cloud-rain';
  if (code >= 71 && code <= 77) 
    return 'snow';
  if (code >= 80 && code <= 82) 
    return 'cloud-rain';
  if (code >= 85 && code <= 86) 
    return 'snow';
  if (code >= 95 && code <= 99) 
    return 'cloud-lightning';
  return 'cloud';
};

function WeatherIcon({ icon, sizingProps }) {
  return (
    <i style={{ height: 100, width: 100, textAlign: 'center', ...sizingProps }} className={`bi bi-${icon}`} />
  );
}

function DailyWeather({ day }) {
  const date = new Date(day.dt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" sx={{ marginBottom: '8px' }}>
        {compareDateOnly(date, new Date()) === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
      </Typography>
      <WeatherIcon sizingProps={{ fontSize: '4.5rem' }} icon={day.icon} />
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Typography sx={{ margin: '8px' }}>{Math.round(day.min)}°</Typography>
        <Typography sx={{ margin: '8px' }}>{Math.round(day.max)}°</Typography>
      </div>
    </div>
  );
}

// Normalize OWM response to common format
function normalizeOWM(data) {
  return {
    current: {
      temp: Math.round(data.current.temp),
      feelsLike: Math.round(data.current.feels_like),
      icon: owmIconMap[data.current.weather[0].icon] || 'cloud',
    },
    daily: data.daily.map(d => ({
      dt: d.dt * 1000,
      min: d.temp.min,
      max: d.temp.max,
      icon: owmIconMap[d.weather[0].icon] || 'cloud',
    })),
  };
}

// Normalize Open-Meteo response to common format
function normalizeOpenMeteo(data) {
  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      icon: wmoIconMap(data.current.weather_code),
    },
    daily: data.daily.time.map((t, i) => ({
      dt: new Date(t + 'T00:00:00').getTime(),
      min: data.daily.temperature_2m_min[i],
      max: data.daily.temperature_2m_max[i],
      icon: wmoIconMap(data.daily.weather_code[i]),
    })),
  };
}

export default function WeatherWidget({ config }) {
  const { refreshSignal } = useSettings();
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const forecastDays = parseInt(config.forecastDays, 10) || 4;
  const provider = config.provider || 'openmeteo';

  useEffect(() => {
    if (!config.lat || !config.lon) 
      return;
    if (provider === 'openweathermap' && !config.appid) 
      return;

    const fetchWeather = async () => {
      try {
        let url;
        let normalize;

        if (provider === 'openweathermap') {
          url = `https://api.openweathermap.org/data/3.0/onecall?lat=${config.lat}&lon=${config.lon}&appid=${config.appid}&units=${config.units || 'imperial'}&exclude=minutely,hourly`;
          normalize = normalizeOWM;
        }
        else {
          const tempUnit = (config.units || 'imperial') === 'imperial' ? 'fahrenheit' : 'celsius';
          url = `https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=${tempUnit}&forecast_days=${forecastDays}&timezone=auto`;
          normalize = normalizeOpenMeteo;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setWeatherData(normalize(data));
          setError(null);
        }
      }
      catch (err) {
        console.error('WeatherWidget fetch error:', err);
        if (!weatherData) {
          setError(err.message);
        }
      }
    };

    fetchWeather();
  }, [refreshSignal, config.lat, config.lon, config.appid, config.units, provider, forecastDays]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!weatherData && error) {
    return <Typography color="error">Weather error: {error}</Typography>;
  }

  if (!weatherData) {
    return <Typography>Loading weather...</Typography>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="h2">{weatherData.current.temp}°</Typography>
          <WeatherIcon sizingProps={{ fontSize: '5rem' }} icon={weatherData.current.icon} />
        </div>
        <Typography variant="h5">Feels like {weatherData.current.feelsLike}°</Typography>
      </div>
      {weatherData.daily.slice(0, forecastDays).map(d => (
        <DailyWeather key={d.dt} day={d} />
      ))}
    </div>
  );
}
