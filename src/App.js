import { useEffect, useState } from 'react';
import './App.css';
import ICAL from 'ical.js';
import { ThemeProvider } from '@emotion/react';
import { Divider, LinearProgress, Typography, createTheme } from '@mui/material';

function App() {
  const [timeSinceDataRefresh, setTimeSinceDataRefresh] = useState(0);
  const [dateTime, setDateTime] = useState(new Date());
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [mpBotKarma, setMpBotKarma] = useState(0);
  const [dateForCalendarEvents, setDateForCalendarEvents] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [raindrops, setRaindrops] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const [settings, setSettings] = useState(null);

  const dataRefreshInterval = 60 * 5; //seconds

  useEffect(() => {
    setSettings(JSON.parse(localStorage.getItem('settings') ?? '{}'));
  }, [])

  useEffect(() => {
    const everySecondHook = setInterval(() => {
      //https://medium.com/programming-essentials/how-to-create-a-digital-clock-with-react-hooks-aa30f76cfe3f
      setDateTime(new Date()); //Update the clock

      //Set the background image on initial load
      if (timeSinceDataRefresh == 0 && !backgroundImage) {
        updateData();
        getWeatherForecast();
      }

      if (timeSinceDataRefresh > 0 && timeSinceDataRefresh == dataRefreshInterval) {
        updateData();
        setTimeSinceDataRefresh(0);
      }
      else {
        setTimeSinceDataRefresh(timeSinceDataRefresh + 1);
      }
    }, 1000);

    return () => {
      clearInterval(everySecondHook);
    };
  }, [timeSinceDataRefresh, settings]);

  function updateData() {
    if (settings) {
      updateEarthpornWallpaper();
      getWeatherForecast();
      updateMountainProjectBotKarma();
      updateCalendarEvents();
      getRaindrops();
    }
  }

  async function updateEarthpornWallpaper() {
    const response = await fetch(settings.backgroundImageSrc);
    const data = await response.json();

    var landscapePosts = data.data.children.filter(p => !p.data.is_self && p.data.thumbnail != 'default' && !p.data.stickied && p.data.preview.images[0].source.width > p.data.preview.images[0].source.height);
    var randomPost = landscapePosts[Math.floor(Math.random() * landscapePosts.length)];

    setBackgroundImage(randomPost.data); //Set data so that we can also use it for the post title, posted date, etc
  };

  async function getWeatherForecast() {
    if (!settings.openWeatherSettings) {
      return;
    }

    const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${settings.openWeatherSettings.lat}&lon=${settings.openWeatherSettings.lon}&appid=${settings.openWeatherSettings.appid}&units=${settings.openWeatherSettings.units}&exclude=minutely,hourly`);
    if (response.ok) {
      const data = await response.json();
      setWeatherData(data);
    }
  }

  async function updateMountainProjectBotKarma() {
    const response = await fetch("https://www.reddit.com/user/mountainprojectbot/about.json");
    const data = await response.json();

    setMpBotKarma(data.data.comment_karma);
  }

  async function updateCalendarEvents() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (!settings.calendars) {
      return;
    }

    for (var calendar of settings.calendars) {
      const response = await fetch(settings.corsProxySettings.url + calendar.url, {
        headers: settings.corsProxySettings.headers,
      });

      if (response.ok) {
        const icalData = await response.text();
        calendar.ical = new ICAL.Component(ICAL.parse(icalData));

        //Register timezones (ICAL.js doesn't register timezones by default to reduce size)
        for (var tz of calendar.ical.getAllSubcomponents("vtimezone")){
          ICAL.TimezoneService.register(tz);
        }
      }
    }

    for (var calendar of settings.calendars) {
      var events = calendar.ical.getAllSubcomponents("vevent").map(e => new ICAL.Event(e));

      //Gather all the exception dates for events first, before calculating recurring events.
      //Here we're handling 2 forms of exceptions: EXDATE (cancelled) & RECURRENCE-ID (rescheduled or otherwise modified)
      var exDateMap = {};
      for (var event of events) {
        //Do some "preprocessing" on events (assign some necessary properties)
        event.endDate ??= event.startDate; //Sometimes DTEND may not exist
        event.color = calendar.color; //we could maybe use ??= to only assign the color if it's not assigned

        var exdates;
        if (event.isRecurring()) {
          //For exdates, sometimes Outlook lists a single EXDATE with multiple values rather than multiple EXDATE properties. Hence flatMap & getValues
          exdates = event.component.getAllProperties('exdate').flatMap(d => d.getValues().map(exdate => new Date(exdate)))
          
          if (exdates.length == 0) {
            continue;
          }
        }
        else if (event.isRecurrenceException()) {
          //Once recurrence exceptions are handled here, we can treat them as "normal one-off events" below
          exdates = [event.component.getFirstPropertyValue('recurrence-id').toJSDate()];
        }
        else {
          continue;
        }

        exDateMap[event.uid] = (exDateMap[event.uid] ?? []).concat(exdates);
      }

      calendar.events = events;
      calendar.exDateMap = exDateMap;
      
      //Get today's events & filter down to the ones that are still happening today
      calendar.eventsForToday = getEventsForDate(calendar.events, calendar.exDateMap, today).filter(e => e.instanceEnd > dateTime);
    }

    var eventsToShow = settings.calendars.flatMap(c => c.eventsForToday);
    if (eventsToShow.length == 0) {
      setDateForCalendarEvents(tomorrow);

      for (var calendar of settings.calendars) {
        calendar.eventsForTomorrow = getEventsForDate(calendar.events, calendar.exDateMap, tomorrow);
      }

      eventsToShow = settings.calendars.flatMap(c => c.eventsForTomorrow);
    }

    eventsToShow.sort((a, b) => compareDates(a.instanceStart, b.instanceStart));
    setCalendarEvents(eventsToShow);
  }

  async function getRaindrops() {
    if (!settings.raindrop || !settings.raindrop.temporaryToken) { 
      return;
    }

    const response = await fetch('https://api.raindrop.io/rest/v1/raindrops/0', {
      headers: {
        'Authorization': `Bearer ${settings.raindrop.temporaryToken}`, //Todo: this should be oauth instead
      },
    });

    const items = (await response.json()).items;
    const last5videos = items.filter(i => i.type == 'video' /*Todo: maybe users don't want to filter to 'video' - this should be a setting */).slice(0, 5);
    setRaindrops(last5videos);
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{
        display: 'grid',
        gridAutoColumns: 'minmax(0, 1fr)',
        gridAutoFlow: 'column',
        height: 'calc(100% - 2px)',
        width: '100%',
        backgroundImage: `url(${backgroundImage?.url ?? ""})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'darken',
        transition: 'background-image 5s',
        textShadow: 'black 2px 2px',
      }}>
        <div>
          <TurkiyeTimeWidget dateTime={dateTime}/>
          <RaindropsWidget positionStyles={{position: 'fixed', top: '30%', height: '30%', width: '23%'}} raindrops={raindrops}/>
          {weatherData ? <WeatherWidget positionStyles={{position: 'fixed', bottom: '0px', width: 600, height: 200}} weather={weatherData}/> : null}
        </div>
        <MainClockWidget positionStyles={{alignSelf: 'center', justifySelf: 'center'}} dateTime={dateTime}/>
        <div>
          <MountainProjectBotWidget positionStyles={{position: 'fixed', right: '0px'}} karma={mpBotKarma}/>
          <CalendarWidget positionStyles={{position: 'fixed', bottom: 0, right: 0, width: '24%', height: '35%'}} headerDate={dateForCalendarEvents} events={calendarEvents}/>
        </div>
      </div>
      <LinearProgress sx={{height: 2}} variant="determinate" color="inherit" value={(timeSinceDataRefresh / dataRefreshInterval) * 100} />
    </ThemeProvider>
  );
};

const darkTheme = createTheme({
  palette: {
  mode: 'dark',
  },
});

const convertTZ = (date, tzString) => {
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

const compareDateOnly = (date1, date2) => {
  var date1Time = new Date(date1.getTime());
  date1Time.setHours(0, 0, 0, 0);
  var date2Time = new Date(date2.getTime());
  date2Time.setHours(0, 0, 0, 0);

  return compareDates(date1Time, date2Time);
}

const compareDates = (date1, date2) => {
  var date1Time = date1.getTime();
  var date2Time = date2.getTime();

  if (date1Time < date2Time) {
    return -1;
  }
  else if (date1Time == date2Time) {
    return 0;
  }
  else {
    return 1;
  }
}

const recursOn = (event, precomputedExdates, date) => {
  var recur = event.component.getFirstProperty('rrule').getFirstValue();

  var iterator = recur.iterator(event.startDate);
  for (var next = iterator.next(); next; next = iterator.next()) {
    if (precomputedExdates.find(d => compareDateOnly(d, date) == 0)) {
      return false;
    }

    var compareResult = compareDateOnly(next.toJSDate(), date);
    if (compareResult == 0) {
      return true;
    }
    else if (compareResult == 1) {
      return false;
    }
  }
}

const getEventsForDate = (events, exDateMap, date) => {
  //Todo: note that (similar to the "all day" handling note below) if an event does not start today, but extends *into* today,
  //  it currently will not be shown
  //Todo: Dakboard shows "all day" events. Should we also show this?
  return events.filter(e => {
    if (e.component.getFirstPropertyValue('status').toString().toLowerCase() == 'cancelled') {
      //Todo: verify this
      return false;
    }
    else if (e.isRecurring()) {
      if (recursOn(e, exDateMap[e.uid] ?? [], date)) {
        //Once a matching instance is found, assign properties with this instance's start & end for display
        //(this is very weird to be assigning these on the recurring event, but since we're only ever displaying
        //one day at a time, it is fine. We can change the approach if this changes in the future)
        var eventStart = e.startDate.toJSDate();
        e.instanceStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventStart.getHours(), eventStart.getMinutes());
        var duration = e.endDate.toJSDate().getTime() - eventStart.getTime();
        e.instanceEnd = new Date(e.instanceStart.getTime() + duration);

        return true;
      }

      return false;
    }

    e.instanceStart = e.startDate.toJSDate(); //Set for comparison to recurrence instances
    e.instanceEnd = e.endDate.toJSDate(); //Set for comparison to recurrence instances

    return compareDateOnly(e.startDate.toJSDate(), date) == 0;
  });
}

//------------------------------------
//Dakboard page: https://dakboard.com/screen/uuid/5e27323b-10c376-abb3-7d50bc71be10

// Future improvements:
// - make formatting as close to DakBoard as possible
// - [DONE] r/earthporn wallpaper (not sure what Dakboard uses - maybe some random value of 'hot' or 'top -> week'?)
//   - bonus: image info on bottom
//------------------------------------

const lightGrayBackgroundStyle = { backgroundColor: 'rgba(134, 122, 122, 0.36)', borderRadius: '0.3em', padding: '10px' };

function MountainProjectBotWidget(props) {
  return (
    <div style={{textAlign: 'right', ...props.positionStyles, ...lightGrayBackgroundStyle}}>
      <Typography variant="h5">MountainProjectBot</Typography>
      <div>
        <Typography variant="h4">{props.karma}</Typography>
      </div>
    </div>
  );
}

function CalendarWidget(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', ...props.positionStyles, ...lightGrayBackgroundStyle}}>
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'end'}}>
        <Typography variant="h3" sx={{marginBottom: '8px'}}>{props.headerDate.getDate()}</Typography>
        <Typography variant="h5" sx={{marginBottom: '10px', marginLeft: '10px'}}>{compareDateOnly(props.headerDate, new Date()) == 0 ? "Today" : "Tomorrow"}</Typography>
      </div>
      <Divider sx={{marginBottom: '8px'}}/>
      <div>
        {props.events.map(event =>
          <CalendarEvent key={event.uid} event={event}/>
        )}
      </div>
    </div>
  );
}

function CalendarEvent(props) {
  return (
    <div style={{display: 'flex'}}>
      <div style={{width: 6, backgroundColor: props.event.color, margin: 5}}/>
      <div style={{display: 'flex', flexDirection: 'column', margin: 5}}>
        <div style={{display: 'flex'}}>
          <Typography style={{fontWeight: 'bold'}}>{props.event.instanceStart.toLocaleTimeString("en-US", {hourCycle: 'h23', timeStyle: 'short'})}</Typography>
          <Typography>&nbsp;-&nbsp;{props.event.instanceEnd.toLocaleTimeString("en-US", {hourCycle: 'h23', timeStyle: 'short'})}</Typography>
        </div>
        <Typography style={{fontWeight: 'bold'}}>{props.event.summary}</Typography>
        {props.event.location ? <Typography>in {props.event.location}</Typography> : null}
      </div>
    </div>
  );
}

function MainClockWidget(props) {
  return (
    <div style={{...props.positionStyles}}>
      <div style={{fontSize: '300%'}}>
        <Typography component="div" sx={{fontSize: '3.2em', fontWeight: 300, letterSpacing: '-2px'}}>
          {props.dateTime.toLocaleTimeString("en-US", {hourCycle: 'h23', timeStyle: 'short'})}
          <Typography component="span" sx={{fontSize: '.4em', fontWeight: 400, letterSpacing: '-2px', paddingLeft: '5px', top: '-1em', position: 'relative'}}>{props.dateTime.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2})}</Typography>
        </Typography>
        <Typography component="div" sx={{marginRight: '0.35em', fontSize: 'inherit'}}>{props.dateTime.toLocaleDateString("en-US", {weekday: 'long', month: 'long', day: 'numeric'})}</Typography>
      </div>
    </div>
  );
}

function TurkiyeTimeWidget(props) {
  return (
    <div style={{padding: '10px'}}>
      <Typography variant="h5">Türkiye</Typography>
      <div style={{fontSize: '150%'}}>
        <Typography sx={{fontSize: '3.2em', fontWeight: 300, letterSpacing: '-2px'}}>{convertTZ(props.dateTime, "Asia/Istanbul").toLocaleTimeString("en-US", {hourCycle: 'h23', timeStyle: 'short'})}</Typography>
      </div>
    </div>
  );
}

function RaindropsWidget(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', marginLeft: '8px', ...props.positionStyles}}>
      <Typography variant="h5" sx={{marginBottom: '8px'}}>Raindrops</Typography>
      <Divider sx={{marginBottom: '8px'}}/>
      {props.raindrops?.map(a => 
        <Typography key={a.item_id} variant="h5" sx={{whiteSpace: 'pre-wrap'}}>• {a.title}</Typography>
      )}
    </div>
  );
}

function WeatherWidget(props) {
  return (
    <div style={{display: 'flex', flexDirection: 'row', ...props.positionStyles, ...lightGrayBackgroundStyle}}>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
          <Typography variant="h2">{Math.round(props.weather.current.temp)}°</Typography>
          <WeatherIcon sizingProps={{fontSize: '5rem'}} icon={props.weather.current.weather[0].icon}/>
        </div>
        <Typography variant="h5">Feels like {Math.round(props.weather.current.feels_like)}°</Typography>
      </div>
      {props.weather.daily.slice(0, 4).map(d => <DailyWeather key={d.dt} weather={d}/>)}
    </div>
  );
}

function DailyWeather(props) {
  const date = new Date(props.weather.dt * 1000);

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Typography variant="h5" sx={{marginBottom: '8px'}}>{compareDateOnly(date, new Date()) == 0 ? 'Today' : date.toLocaleDateString("en-US", { weekday: 'short' })}</Typography>
      <WeatherIcon sizingProps={{fontSize: '4.5rem'}} icon={props.weather.weather[0].icon}/>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <Typography sx={{margin: '8px'}}>{Math.round(props.weather.temp.min)}°</Typography>
        <Typography sx={{margin: '8px'}}>{Math.round(props.weather.temp.max)}°</Typography>
      </div>
    </div>
  );
}

function WeatherIcon(props) {
  //Currently just mapping the https://openweathermap.org/weather-conditions icons to bootstrap.
  //FontAwesome requires payment for the same icons as Dakboard - so using bootstrap instead.
  const iconName = props.icon == "01d" || props.icon == "01n"
    ? "sun"
    : props.icon == "02d" || props.icon == "02n"
    ? "cloud-sun"
    : props.icon == "03d" || props.icon == "03n"
    ? "cloudy"
    : props.icon == "04d" || props.icon == "04n"
    ? "clouds"
    : props.icon == "09d" || props.icon == "09n"
    ? "cloud-rain"
    : props.icon == "10d" || props.icon == "10n"
    ? "cloud-drizzle"
    : props.icon == "11d" || props.icon == "11n"
    ? "cloud-lightning"
    : props.icon == "13d" || props.icon == "13n"
    ? "snow"
    : props.icon == "50d" || props.icon == "50n"
    ? "cloud-haze"
    : "";
  return (
    <i style={{height: 100, width: 100, ...props.sizingProps, textAlign: 'center'}} className={`bi bi-${iconName}`}/>
  );
}

export default App;
