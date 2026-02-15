import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { compareDateOnly } from '../../utils/dateUtils';

function WeatherIcon({ icon, sizingProps }) {
  const iconName =
    icon === '01d' || icon === '01n' ? 'sun'
    : icon === '02d' || icon === '02n' ? 'cloud-sun'
    : icon === '03d' || icon === '03n' ? 'cloudy'
    : icon === '04d' || icon === '04n' ? 'clouds'
    : icon === '09d' || icon === '09n' ? 'cloud-rain'
    : icon === '10d' || icon === '10n' ? 'cloud-drizzle'
    : icon === '11d' || icon === '11n' ? 'cloud-lightning'
    : icon === '13d' || icon === '13n' ? 'snow'
    : icon === '50d' || icon === '50n' ? 'cloud-haze'
    : '';

  return (
    <i style={{ height: 100, width: 100, textAlign: 'center', ...sizingProps }} className={`bi bi-${iconName}`} />
  );
}

function DailyWeather({ weather }) {
  const date = new Date(weather.dt * 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h5" sx={{ marginBottom: '8px' }}>
        {compareDateOnly(date, new Date()) === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
      </Typography>
      <WeatherIcon sizingProps={{ fontSize: '4.5rem' }} icon={weather.weather[0].icon} />
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Typography sx={{ margin: '8px' }}>{Math.round(weather.temp.min)}°</Typography>
        <Typography sx={{ margin: '8px' }}>{Math.round(weather.temp.max)}°</Typography>
      </div>
    </div>
  );
}

export default function WeatherWidget({ config }) {
  const { refreshSignal } = useSettings();
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const forecastDays = parseInt(config.forecastDays, 10) || 4;

  useEffect(() => {
    if (!config.lat || !config.lon || !config.appid) return;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${config.lat}&lon=${config.lon}&appid=${config.appid}&units=${config.units || 'imperial'}&exclude=minutely,hourly`
        );
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchWeather();
  }, [refreshSignal, config.lat, config.lon, config.appid, config.units]);

  if (error) {
    return <Typography color="error">Weather error: {error}</Typography>;
  }

  if (!weatherData) {
    return <Typography>Loading weather...</Typography>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="h2">{Math.round(weatherData.current.temp)}°</Typography>
          <WeatherIcon sizingProps={{ fontSize: '5rem' }} icon={weatherData.current.weather[0].icon} />
        </div>
        <Typography variant="h5">Feels like {Math.round(weatherData.current.feels_like)}°</Typography>
      </div>
      {weatherData.daily.slice(0, forecastDays).map(d => (
        <DailyWeather key={d.dt} weather={d} />
      ))}
    </div>
  );
}
