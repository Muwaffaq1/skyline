## **1\. Problem Definition**

### **Problem Statement**

Skyline is a focused mobile weather app built around a single primary screen. Its purpose is to answer the user’s most common weather questions in under a few seconds:

* What is the weather right now?  
* How will it change over the next few hours?  
* What does the next five days look like?  
* Do I need to change what I wear, carry, or plan?

The core problem is not access to weather data. Weather data is already abundant. The problem is that many weather products either:

* show too much information at once,  
* prioritize ads or secondary features,  
* bury the most important forecast behind multiple screens,  
* use dense charts that require interpretation,  
* or make users wait too long before showing useful information.

Skyline should optimize for **speed of comprehension**.

A user opening the app should be able to understand the current situation almost immediately, then progressively inspect hourly and daily conditions without changing screens.

The product should therefore behave less like a “weather dashboard” and more like a **glanceable decision interface**.

A successful Skyline session could be as short as 3–5 seconds.

Example:

> User opens Skyline at 7:20 AM.  
> They see 24°C, cloudy, 70% chance of rain around 10 AM, and a high of 29°C.  
> They decide to take an umbrella.  
> They close the app.

That is a complete successful session.

---

### **Product Assumptions**

For the first version, assume:

* Skyline is a mobile-first app.  
* iOS and Android are both eventual targets.  
* V1 can begin with one platform if necessary.  
* Users can use either device location or manually select a city.  
* The main forecast experience lives on one vertically scrollable screen.  
* The primary location is persisted between sessions.  
* Current weather, hourly forecast, and 5-day forecast come from the same weather provider where possible.  
* Weather information is cached locally.  
* Users can choose Celsius or Fahrenheit.  
* Skyline does not generate its own forecasts.  
* Skyline depends on third-party forecast accuracy.  
* V1 does not need weather radar.  
* V1 does not need interactive maps.  
* V1 does not need user accounts.  
* V1 does not need social features.  
* V1 does not need AI-generated weather summaries.  
* V1 does not need advanced meteorological information.  
* Visual quality is a core product requirement, not merely polish.

---

### **Product Principle**

Skyline should follow this information hierarchy:

**Now → Next → Later**

Meaning:

1. **Now**  
   * Current temperature  
   * Current weather condition  
   * Location  
   * High / low  
2. **Next**  
   * Hourly conditions for the next several hours  
3. **Later**  
   * 5-day forecast

Anything outside this hierarchy should have to justify its presence.

For example, humidity might be useful, but it should not compete visually with “rain starts in two hours.”

---

### **Why Now**

Weather apps are a good candidate for a polished lightweight product because several conditions already exist.

**Weather infrastructure is commoditized**

Developers no longer need to build forecasting infrastructure. APIs provide:

* current conditions,  
* hourly predictions,  
* daily predictions,  
* precipitation,  
* weather condition codes,  
* sunrise/sunset,  
* wind,  
* humidity,  
* and location lookup.

This allows Skyline to focus primarily on interface quality, reliability, and interaction design.

**Users already understand weather-app mental models**

Skyline does not have to teach users what an hourly forecast is.

Patterns such as:

* large current temperature,  
* horizontal hourly rows,  
* daily high/low ranges,  
* weather icons,  
* location header,

are already familiar.

This reduces onboarding requirements.

**Weather is naturally high-frequency**

Unlike many utility apps, weather has a reason to be opened repeatedly:

* morning planning,  
* commuting,  
* travel,  
* weekend planning,  
* outdoor activity,  
* changing weather conditions.

This creates opportunities to evaluate retention early.

**Design quality can meaningfully differentiate**

Forecast data across consumer weather apps often comes from similar underlying providers.

That means the differentiator can be:

* clarity,  
* speed,  
* animation,  
* visual hierarchy,  
* useful defaults,  
* responsiveness,  
* and aesthetic identity.

---

### **Who is Affected**

#### **Primary User: Everyday Weather Checker**

Behavior:

* opens the app once or several times per day,  
* wants quick information,  
* does not care about meteorological detail,  
* usually checks their current location,  
* spends very little time per session.

Typical questions:

* “Do I need an umbrella?”  
* “How hot will it get?”  
* “Will it cool down later?”  
* “What will the evening be like?”

This is Skyline's primary design target.

---

#### **Secondary User: Planner**

Behavior:

* cares more about the next few days,  
* may inspect forecast changes,  
* checks weather before planning travel or outdoor activities.

Typical questions:

* “Which day this weekend looks best?”  
* “Will Saturday be rainy?”  
* “Is the temperature dropping this week?”

For this user, the 5-day forecast becomes more important.

---

#### **Secondary User: Traveler**

Behavior:

* searches locations other than their current position,  
* may check several cities in a short period.

Typical questions:

* “What is the weather in London?”  
* “What should I pack for Nairobi?”  
* “Will it rain when I arrive?”

This user introduces stronger requirements around location search.

---

### **Current Workarounds**

Users currently rely on several alternatives.

**Default OS weather applications**

Advantages:

* preinstalled,  
* fast,  
* deeply integrated with the device.

Weakness for Skyline to exploit:

* often contain more depth than needed,  
* design is dictated by broader platform goals,  
* difficult for third-party products to customize.

---

**Google weather searches**

Example:

> “weather Abuja”

Advantages:

* almost zero setup,  
* available everywhere.

Weakness:

* users must search each time,  
* experience is not persistent,  
* limited personalization,  
* no product identity.

---

**Large weather platforms**

Examples include weather portals and dedicated forecast services.

Advantages:

* more data,  
* radar,  
* alerts,  
* historical weather,  
* detailed charts.

Weakness:

* information overload,  
* monetization surfaces,  
* slower navigation,  
* more complex interface.

---

**Widgets**

Users may rely on home-screen widgets.

This creates an important product threat.

If Skyline only answers “what is the temperature?”, a widget may be more convenient than opening the app.

Therefore Skyline's app experience should add value through:

* upcoming changes,  
* hourly visibility,  
* precipitation timing,  
* and short-term planning.

---

## **2\. Job Stories**

* When I am about to leave home  
  I want to immediately see the current temperature and condition  
  So I can decide what to wear before I leave  
* When rain or changing weather is possible  
  I want to see how conditions evolve over the next several hours  
  So I can decide whether to carry an umbrella, delay a trip, or change my plans  
* When I am planning something later this week  
  I want to compare the next five days quickly  
  So I can choose a day with better weather  
* When I am checking weather somewhere other than where I am  
  I want to search for another location  
  So I can plan for travel or people in another city  
* When I reopen the app  
  I want useful weather to appear immediately even if the network is slow  
  So I do not have to wait every time I check conditions

---

## **3\. Risk & Complexity Breakdown**

### **Functional Edge Cases**

#### **Location**

Location introduces more complexity than the weather UI itself.

Possible cases:

* first launch and permission has never been requested,  
* permission granted,  
* permission denied temporarily,  
* permission permanently denied,  
* permission granted only while using the app,  
* approximate location rather than precise location,  
* GPS unavailable,  
* device location stale,  
* user changes cities,  
* user is traveling rapidly,  
* user is near a city boundary,  
* user manually selects a different city than their physical location.

Skyline needs a clear distinction between:

**Current Location**

and

**Selected Location**

Otherwise users may not know which forecast they are viewing.

---

#### **City Search**

Search results can be ambiguous.

Examples:

* Springfield, Illinois  
* Springfield, Missouri  
* London, UK  
* London, Ontario

Search results should therefore include:

* city,  
* state/region where applicable,  
* country.

Bad result:

> London

Better result:

> London, England, United Kingdom

---

#### **Timezone Handling**

Weather APIs often return timestamps in UTC or location-local time.

Possible bugs include:

* showing 3 PM weather as 4 PM,  
* displaying tomorrow too early,  
* daily forecast boundaries misaligned,  
* incorrect sunrise/sunset times.

Skyline should normalize all forecast timestamps to the forecast location's timezone rather than the phone's timezone.

Example:

A user in Lagos checking Tokyo should see Tokyo-local hourly times.

---

#### **Hourly Data**

Questions to define:

* Does the strip show 12 hours?  
* 24 hours?  
* Until midnight?  
* The next 24 forecast points?

Recommended V1:

Show approximately the next 24 hours but initially expose 6–8 columns on screen.

Each item might contain:

* time,  
* condition icon,  
* precipitation probability,  
* temperature.

Potential edge cases:

* current hour has already partially elapsed,  
* weather API returns data every 3 hours instead of hourly,  
* an hour is missing,  
* daylight-saving changes create duplicate/missing hours,  
* precipitation exists but probability is unavailable.

---

#### **Daily Forecast**

The daily forecast needs clearly defined semantics.

Each row should ideally contain:

* weekday,  
* weather icon,  
* precipitation probability when relevant,  
* low temperature,  
* high temperature.

Potential ambiguity:

Does the displayed icon represent:

* morning weather,  
* afternoon weather,  
* the most common condition,  
* the worst condition,  
* the provider's daily summary?

Skyline should display the provider's daily condition rather than inventing its own interpretation unless necessary.

---

#### **Temperature Units**

User states include:

* Celsius default,  
* Fahrenheit preference,  
* system locale-based default.

Recommended logic:

* choose a reasonable system/locale default,  
* allow manual override,  
* save preference locally.

Avoid requesting new forecast data solely because the unit changed when conversion can happen locally.

Formula:

°F \= °C × 9/5 \+ 32\.

---

#### **Extreme Weather Values**

Interface should support:

* negative temperatures,  
* 40°C+ heat,  
* snow,  
* storms,  
* haze,  
* thunderstorms,  
* high wind,  
* unusually large temperature spreads.

Do not design only around visually pleasant values like 22°C.

Test values such as:

* \-18°C,  
* 0°C,  
* 47°C,  
* 100°F.

---

### **UX Confusion Points**

#### **1\. Current vs Today's High**

A common weather presentation might say:

**28°**

**H:31° L:23°**

Users generally understand this pattern, but excessive competing numbers can weaken hierarchy.

Current temperature must remain the largest value.

---

#### **2\. Current Conditions vs Hourly “Now”**

If the current state says:

> 28°C Cloudy

and the first hourly card says:

> Now  
> Cloud icon  
> 28°

the content is duplicated.

This duplication is acceptable because the hourly strip communicates sequence.

However, the first item should probably say **Now** instead of repeating the current clock time.

---

#### **3\. Precipitation Probability**

A number such as:

> 60%

can be misinterpreted.

Users often care more about:

> when rain starts

than the underlying probability model.

Skyline can reduce ambiguity by positioning precipitation percentage alongside the associated hour rather than as a disconnected statistic.

---

#### **4\. Background Visuals**

Weather apps often use:

* gradients,  
* animated clouds,  
* rain effects,  
* sun effects,  
* dynamic photography.

This introduces a major trade-off.

More visual richness can strengthen identity but can also reduce:

* contrast,  
* readability,  
* accessibility,  
* performance,  
* battery efficiency.

Recommended V1:

Use controlled gradients and subtle atmospheric changes rather than full-screen complex animations.

---

#### **5\. Refresh State**

Users need to understand whether data is fresh.

Possible state:

> Updated 8 min ago

This is especially important if cached content loads first.

Avoid showing a full-page loading screen every time the app opens.

Better pattern:

1. show cached forecast immediately,  
2. refresh silently,  
3. update values,  
4. show error only if refresh meaningfully fails.

---

### **System Risks**

#### **API Availability**

Skyline depends heavily on a third-party forecast provider.

Risks:

* downtime,  
* slower API response,  
* pricing changes,  
* reduced free tier,  
* request quota,  
* authentication changes,  
* endpoint deprecation.

Mitigation:

Create an internal weather abstraction.

For example:

```
WeatherProvider
    getCurrentWeather()
    getHourlyForecast()
    getDailyForecast()
    searchLocations()
```

The UI should consume Skyline's own normalized data model rather than raw provider responses.

This makes provider migration easier.

---

#### **Weather Data Normalization**

External APIs may represent conditions differently.

Provider A:

```
weather_code = 61
```

Provider B:

```
condition = "light_rain"
```

Skyline should normalize them into its own set.

Example:

```
CLEAR
PARTLY_CLOUDY
CLOUDY
RAIN
HEAVY_RAIN
THUNDERSTORM
SNOW
FOG
WIND
```

Then map those states to Skyline's visual system.

---

#### **API Quota**

Suppose a free API allows limited requests.

Without caching, usage can grow unnecessarily.

Example:

10,000 users × 5 opens/day \= 50,000 app launches/day.

If each launch makes:

* current request,  
* hourly request,  
* daily request,

that becomes:

150,000 calls/day.

Combining endpoints or caching significantly changes viability.

Skyline should therefore prefer APIs that provide multiple forecast ranges in a single response.

---

#### **Cache Strategy**

Recommended V1 caching approach:

* store last successful weather payload,  
* store location,  
* store fetched timestamp,  
* display cached result immediately,  
* determine whether refresh is required.

Example refresh policy:

**0–10 minutes old**

* use cache,  
* refresh optional.

**10–30 minutes old**

* display cache,  
* refresh in background.

**30+ minutes old**

* display cache,  
* aggressively refresh.

**Several hours old**

* clearly communicate staleness.

Exact timing should eventually be validated with API limits and user expectations.

---

#### **Location Privacy**

Skyline does not need long-term precise location history.

Recommended principle:

Store only what is needed to produce the current forecast.

Avoid building historical location tracking unless required.

---

### **Failure States**

#### **Weather API unavailable**

User sees:

* cached weather if available,  
* stale timestamp,  
* small non-blocking refresh failure state.

Avoid:

> Something went wrong.

Better:

> Couldn't update weather. Showing data from 8:40 AM.

Severity: degraded.

---

#### **No cached weather**

Show a dedicated empty state:

> Weather isn't available right now.

Provide:

* retry,  
* location search where relevant.

Severity: blocking.

---

#### **Location permission denied**

Do not trap the user.

Flow:

> Location access is off.

Then provide:

* **Search for a city**  
* optionally **Open Settings**

Severity: non-blocking.

---

#### **Search fails**

Cases:

* typo,  
* unsupported location,  
* network failure.

Differentiate where possible.

Search miss:

> No locations found for “Abjua”.

Network failure:

> Couldn't search right now. Check your connection and try again.

---

#### **Partial API Response**

Suppose current conditions succeed but daily forecast fails.

Do not destroy the entire screen.

Render:

* current weather,  
* hourly weather,

and isolate the failed daily section.

Severity: degraded.

---

## **4\. User Flows**

### **Primary Flow — First-Time User**

1. User installs Skyline.  
2. User opens the app.  
3. Skyline displays a lightweight first-load state.  
4. App communicates why location is useful.  
5. User taps **Use My Location**.  
6. OS location permission appears.  
7. User approves.  
8. Skyline receives coordinates.  
9. Coordinates are resolved into a display location.  
10. Skyline requests weather data.  
11. Forecast response is normalized.  
12. Data is cached locally.  
13. Main weather screen appears.

Main screen hierarchy:

```
Location
↓
Current weather
↓
Hourly forecast
↓
5-day forecast
```

The user does not need to complete a conventional onboarding sequence.

---

### **Primary Screen**

Example structure:

```
Abuja

28°
Partly Cloudy
High 31° · Low 22°

────────────────────

Now    11AM   12PM   1PM   2PM   3PM
☁      ☁      🌦     🌧    🌧    ☁
28°    29°    30°    29°   27°   27°
       10%    30%    60%   70%   25%

────────────────────

5-Day Forecast

Today     🌦       22° ─── 31°
Fri       ☀️       21° ─── 32°
Sat       🌧       22° ─── 28°
Sun       ☁️       21° ─── 29°
Mon       ☀️       22° ─── 32°
```

The user can obtain most useful information without tapping anything.

---

### **Returning User Flow**

1. User opens Skyline.  
2. Skyline reads cached forecast.  
3. Main screen displays immediately.  
4. App evaluates data freshness.  
5. App requests an updated forecast when needed.  
6. New data replaces cached values.  
7. Transition happens without resetting scroll position.

This flow is strategically important.

The perceived speed of Skyline will depend more on cache behavior than API latency.

---

### **Manual Location Flow**

1. User taps location name.  
2. Location search sheet opens.  
3. Search field receives focus.  
4. Keyboard opens.  
5. User types:  
   Nairobi  
6. App waits briefly to debounce input.  
7. Location API returns suggestions.  
8. User sees:  
   * Nairobi, Nairobi County, Kenya  
9. User taps result.  
10. Search closes.  
11. Main weather content transitions to loading state.  
12. Existing location remains visible until replacement data succeeds.  
13. New forecast loads.  
14. New location becomes active.

Important:

Do not erase the existing weather immediately after a user selects another city.

If the network request fails, preserve the previous usable forecast.

---

### **Permission-Denied Flow**

1. User opens Skyline.  
2. Skyline requests location.  
3. User denies permission.  
4. App does not repeatedly trigger OS permission dialogs.  
5. Skyline displays manual location search.  
6. User enters a city.  
7. Forecast loads normally.  
8. User can later enable device location from settings.

This means location permission should never be a hard requirement.

---

### **Offline Returning User**

1. User opens Skyline.  
2. Network is unavailable.  
3. Cached weather exists.  
4. Cached forecast displays immediately.  
5. Skyline labels update timestamp.  
6. Refresh attempt fails.  
7. Non-blocking offline state appears.  
8. User continues using cached forecast.

---

### **Offline First-Time User**

1. User opens Skyline.  
2. No cached forecast exists.  
3. App attempts network request.  
4. Request fails.  
5. Empty state appears.  
6. User sees explanation and Retry.  
7. Previously entered location should remain stored.  
8. When internet returns, retry can load weather.

---

### **Pull-to-Refresh / Manual Refresh**

Optional V1 behavior:

1. User pulls weather screen downward.  
2. Refresh indicator appears.  
3. API request begins.  
4. Existing weather remains visible.  
5. Request succeeds.  
6. content updates.  
7. “Updated just now” appears briefly.

If request fails:

* preserve existing weather,  
* show a compact error.

---

## **Recommended Main Screen Information Architecture**

I would structure Skyline around four layers.

### **Layer 1 — Location**

Shows:

* current city,  
* optional location icon,  
* location switch affordance.

Example:

> Abuja

Avoid large navigation chrome.

---

### **Layer 2 — Hero Weather**

Dominant area.

Contains:

* current temperature,  
* weather condition,  
* daily high,  
* daily low.

Possible hierarchy:

**28°**

Partly Cloudy

H:31° · L:22°

The current temperature should be the strongest visual element on the screen.

---

### **Layer 3 — Hourly Forecast**

Horizontally scrollable.

Recommended fields per hour:

* time,  
* icon,  
* precipitation probability when meaningful,  
* temperature.

Do not include:

* humidity,  
* wind speed,  
* pressure,

inside each hourly cell in V1.

They would make the strip too dense.

---

### **Layer 4 — 5-Day Forecast**

Vertical rows.

Recommended fields:

* weekday,  
* condition icon,  
* optional precipitation probability,  
* minimum temperature,  
* maximum temperature.

Optionally visualize temperature range with a small horizontal bar.

This helps users recognize patterns faster than comparing raw numbers.

---

## **Visual System Direction**

Skyline's name gives you an opportunity to build a recognizable atmospheric identity.

Possible direction:

The entire background reacts gently to:

* weather,  
* time of day.

Examples:

**Clear morning**

* pale blue,  
* warm sunlight tint.

**Clear evening**

* deeper blue/purple gradient.

**Rain**

* cool desaturated blue.

**Cloudy**

* grey-blue.

**Night**

* navy gradient.

Important constraint:

The weather state should change mood, not restructure the interface.

Users should never need to relearn where information appears because it is raining.

---

## **Animation Guidelines**

Animation can be valuable but should remain functional.

Good examples:

* subtle background gradient transition,  
* forecast values crossfade after refresh,  
* gentle horizontal hourly scrolling,  
* slight weather icon movement,  
* location change transition.

Avoid:

* heavy particle effects,  
* continuous high-FPS rain simulation,  
* animations that delay readability,  
* decorative effects that consume significant battery.

---

## **Accessibility Requirements**

Skyline should not communicate weather through color alone.

For example:

Rain should have:

* icon,  
* text or precipitation indicator,

not only a blue background.

Also account for:

* dynamic text sizes,  
* sufficient contrast,  
* VoiceOver/TalkBack labels,  
* reduced-motion preference,  
* large numeric typography,  
* touch targets around 44px or equivalent.

Weather icon accessibility labels should be meaningful.

Bad:

> Icon 12\.

Good:

> Light rain.

---

## **Data Model**

A normalized internal model might look conceptually like:

```
WeatherLocation
- id
- city
- region
- country
- latitude
- longitude
- timezone

CurrentWeather
- temperature
- feelsLike
- condition
- conditionCode
- high
- low
- timestamp

HourlyForecast
- timestamp
- temperature
- condition
- precipitationProbability

DailyForecast
- date
- minimumTemperature
- maximumTemperature
- condition
- precipitationProbability

WeatherForecast
- location
- current
- hourly[]
- daily[]
- fetchedAt
```

The UI should depend on this model instead of depending directly on API-specific JSON.

---

## **MVP Scope**

### **Must Have**

* Current location detection  
* Manual city search  
* Current temperature  
* Current condition  
* Daily high/low  
* Hourly forecast  
* 5-day forecast  
* Celsius/Fahrenheit  
* Weather condition icons  
* Local caching  
* Refresh behavior  
* Basic offline support  
* Loading states  
* Error states  
* Dynamic visual theme

---

### **Nice to Have**

* Feels-like temperature  
* Sunrise/sunset  
* Wind  
* Humidity  
* UV index  
* Haptic feedback  
* Weather animations  
* Saved locations  
* Current-location shortcut  
* precipitation summary such as:  
  Rain expected around 3 PM

---

### **Explicitly Out of V1**

I would keep these out initially:

* radar,  
* maps,  
* weather alerts infrastructure,  
* account system,  
* cloud sync,  
* widgets,  
* Apple Watch,  
* Wear OS,  
* historical weather,  
* social sharing,  
* AI weather assistant,  
* pollen,  
* air quality,  
* tide data,  
* detailed storm tracking.

These features can easily turn Skyline from a focused utility into a large weather platform before the core experience is validated.

---

## **Key Metrics to Track**

### **Activation**

**Forecast Load Success Rate**

Percentage of new users who reach a populated forecast screen.

Target event funnel:

```
App Open
→ Location chosen
→ API request succeeds
→ Forecast displayed
```

Track where failures occur.

---

### **Speed**

**Time to Useful Weather**

Time between app launch and useful forecast being visible.

Separate:

* cold launch,  
* cached launch,  
* uncached launch.

For returning users, cached weather should make perceived load nearly immediate.

---

### **Engagement**

Track:

* hourly forecast scrolls,  
* city searches,  
* refreshes,  
* forecast row taps if rows become interactive,  
* unit changes.

Do not overvalue session length.

A successful weather app may intentionally have short sessions.

---

### **Retention**

Track:

* D1 retention,  
* D7 retention,  
* D30 retention.

Also evaluate:

**forecast-check frequency per active user**

Weather apps can naturally support frequent repeat behavior.

---

### **Reliability**

Track:

* API error rate,  
* API latency,  
* geocoding failure rate,  
* location permission rate,  
* cached response rate,  
* timeout rate,  
* stale-data usage.

---

## **Open Questions**

### **Product**

* What makes Skyline meaningfully different from the default weather app?  
* Is differentiation primarily visual, functional, or both?  
* Should Skyline aim for “beautiful weather” or “fastest weather”?  
* Is the product supposed to remain deliberately minimal long term?

---

### **Location**

* Does V1 support only one location?  
* Should users be able to save multiple locations?  
* Should current location always be available independently of saved locations?

---

### **Forecast**

* Should hourly forecast cover 12 or 24 hours?  
* Should 5-day eventually become 7-day or 10-day?  
* Should tapping a day reveal hourly information for that date?  
* Should Skyline include “feels like” on the hero screen?

---

### **Precipitation**

* Is rain probability visually prominent at all times?  
* Or only when probability exceeds a threshold?  
* Should Skyline generate contextual summaries like:  
  Rain likely between 4–6 PM?

---

### **Visual Identity**

* Should conditions affect only color?  
* Or also illustration?  
* Should Skyline contain custom weather icons?  
* How much animation is appropriate?  
* How should night mode differ from simply being “dark mode”?

---

### **Technical**

* Which weather API has the best free-tier limits for expected usage?  
* Does it include geocoding?  
* Does it provide hourly forecasts?  
* Does it require attribution?  
* Can current \+ hourly \+ daily data come from one request?  
* What happens when free-tier limits are exceeded?  
* How easy would switching providers be?

---

## **Recommended V1 Product Definition**

The cleanest definition of Skyline V1 is:

> **Skyline is a one-screen weather app that tells you what it feels like now, what is happening over the next few hours, and what the next five days look like—without requiring navigation through multiple screens.**

The key design constraint should be:

> **A returning user should understand today's weather within three seconds of opening the app.**

That gives you a strong filter for future feature decisions. If something makes that core task slower or visually noisier, it probably should not live on the main screen.

