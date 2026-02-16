# OpenDak


![](https://i.imgur.com/NNQBcrG.jpeg)

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
| Position (x, y) | Pixel, percentage, `center`, `right:`, `bottom:` | `200`, `10%`, `center`, `right:0` |
| Size (width, height) | Pixel or percentage (bare numbers default to px) | `300`, `25%` |
| Title | Optional label above the widget | |
| Text Align | `left` or `right` | |
| Background Color | Any CSS color — rgba or 8-digit hex | `rgba(134,122,122,0.36)`, `#867A7A5C` |
| Font Size | `small`, `medium`, or `large` | |

Each widget type has additional type-specific settings (API keys, timezones, calendar URLs, JSONPath selectors, etc.) configurable through the settings panel.

### Generic Widget

The Generic widget fetches JSON from any API and uses two selectors to extract and display data:

- **Data Selector** — a [JSONPath](https://goessner.net/articles/JsonPath/) expression that selects which data to extract from the API response. If the result is a single scalar value (e.g. a number or string), it's displayed as-is. If it's an array, each item is shown as a bulleted list.
- **Display Selector** — applied _after_ the Data Selector when the result is an array of objects. Specifies which property of each object to display (e.g. `title`). Supports simple property names or JSONPath expressions starting with `$`.

**Example**: given an API that returns `{ "items": [{ "title": "Foo", "type": "video" }, ...] }`:

| Setting | Value | Effect |
|---|---|---|
| Data Selector | `$.items` | Selects all items |
| Data Selector | `$.items[?(@.type=='video')]` | Selects only items where type is "video" |
| Display Selector | `title` | Shows each item's title instead of the full object |
| Max Items | `5` | Limits output to 5 items |

#### Filter Helpers

The Data Selector also supports these built-in helper functions for date filtering:

| Helper | Description | Example |
|---|---|---|
| `daysAgo(n)` | Returns a timestamp for `n` days ago | `daysAgo(5)` |
| `toDate(s)` | Converts a date string or timestamp to a comparable value | `toDate(@.created)` |

**Example** — show only videos created in the last 5 days:

```
$.items[?(@.type=='video' && toDate(@.created) > daysAgo(5))]
```

## Try It

Visit **[opendak.app](https://opendak.app)** — click the ⚙️ to configure your widgets, or import a pre-made settings JSON via the Import button.
