import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type"); // 'current' or 'forecast'

  // Validate parameters
  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get location details using reverse geocoding
    const locationDetails = await getLocationDetails(lat, lng);

    if (type === "forecast") {
      // Handle forecast request with Open-Meteo
      return await handleForecastRequest(lat, lng, locationDetails);
    } else {
      // Handle current weather request with Open-Meteo
      return await handleCurrentWeatherRequest(lat, lng, locationDetails);
    }
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch weather data",
      data:
        type === "forecast"
          ? getFallbackForecastData()
          : getFallbackWeatherData(),
    });
  }
}

// Handle current weather request with Open-Meteo
async function handleCurrentWeatherRequest(
  lat: string,
  lng: string,
  locationDetails: { barangay: string; city: string }
) {
  try {
    const currentResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );

    if (!currentResponse.ok) {
      throw new Error(`HTTP error! status: ${currentResponse.status}`);
    }

    const weatherData = await currentResponse.json();

    // Transform Open-Meteo data to your format
    const transformedData = {
      condition: mapWMOCodeToCondition(weatherData.current.weather_code),
      temperature: Math.round(weatherData.current.temperature_2m),
      description: getWeatherDescription(weatherData.current.weather_code),
      city: locationDetails.city,
      barangay: locationDetails.barangay,
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      high: Math.round(weatherData.daily.temperature_2m_max[0]),
      low: Math.round(weatherData.daily.temperature_2m_min[0]),
      icon: getWeatherIcon(weatherData.current.weather_code, true),
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Open-Meteo Current Weather API error:", error);
    // Return fallback data with location details
    return NextResponse.json({
      success: false,
      error: "Weather service temporarily unavailable",
      data: {
        ...getFallbackWeatherData(),
        barangay: locationDetails.barangay,
        city: locationDetails.city,
      },
    });
  }
}

// Handle forecast request with Open-Meteo
async function handleForecastRequest(
  lat: string,
  lng: string,
  locationDetails: { barangay: string; city: string }
) {
  try {
    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max&timezone=auto&forecast_days=6`
    );

    if (!forecastResponse.ok) {
      throw new Error(`HTTP error! status: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Get today's date to filter out today from forecast
    const today = new Date().toISOString().split("T")[0];

    // Transform the forecast data to match your existing format
    // Start from index 1 to skip today and get next 5 days
    const transformedData = {
      city: locationDetails.city,
      barangay: locationDetails.barangay,
      list: forecastData.daily.time
        .map((time: string, index: number) => ({
          dt: Math.floor(new Date(time).getTime() / 1000),
          dt_txt: time + " 12:00:00",
          main: {
            temp: Math.round(
              (forecastData.daily.temperature_2m_max[index] +
                forecastData.daily.temperature_2m_min[index]) /
                2
            ),
            temp_min: Math.round(forecastData.daily.temperature_2m_min[index]),
            temp_max: Math.round(forecastData.daily.temperature_2m_max[index]),
            humidity: forecastData.daily.relative_humidity_2m_mean[index],
          },
          weather: [
            {
              main: mapWMOCodeToCondition(
                forecastData.daily.weather_code[index]
              ),
              description: getWeatherDescription(
                forecastData.daily.weather_code[index]
              ),
              icon: getWeatherIcon(
                forecastData.daily.weather_code[index],
                true
              ),
            },
          ],
          wind: {
            speed: forecastData.daily.wind_speed_10m_max[index],
          },
        }))
        // Filter out today and take next 5 days
        .filter((item: any, index: number) => {
          const itemDate = forecastData.daily.time[index];
          return itemDate !== today; // Exclude today
        })
        .slice(0, 5), // Take exactly 5 days starting from tomorrow
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Open-Meteo Forecast API error:", error);
    // Return fallback forecast data with location details
    return NextResponse.json({
      success: false,
      error: "Forecast service temporarily unavailable",
      data: {
        ...getFallbackForecastData(),
        barangay: locationDetails.barangay,
        city: locationDetails.city,
      },
    });
  }
}

// Map Open-Meteo WMO Weather Codes to your app's conditions
function mapWMOCodeToCondition(
  code: number
): "sunny" | "rainy" | "cloudy" | "snowy" | "foggy" {
  // Clear or mainly clear
  if (code === 0 || code === 1) return "sunny";
  // Partly cloudy
  if (code === 2) return "cloudy";
  // Overcast
  if (code === 3) return "cloudy";
  // Fog
  if (code === 45 || code === 48) return "foggy";
  // Rain
  if (code >= 51 && code <= 67) return "rainy";
  // Snow
  if (code >= 71 && code <= 77) return "snowy";
  // Rain showers
  if (code >= 80 && code <= 82) return "rainy";
  // Snow showers
  if (code >= 85 && code <= 86) return "snowy";
  // Thunderstorm
  if (code >= 95 && code <= 99) return "rainy";

  return "cloudy"; // Default fallback
}

// Get detailed weather description from WMO code
function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return descriptions[code] || "Unknown weather condition";
}

// Get weather icon from WMO code
function getWeatherIcon(code: number, isDay: boolean): string {
  const iconMap: { [key: number]: { day: string; night: string } } = {
    0: { day: "01d", night: "01n" }, // Clear sky
    1: { day: "01d", night: "01n" }, // Mainly clear
    2: { day: "02d", night: "02n" }, // Partly cloudy
    3: { day: "04d", night: "04n" }, // Overcast
    45: { day: "50d", night: "50n" }, // Fog
    48: { day: "50d", night: "50n" }, // Depositing rime fog
    51: { day: "09d", night: "09n" }, // Light drizzle
    53: { day: "09d", night: "09n" }, // Moderate drizzle
    55: { day: "09d", night: "09n" }, // Dense drizzle
    61: { day: "10d", night: "10n" }, // Slight rain
    63: { day: "10d", night: "10n" }, // Moderate rain
    65: { day: "10d", night: "10n" }, // Heavy rain
    71: { day: "13d", night: "13n" }, // Slight snow fall
    73: { day: "13d", night: "13n" }, // Moderate snow fall
    75: { day: "13d", night: "13n" }, // Heavy snow fall
    80: { day: "09d", night: "09n" }, // Slight rain showers
    81: { day: "09d", night: "09n" }, // Moderate rain showers
    82: { day: "09d", night: "09n" }, // Violent rain showers
    85: { day: "13d", night: "13n" }, // Slight snow showers
    86: { day: "13d", night: "13n" }, // Heavy snow showers
    95: { day: "11d", night: "11n" }, // Thunderstorm
    96: { day: "11d", night: "11n" }, // Thunderstorm with slight hail
    99: { day: "11d", night: "11n" }, // Thunderstorm with heavy hail
  };

  const icons = iconMap[code] || { day: "03d", night: "03n" };
  return isDay ? icons.day : icons.night;
}

// KEEP ALL YOUR EXISTING FUNCTIONS BELOW - THEY REMAIN UNCHANGED
// Function to get location details with barangay information
async function getLocationDetails(
  lat: string,
  lng: string
): Promise<{ barangay: string; city: string }> {
  try {
    // Use OpenStreetMap Nominatim (free)
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    if (nominatimResponse.ok) {
      const locationData = await nominatimResponse.json();
      const address = locationData.address;

      // Extract barangay and city from OpenStreetMap data
      const barangay =
        address.suburb ||
        address.village ||
        address.neighbourhood ||
        "Unknown Barangay";
      const city =
        address.city || address.town || address.municipality || "Unknown City";

      return { barangay, city };
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
  }

  // Fallback if reverse geocoding fails
  return {
    barangay: "Unknown Barangay",
    city: "Manila",
  };
}

// Fallback data in case current weather API fails
function getFallbackWeatherData() {
  return {
    condition: "sunny" as const,
    temperature: 28,
    description: "Clear sky",
    city: "Manila",
    barangay: "Ermita",
    humidity: 65,
    windSpeed: 3.2,
    feelsLike: 30,
    high: 32,
    low: 25,
    icon: "01d",
  };
}

// Fallback data in case forecast API fails
function getFallbackForecastData() {
  const forecastList = [];
  const today = new Date();

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    forecastList.push({
      dt: Math.floor(date.getTime() / 1000),
      dt_txt: date.toISOString().split("T")[0] + " 12:00:00",
      main: {
        temp: 25 + Math.floor(Math.random() * 6),
        temp_min: 22 + Math.floor(Math.random() * 4),
        temp_max: 28 + Math.floor(Math.random() * 4),
        humidity: 60 + Math.floor(Math.random() * 20),
      },
      weather: [
        {
          main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
          description: "Partly cloudy",
          icon: "02d",
        },
      ],
      wind: {
        speed: 2 + Math.random() * 3,
      },
    });
  }

  return {
    city: "Manila",
    barangay: "Ermita",
    list: forecastList,
  };
}
