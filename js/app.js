// app.js

const API_KEY = "fe2e0987d3ede21679cdbf748d879be5";
const weatherInfo = document.getElementById("weather-info");
const searchInput = document.querySelector(".form-inline .form-control");
const searchForm = document.querySelector(".form-inline");
const dailyForecastTable = document
  .getElementById("daily-forecast-table")
  .querySelector("tbody");
const hourlyForecastContainer = document.getElementById(
  "hourly-forecast-container"
);
const unitRadios = document.querySelectorAll('input[name="units"]');


// Fetch weather data from API
function fetchWeatherData(city, units) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`;
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      displayWeatherData(data);
      fetchForecastData(data.coord.lat, data.coord.lon, units);
      fetchAirQualityData(data.coord.lat, data.coord.lon); // Add this line
    })
    .catch((error) => {
      console.log("Error:", error);
      alert("Failed to fetch weather data. Please try again.");
    });
}

// Fetch weather data based on user's location
function fetchWeatherByLocation(units) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherDataByCoords(lat, lon, units);
            },
            (error) => {
                console.log("Error:", error);
                alert("Failed to retrieve location. Please allow location access.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Fetch weather data by coordinates
function fetchWeatherDataByCoords(lat, lon, units) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      displayWeatherData(data);
      fetchForecastData(lat, lon, units);
      fetchAirQualityData(lat, lon); // Add this line
    })
    .catch((error) => {
      console.log("Error:", error);
      alert("Failed to fetch weather data. Please try again.");
    });
}

function displayWeatherData(data) {
    const cityName = data.name;
    const temperature = data.main.temp;
    const description = data.weather[0].description;
    const feelsLike = data.main.feels_like;

    document.getElementById("city").textContent = cityName;
    document.getElementById("temp").textContent = temperature.toFixed(1)+"°";
    document.getElementById("description").textContent = description;

    document.getElementById("feels-like-temp").textContent = `${feelsLike.toFixed(1)}°`;
    document.getElementById("feels-like-description").textContent = getFeelsLikeDescription(temperature, feelsLike);
}

// Function to generate the "Feels Like" description
function getFeelsLikeDescription(actualTemp, feelsLikeTemp) {
    const diff = feelsLikeTemp - actualTemp;
    if (diff > 3) {
        return "Feels warmer than it is";
    } else if (diff < -3) {
        return "Feels colder than it is";
    } else {
        return "Feels about right";
    }
}

// Fetch forecast data from API
function fetchForecastData(lat, lon, units) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      displayDailyForecastData(data.list);
      displayHourlyForecastData(data.list, data.city.sunrise, data.city.sunset);
      displayRainForecast(data.list);
    })
    .catch((error) => {
      console.log("Error:", error);
      alert("Failed to fetch forecast data. Please try again.");
    });
}



// Function to format date as three-letter weekday abbreviation or "Today" if it is the current date
function formatWeekday(date) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    
    // Check if the given date is today
    if (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()) {
        return "Today";
    }
    
    return daysOfWeek[date.getUTCDay()];
}

// Display daily forecast data
function displayDailyForecastData(forecastList) {
  const dailyForecast = {};
  let weeklyMinTemp = Infinity;
  let weeklyMaxTemp = -Infinity;

  // Group forecast data by date and find weekly min/max temperatures
  forecastList.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const dateString = formatDate(date);

    if (!dailyForecast[dateString]) {
      dailyForecast[dateString] = {
        date: date,
        temps: [],
        icon: forecast.weather[0].icon,
      };
    }

    const temperature = forecast.main.temp;
    dailyForecast[dateString].temps.push(temperature);
    weeklyMinTemp = Math.min(weeklyMinTemp, temperature);
    weeklyMaxTemp = Math.max(weeklyMaxTemp, temperature);
  });

  // Clear the existing content in the daily forecast table
  dailyForecastTable.innerHTML = "";

  // Iterate over each date in the daily forecast
  for (const dateString in dailyForecast) {
    const forecast = dailyForecast[dateString];
    const date = forecast.date;
    const temps = forecast.temps;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const AlticonCode = forecast.icon;
    
    // Modify the icon code
    const iconCode = AlticonCode.slice(0, -1) + "d";

    // Create a new table row element
    const row = document.createElement("tr");

    // Calculate positions for the temperature range bar
    const dailyMinPosition = ((minTemp - weeklyMinTemp) / (weeklyMaxTemp - weeklyMinTemp)) * 100;
    const dailyMaxPosition = ((maxTemp - weeklyMinTemp) / (weeklyMaxTemp - weeklyMinTemp)) * 100;

    // Populate the row with cells
    row.innerHTML = `
      <td>${formatWeekday(date)}</td>
      <td><img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather Icon"></td>
      <td>${minTemp.toFixed(1)}°</td>
      <td class="d-none d-md-table-cell">
        <div class="temp-range-bar">
          <div class="daily-range-bar" style="left: ${dailyMinPosition}%; right: ${100 - dailyMaxPosition}%;"></div>
        </div>
      </td>
      <td>${maxTemp.toFixed(1)}°</td>
    `;

    // Append the row to the daily forecast table
    dailyForecastTable.appendChild(row);
  }
}

// Display hourly forecast data
function displayHourlyForecastData(forecastList, sunrise, sunset) {
  const hourlyForecast = getHourlyForecast(forecastList, sunrise, sunset);
  hourlyForecastContainer.innerHTML = "";

  hourlyForecast.forEach((item, index) => {
    const col = document.createElement("div");
    col.className = "forecast-card";

    const timeElement = document.createElement("div");
    timeElement.className = "hour";

    if (item.type === "forecast") {
      // Display "Now" for the first item, otherwise show the hour
      if (index === 0) {
        timeElement.textContent = "Now";
      } else {
        const hour = new Date(item.dt * 1000).getHours();
        timeElement.textContent = `${hour.toString().padStart(2, "0")}:00`;
      }

      const iconElement = document.createElement("img");
      iconElement.className = "weather-icon";
      const iconCode = item.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
      iconElement.setAttribute("src", iconUrl);

      const tempElement = document.createElement("div");
      tempElement.className = "temperature";
      const temperature = item.main.temp.toFixed(1);
      tempElement.textContent = `${temperature}°`;

      col.appendChild(timeElement);
      col.appendChild(iconElement);
      col.appendChild(tempElement);
    } else if (item.type === "sunrise" || item.type === "sunset") {
      const time = new Date(item.time * 1000);
      timeElement.textContent = `${time
        .getHours()
        .toString()
        .padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;

      const iconElement = document.createElement("div");
      iconElement.className = "sun-icon";
      iconElement.textContent = item.type === "sunrise" ? "🌅" : "🌇";

      const labelElement = document.createElement("div");
      labelElement.className = "sun-label";
      labelElement.textContent = item.type === "sunrise" ? "Sunrise" : "Sunset";

      col.appendChild(timeElement);
      col.appendChild(iconElement);
      col.appendChild(labelElement);
      col.classList.add(item.type);
    }

    hourlyForecastContainer.appendChild(col);
  });
}


// Get daily forecast data
function getDailyForecast(forecastList) {
    const dailyForecast = {};

    forecastList.forEach((forecast) => {
        const date = new Date(forecast.dt * 1000);
        const dateString = formatDate(date);

        if (!dailyForecast[dateString]) {
            dailyForecast[dateString] = {
                date: date,
                temps: [],
                icon: forecast.weather[0].icon,
            };
        }

        dailyForecast[dateString].temps.push(forecast.main.temp);
    });

    return dailyForecast;
}

// Get hourly forecast data
function getHourlyForecast(forecastList, sunrise, sunset) {
  const hourlyForecast = [];
  const now = new Date();
  now.setMinutes(0, 0, 0); // Set minutes and seconds to 0
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Add the current weather as the first item
  if (forecastList.length > 0) {
    hourlyForecast.push({ type: "forecast", ...forecastList[0] });
  }

  // Calculate sunrise and sunset times for today and tomorrow
  const todaySunrise = new Date(sunrise * 1000);
  const todaySunset = new Date(sunset * 1000);
  const tomorrowSunrise = new Date(
    todaySunrise.getTime() + 24 * 60 * 60 * 1000
  );
  const tomorrowSunset = new Date(todaySunset.getTime() + 24 * 60 * 60 * 1000);

  // Create an array of sun events within the next 24 hours
  const sunEvents = [
    { type: "sunrise", time: todaySunrise },
    { type: "sunset", time: todaySunset },
    { type: "sunrise", time: tomorrowSunrise },
    { type: "sunset", time: tomorrowSunset },
  ].filter((event) => event.time > now && event.time <= twentyFourHoursLater);

  // Filter and add forecasts for the next 23 hours, including sunrise and sunset
  forecastList.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000);
    if (
      forecastDate > now &&
      forecastDate <= twentyFourHoursLater &&
      forecastDate.getMinutes() === 0
    ) {
      // Add any sun events that occur before this forecast
      while (sunEvents.length > 0 && sunEvents[0].time < forecastDate) {
        hourlyForecast.push({
          type: sunEvents[0].type,
          time: sunEvents[0].time.getTime() / 1000,
        });
        sunEvents.shift();
      }
      hourlyForecast.push({ type: "forecast", ...forecast });
    }
  });

  // Add any remaining sun events
  hourlyForecast.push(
    ...sunEvents.map((event) => ({
      type: event.type,
      time: event.time.getTime() / 1000,
    }))
  );

  // Sort the forecast to ensure sunrise and sunset are in the correct position
  hourlyForecast.sort((a, b) => {
    const timeA = a.type === "forecast" ? a.dt : a.time;
    const timeB = b.type === "forecast" ? b.dt : b.time;
    return timeA - timeB;
  });

  return hourlyForecast;
}


// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Get temperature unit symbol
function getUnitSymbol() {
    const unit = document.querySelector('input[name="units"]:checked').value;
    return unit === "metric" ? "C" : "F";
}

// Event listener for search form submission
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInput.value.trim();
  const units = document.querySelector('input[name="units"]:checked').value;
  if (city !== "") {
    fetchWeatherData(city, units);
    searchInput.value = "";
  }
});


// Event listener for unit change
unitRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
        const city = document.getElementById("city").textContent;
        const units = radio.value;
        if (city) {
            fetchWeatherData(city, units);
        } else {
            fetchWeatherByLocation(units);
        }
    });
});

// Fetch weather data for user's location on page load
document.addEventListener("DOMContentLoaded", () => {
    const units = document.querySelector('input[name="units"]:checked').value;
    fetchWeatherByLocation(units);
});

// Function to fetch a list of cities
function fetchCities(query) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${API_KEY}`;

    return fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const cities = data.list.map((city) => city.name);
            return cities;
        })
        .catch((error) => {
            console.log("Error fetching cities:", error);
            return [];
        });
}

$(document).ready(function () {
  $("#city-input").autocomplete({
    source: function (request, response) {
      fetchCities(request.term)
        .then((cities) => response(cities))
        .catch((error) => console.log("Error:", error));
    },
    minLength: 3, // Minimum number of characters to start searching
    delay: 300, // Delay in milliseconds before triggering the search
  });
});

// Autocomplete functionality
$(function() {
    $.getJSON("city.list.json", function(cityList) {
        $("#city-input")
            .autocomplete({
                source: function(request, response) {
                    if (request.term.length < 3) {
                        return;
                    }
                    const matcher = new RegExp(
                        $.ui.autocomplete.escapeRegex(request.term),
                        "i"
                    );
                    response(
                        $.grep(cityList, function(city) {
                            return matcher.test(city.name);
                        })
                    );
                },
                select: function(event, ui) {
                    $("#city-input").val(ui.item.name);
                    fetchWeatherData(ui.item.name, getSelectedUnit());
                    return false;
                },
            })
            .autocomplete("instance")._renderItem = function(ul, item) {
                return $("<li>")
                    .append("<div>" + item.name + ", " + item.country + "</div>")
                    .appendTo(ul);
            };
    });
});

// Helper function to get the selected unit
function getSelectedUnit() {
    const selectedUnit = document.querySelector('input[name="units"]:checked');
    return selectedUnit ? selectedUnit.value : "metric";
}


// Fetch air quality data from API
function fetchAirQualityData(lat, lon) {
    const apiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            displayAirQualityData(data);
        })
        .catch((error) => {
            console.log("Error:", error);
            alert("Failed to fetch air quality data. Please try again.");
        });
}

// Display air quality data
function displayAirQualityData(data) {
    const airQuality = data.list[0];
    const aqi = airQuality.main.aqi;

    const aqiName = getAQIName(aqi);
    document.getElementById("aqi-name").textContent = aqiName;

    // Position the indicator
    const indicator = document.getElementById("aqi-indicator");
    const position = ((aqi - 1) / 4) * 100; // AQI ranges from 1 to 5
    indicator.style.left = `${position}%`;
}

// Get AQI qualitative name
function getAQIName(aqi) {
    switch (aqi) {
        case 1: return "Good";
        case 2: return "Fair";
        case 3: return "Moderate";
        case 4: return "Poor";
        case 5: return "Very Poor";
        default: return "Unknown";
    }
}

// Get AQI qualitative name
function getAQIName(aqi) {
    switch (aqi) {
        case 1: return "Good";
        case 2: return "Fair";
        case 3: return "Moderate";
        case 4: return "Poor";
        case 5: return "Very Poor";
        default: return "Unknown";
    }
}

// Function to display rain forecast
function displayRainForecast(forecastList) {
  const nextRain = getNextRainForecast(forecastList);
  const nextRainTimeElement = document.getElementById("next-rain-time");
  const rainIntensityElement = document.getElementById("rain-intensity");

  if (nextRain) {
    const rainTime = new Date(nextRain.dt * 1000);
    const formattedRainTime = formatNextRainTime(rainTime);
    nextRainTimeElement.textContent = formattedRainTime;
    rainIntensityElement.textContent = `${getRainIntensity(
      nextRain.rain["3h"]
    )}`;
  } else {
    nextRainTimeElement.textContent = "No rain expected";
    rainIntensityElement.textContent = "in the next 5 days";
  }
}

// Helper function to get the next rain forecast
function getNextRainForecast(forecastList) {
  const now = new Date();
  return forecastList.find((forecast) => {
    const forecastTime = new Date(forecast.dt * 1000);
    return forecastTime > now && forecast.rain && forecast.rain["3h"] > 0;
  });
}
// Helper function to get time until rain
function getTimeUntilRain(rainTime) {
    const now = new Date();
    const diffMs = rainTime - now;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.round((diffMs % 3600000) / 60000);

    if (diffHrs > 0) {
        return `${diffHrs}h ${diffMins}m`;
    } else {
        return `${diffMins}m`;
    }
}

// Helper function to determine rain intensity
function getRainIntensity(rainAmount) {
    if (rainAmount < 2.5) {
        return "Light rain";
    } else if (rainAmount < 7.6) {
        return "Moderate rain";
    } else {
        return "Heavy rain";
    }
}

// Helper function to format the next rain time
function formatNextRainTime(rainTime) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    if (rainTime < tomorrow) {
        // Rain is today
        const hours = rainTime.getHours().toString().padStart(2, '0');
        const minutes = rainTime.getMinutes().toString().padStart(2, '0');
        return `Rain at ${hours}:${minutes}`;
    } else if (rainTime < dayAfterTomorrow) {
        // Rain is tomorrow
        const hours = rainTime.getHours();
        return `Rain tomorrow around ${hours}:00`;
    } else {
        // Rain is after tomorrow
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = daysOfWeek[rainTime.getDay()];
        return `Next rain on ${dayName}`;
    }
}