# OpenDak

An open-source, configurable dashboard inspired by [DakBoard](https://dakboard.com/). Display clocks, weather, calendars, and data from any API — all on top of a rotating wallpaper.

## Widget Types

- **Clock** — configurable timezone, 12/24h format, seconds, date display
- **Weather** — current conditions + multi-day forecast via OpenWeatherMap
- **Calendar** — aggregates multiple iCal feeds with color-coded events
- **Generic** — fetch any JSON API with JSONPath selectors for flexible data display

## Configuration

All settings are managed through a slide-out settings panel (click the ⚙️ icon). Settings are stored in `localStorage` and can be exported/imported as JSON.

### Global Settings

| Setting | Description |
|---|---|
| Background Subreddit | Subreddit for rotating wallpaper images (e.g. `EarthPorn`) |
| CORS Proxy | URL + headers for proxying external requests (needed for iCal feeds) |

### Widget Settings

Every widget has base settings for positioning and appearance:

| Setting | Description | Example Values |
|---|---|---|
| Position (x, y) | Pixel, percentage, `center`, `right:0px`, `bottom:0px` | `10%`, `200px`, `center` |
| Size (width, height) | Pixel or percentage | `300px`, `25%` |
| Title | Optional label above the widget | |
| Text Align | `left` or `right` | |
| Background Color | Any rgba value | `rgba(134,122,122,0.36)` |
| Font Size | `small`, `medium`, or `large` | |

Each widget type has additional type-specific settings (API keys, timezones, calendar URLs, JSONPath selectors, etc.) configurable through the settings panel.

## Try It

Visit **[opendak.app](https://opendak.app)** — click the ⚙️ to configure your widgets, or import a pre-made settings JSON via the Import button.