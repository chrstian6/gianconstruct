"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Calendar,
  Home,
  Phone,
  Video,
  MapPin,
  Umbrella,
  Sun,
  CloudRain,
  Tag,
  Percent,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Home as HomeIcon,
  RefreshCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import { format, parseISO, isToday, addDays } from "date-fns";
import { getUserInquiries } from "@/action/inquiries";
import { Inquiry } from "@/types/inquiry";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

interface WeatherData {
  condition: "sunny" | "rainy" | "cloudy" | "snowy" | "foggy";
  temperature: number;
  description: string;
  city: string;
  barangay?: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  high?: number;
  low?: number;
}

interface ForecastDay {
  date: string;
  condition: string;
  high: number;
  low: number;
  description?: string;
}

// Cache interfaces
interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

interface ForecastCache {
  data: ForecastDay[];
  timestamp: number;
}

interface CacheData {
  current: WeatherCache | null;
  forecast: ForecastCache | null;
  location: {
    lat: number;
    lng: number;
  } | null;
}

// Open-Meteo Weather Code Mapping
const WMO_WEATHER_CODES: {
  [key: number]: {
    condition: "sunny" | "rainy" | "cloudy" | "snowy" | "foggy";
    description: string;
  };
} = {
  0: { condition: "sunny", description: "Clear sky" },
  1: { condition: "sunny", description: "Mainly clear" },
  2: { condition: "cloudy", description: "Partly cloudy" },
  3: { condition: "cloudy", description: "Overcast" },
  45: { condition: "foggy", description: "Fog" },
  48: { condition: "foggy", description: "Depositing rime fog" },
  51: { condition: "rainy", description: "Light drizzle" },
  53: { condition: "rainy", description: "Moderate drizzle" },
  55: { condition: "rainy", description: "Dense drizzle" },
  61: { condition: "rainy", description: "Slight rain" },
  63: { condition: "rainy", description: "Moderate rain" },
  65: { condition: "rainy", description: "Heavy rain" },
  71: { condition: "snowy", description: "Slight snow fall" },
  73: { condition: "snowy", description: "Moderate snow fall" },
  75: { condition: "snowy", description: "Heavy snow fall" },
  80: { condition: "rainy", description: "Slight rain showers" },
  81: { condition: "rainy", description: "Moderate rain showers" },
  82: { condition: "rainy", description: "Violent rain showers" },
  95: { condition: "rainy", description: "Thunderstorm" },
  96: { condition: "rainy", description: "Thunderstorm with slight hail" },
  99: { condition: "rainy", description: "Thunderstorm with heavy hail" },
};

// Cache duration - 10 minutes in milliseconds
const CACHE_DURATION = 10 * 60 * 1000;
const CACHE_KEY = "weather-dashboard-cache";

export default function UserDashboard() {
  const router = useRouter();
  const { clearUser, user } = useAuthStore();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData>({
    condition: "sunny",
    temperature: 28,
    description: "Clear sky",
    city: "Loading...",
    barangay: "Loading...",
  });
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const plugin = Autoplay({
    delay: 3000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  // Cache management functions
  const getCache = useCallback((): CacheData | null => {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }, []);

  const setCache = useCallback(
    (cacheData: Partial<CacheData>) => {
      if (typeof window === "undefined") return;

      try {
        const existingCache = getCache();
        const newCache = {
          ...existingCache,
          ...cacheData,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      } catch (error) {
        console.error("Error setting cache:", error);
      }
    },
    [getCache]
  );

  const clearCache = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  const isCacheValid = useCallback(
    (
      cache: WeatherCache | ForecastCache | null,
      location: { lat: number; lng: number } | null
    ): boolean => {
      if (!cache || !location || !currentLocation) return false;

      // Check if cache is for current location
      if (
        location.lat !== currentLocation.lat ||
        location.lng !== currentLocation.lng
      ) {
        return false;
      }

      // Check if cache is not expired
      return Date.now() - cache.timestamp < CACHE_DURATION;
    },
    [currentLocation]
  );

  // Action-oriented banner data with background images
  const banners = useMemo(
    () => [
      {
        id: 1,
        title: "Limited Time Sale!",
        description:
          "Get up to 40% off on premium home designs. Limited spots available!",
        bgColor: "bg-sidebar border",
        cta: "Shop Now",
        badge: "HOT DEAL",
        image: "/images/banner/banner-1.jpg",
        imageAlt: "Limited Time Sale on Home Designs",
        overlay: "bg-black/40",
      },
      {
        id: 2,
        title: "Home Loan Special",
        description:
          "0% down payment available. Low interest rates for qualified buyers.",
        bgColor: "bg-sidebar border",
        cta: "Apply Now",
        badge: "FINANCING",
        image: "/images/banner/banner-2.jpg",
        imageAlt: "Home Loan Special Offer",
        overlay: "bg-black/40",
      },
      {
        id: 3,
        title: "Explore Our Catalog",
        description:
          "Browse 500+ modern designs. Virtual tours available for all properties.",
        bgColor: "bg-sidebar border",
        icon: TrendingUp,
        cta: "Explore Designs",
        badge: "TRENDING",
        image: "/images/banner/banner-3.jpg",
        imageAlt: "Modern Home Designs Catalog",
        overlay: "bg-black/40",
      },
    ],
    []
  );

  useEffect(() => {
    fetchUserInquiries();
    getWeatherData();
  }, []);

  const getWeatherData = useCallback(async () => {
    setWeatherLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 60 * 60 * 1000,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });

      // Check cache first
      const cache = getCache();
      if (
        cache &&
        isCacheValid(cache.current, cache.location) &&
        isCacheValid(cache.forecast, cache.location)
      ) {
        console.log("Using cached weather data");
        setWeather(cache.current!.data);
        setForecast(cache.forecast!.data);
        setWeatherLoading(false);
        return;
      }

      // Fetch current weather and forecast in parallel
      await Promise.all([
        getCurrentWeather(latitude, longitude),
        getForecastData(latitude, longitude),
      ]);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeather({
        condition: "cloudy",
        temperature: 22,
        description: "Cloudy",
        city: "Manila",
        barangay: "Ermita",
        feelsLike: 24,
      });
      generateFallbackForecast();
    } finally {
      setWeatherLoading(false);
    }
  }, [getCache, isCacheValid]);

  const getCurrentWeather = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

        if (response.ok) {
          const result = await response.json();
          console.log("Current weather response:", result);

          if (result.success && result.data) {
            setWeather(result.data);

            // Cache the current weather data
            setCache({
              current: {
                data: result.data,
                timestamp: Date.now(),
              },
              location: { lat, lng },
            });
          }
        } else {
          console.error("Current weather API error:", response.status);
        }
      } catch (error) {
        console.error("Error fetching current weather:", error);
      }
    },
    [setCache]
  );

  const getForecastData = useCallback(
    async (lat: number, lng: number) => {
      try {
        const forecastResponse = await fetch(
          `/api/weather?lat=${lat}&lng=${lng}&type=forecast`
        );

        if (forecastResponse.ok) {
          const forecastResult = await forecastResponse.json();
          console.log("Forecast API response:", forecastResult);

          if (forecastResult.success && forecastResult.data) {
            const dailyForecasts = processForecastData(forecastResult.data);
            console.log("Processed forecast data:", dailyForecasts);
            setForecast(dailyForecasts);

            // Cache the forecast data
            setCache({
              forecast: {
                data: dailyForecasts,
                timestamp: Date.now(),
              },
              location: { lat, lng },
            });
          } else {
            console.error(
              "Forecast API returned unsuccessful:",
              forecastResult
            );
            generateFallbackForecast();
          }
        } else {
          console.error("Forecast API HTTP error:", forecastResponse.status);
          generateFallbackForecast();
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
        generateFallbackForecast();
      }
    },
    [setCache]
  );

  // Enhanced function to handle both Open-Meteo and OpenWeatherMap data structures
  const processForecastData = useCallback((data: any): ForecastDay[] => {
    console.log("Processing forecast data structure:", data);

    // Handle Open-Meteo structure (daily object with arrays)
    if (data.daily && data.daily.time && Array.isArray(data.daily.time)) {
      console.log("Detected Open-Meteo data structure");
      return processOpenMeteoData(data);
    }

    // Handle OpenWeatherMap structure (list array with 3-hour intervals)
    if (data.list && Array.isArray(data.list)) {
      console.log("Detected OpenWeatherMap data structure");
      return processOpenWeatherMapData(data);
    }

    // Handle transformed Open-Meteo structure from your API
    if (
      Array.isArray(data) ||
      (data.list && Array.isArray(data.list) && data.list[0]?.main)
    ) {
      console.log("Detected transformed API structure");
      return processTransformedData(data);
    }

    console.error("Unknown forecast data structure:", data);
    return generateFallbackForecastData();
  }, []);

  // Fixed Open-Meteo data processing - always returns next 5 days starting from tomorrow
  const processOpenMeteoData = useCallback((data: any): ForecastDay[] => {
    const forecasts: ForecastDay[] = [];
    const today = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD

    try {
      // Find today's index in the forecast data
      const todayIndex = data.daily.time.findIndex(
        (date: string) => date === today
      );

      if (todayIndex === -1) {
        console.warn("Today's date not found in forecast data, using fallback");
        return generateFallbackForecastData();
      }

      console.log(`Today index: ${todayIndex}, Today: ${today}`);

      // Get exactly the next 5 days starting from tomorrow (todayIndex + 1 to todayIndex + 5)
      for (let i = 1; i <= 5; i++) {
        const forecastIndex = todayIndex + i;

        if (forecastIndex < data.daily.time.length) {
          const date = data.daily.time[forecastIndex];
          const weatherCode = data.daily.weather_code?.[forecastIndex] || 3;
          const weatherInfo = WMO_WEATHER_CODES[weatherCode] || {
            condition: "cloudy" as const,
            description: "Unknown",
          };

          const high = data.daily.temperature_2m_max?.[forecastIndex] || 25;
          const low = data.daily.temperature_2m_min?.[forecastIndex] || 18;

          forecasts.push({
            date,
            condition: weatherInfo.condition,
            high: Math.round(high),
            low: Math.round(low),
            description: weatherInfo.description,
          });

          console.log(
            `Added forecast for date: ${date}, index: ${forecastIndex}`
          );
        } else {
          console.warn(`Not enough forecast data for day ${i}, using fallback`);
          break;
        }
      }
    } catch (error) {
      console.error("Error processing Open-Meteo data:", error);
    }

    // If we don't have exactly 5 days, use fallback for all days to ensure consistency
    if (forecasts.length !== 5) {
      console.warn(
        `Expected 5 forecast days but got ${forecasts.length}, using fallback`
      );
      return generateFallbackForecastData();
    }

    console.log(
      "Final forecast dates:",
      forecasts.map((f) => f.date)
    );
    return forecasts;
  }, []);

  // Fixed OpenWeatherMap data processing
  const processOpenWeatherMapData = useCallback((data: any): ForecastDay[] => {
    const dailyData: { [key: string]: any[] } = {};
    const forecasts: ForecastDay[] = [];
    const today = new Date().toISOString().split("T")[0];

    try {
      // Group by date
      data.list.forEach((item: any) => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyData[date]) dailyData[date] = [];
        dailyData[date].push(item);
      });

      // Get exactly the next 5 days starting from tomorrow
      const nextFiveDays = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // +1 to start from tomorrow
        return date.toISOString().split("T")[0];
      });

      console.log("Next 5 days required:", nextFiveDays);

      // Create forecasts for each of the next 5 days
      nextFiveDays.forEach((date) => {
        const dayData = dailyData[date];
        if (dayData && dayData.length > 0) {
          const temps = dayData.map((item: any) => item.main.temp);
          const high = Math.round(Math.max(...temps));
          const low = Math.round(Math.min(...temps));
          const mainCondition = dayData[0].weather[0].main;

          forecasts.push({
            date,
            condition: mapWeatherCondition(mainCondition),
            high,
            low,
          });
        } else {
          // If no data for any date, use fallback for all to maintain consistency
          console.warn(
            `No data for required date ${date}, using fallback for all days`
          );
          return generateFallbackForecastData();
        }
      });
    } catch (error) {
      console.error("Error processing OpenWeatherMap data:", error);
    }

    // Ensure we have exactly 5 days
    if (forecasts.length !== 5) {
      return generateFallbackForecastData();
    }

    return forecasts;
  }, []);

  // Fixed transformed data processing
  const processTransformedData = useCallback((data: any): ForecastDay[] => {
    const forecasts: ForecastDay[] = [];
    const today = new Date().toISOString().split("T")[0];

    try {
      const list = Array.isArray(data) ? data : data.list;

      // Get exactly the next 5 days starting from tomorrow
      const nextFiveDays = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // +1 to start from tomorrow
        return date.toISOString().split("T")[0];
      });

      // Create a map of available forecast data by date
      const forecastByDate: { [key: string]: any } = {};
      list.forEach((item: any) => {
        const date =
          item.dt_txt?.split(" ")[0] ||
          new Date(item.dt * 1000).toISOString().split("T")[0];
        forecastByDate[date] = item;
      });

      // Create forecasts for each of the next 5 days
      for (const date of nextFiveDays) {
        const item = forecastByDate[date];
        if (item) {
          forecasts.push({
            date,
            condition: item.weather?.[0]?.main?.toLowerCase() || "cloudy",
            high: Math.round(item.main?.temp_max || 25),
            low: Math.round(item.main?.temp_min || 18),
          });
        } else {
          // If any date is missing, use fallback for all to maintain consistency
          console.warn(
            `Missing data for required date ${date}, using fallback`
          );
          return generateFallbackForecastData();
        }
      }
    } catch (error) {
      console.error("Error processing transformed data:", error);
    }

    // Ensure we have exactly 5 days
    if (forecasts.length !== 5) {
      return generateFallbackForecastData();
    }

    return forecasts;
  }, []);

  const mapWeatherCondition = useCallback((condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("clear")) return "sunny";
    if (
      lowerCondition.includes("rain") ||
      lowerCondition.includes("drizzle") ||
      lowerCondition.includes("thunderstorm")
    )
      return "rainy";
    if (lowerCondition.includes("snow")) return "snowy";
    if (lowerCondition.includes("fog") || lowerCondition.includes("mist"))
      return "foggy";
    if (lowerCondition.includes("cloud")) return "cloudy";
    return "partly cloudy";
  }, []);

  const generateFallbackForecast = useCallback(() => {
    console.log("Generating fallback forecast data");
    const forecastData = generateFallbackForecastData();
    setForecast(forecastData);
  }, []);

  // Fixed fallback forecast generation - always generates next 5 days from tomorrow
  const generateFallbackForecastData = useCallback((): ForecastDay[] => {
    const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
    const forecastData: ForecastDay[] = [];

    // Always generate exactly 5 days starting from tomorrow
    for (let i = 1; i <= 6; i++) {
      const date = addDays(new Date(), i); // Use date-fns for proper date handling
      const randomCondition =
        conditions[Math.floor(Math.random() * conditions.length)];

      forecastData.push({
        date: date.toISOString().split("T")[0],
        condition: randomCondition,
        high: 25 + Math.floor(Math.random() * 6),
        low: 18 + Math.floor(Math.random() * 4),
      });
    }

    console.log(
      "Generated fallback forecast dates:",
      forecastData.map((f) => f.date)
    );
    return forecastData;
  }, []);

  const getTemperatureColor = useCallback((temp: number) => {
    if (temp >= 30) return "text-orange-500";
    if (temp <= 15) return "text-blue-500";
    return "text-gray-900";
  }, []);

  const getTemperatureFeeling = useCallback((temp: number) => {
    if (temp >= 30) return "Hot";
    if (temp >= 25) return "Warm";
    if (temp >= 20) return "Pleasant";
    if (temp >= 15) return "Cool";
    return "Cold";
  }, []);

  const getWeatherAdvice = useCallback(
    (condition: string, temperature: number) => {
      if (condition === "rainy") {
        return { message: "Don't forget your umbrella!" };
      }
      if (temperature >= 30) {
        return { message: "Stay hydrated!" };
      }
      if (condition === "sunny") {
        return { message: "Perfect day to go outside!" };
      }
      if (condition === "cloudy") {
        return {
          message: "Great day for indoor activities!",
        };
      }
      return { message: "Have a wonderful day!" };
    },
    []
  );

  const capitalizeFirst = useCallback((str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const getMeetingTypeIcon = useCallback((type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4 text-black" />;
      case "video":
        return <Video className="h-4 w-4 text-black" />;
      case "onsite":
        return <MapPin className="h-4 w-4 text-black" />;
      default:
        return <Phone className="h-4 w-4 text-black" />;
    }
  }, []);

  const fetchUserInquiries = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getUserInquiries(user.email);
      if (result.success && result.inquiries) {
        setInquiries([...result.inquiries]);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const handleLogout = useCallback(async () => {
    try {
      await clearUser();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [clearUser, router]);

  const getTodaysAppointments = useCallback(() => {
    return inquiries.filter((inquiry) => {
      try {
        const appointmentDate = parseISO(inquiry.preferredDate);
        return (
          isToday(appointmentDate) &&
          (inquiry.status === "confirmed" || inquiry.status === "rescheduled")
        );
      } catch (error) {
        console.error("Error parsing appointment date:", error);
        return false;
      }
    });
  }, [inquiries]);

  const todaysAppointments = getTodaysAppointments();
  const hasAppointmentsToday = todaysAppointments.length > 0;

  // Memoized current date display
  const currentDateDisplay = useMemo(
    () => format(new Date(), "EEEE, MMMM d"),
    []
  );

  // Memoized appointments status display
  const appointmentsStatusDisplay = useMemo(() => {
    if (hasAppointmentsToday) {
      return {
        text: `${todaysAppointments.length} Appointment${todaysAppointments.length > 1 ? "s" : ""}`,
        color: "text-green-600",
        icon: <Calendar className="h-5 w-5 text-green-600" />,
        description: "You have meetings scheduled today",
      };
    } else {
      return {
        text: "No Appointments",
        color: "text-gray-600",
        icon: <Calendar className="h-5 w-5 text-gray-400" />,
        description: "You're all caught up!",
      };
    }
  }, [hasAppointmentsToday, todaysAppointments.length]);

  const weatherAdvice = useMemo(
    () => getWeatherAdvice(weather.condition, weather.temperature),
    [weather.condition, weather.temperature, getWeatherAdvice]
  );

  // Memoized weather card components
  const WeatherCardContent = useCallback(() => {
    return (
      <CardContent className="p-6">
        {/* Weather Header with Refresh Icon */}
        <div className="flex justify-between items-start mb-4">
          {/* Location at the top */}
          <div>
            {weatherLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-5 w-32"></div>
            ) : (
              <p className="text-2xl font-semibold text-gray-900 tracking-tight">
                You're in {weather.barangay}, {weather.city}
              </p>
            )}
          </div>

          {/* Refresh Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={getWeatherData}
            disabled={weatherLoading}
            className="h-8 w-8"
          >
            <RefreshCcw
              className={`h-4 w-4 ${weatherLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Single Row - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Today's Weather */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Today is</p>
            {weatherLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-7 w-24"></div>
            ) : (
              <h2 className="text-3xl font-bold text-orange-500 tracking-tight">
                {capitalizeFirst(weather.condition)}
              </h2>
            )}

            <div className="space-y-1">
              {weatherLoading ? (
                <>
                  <div className="animate-pulse bg-gray-200 rounded h-8 w-16"></div>
                  <div className="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
                </>
              ) : (
                <>
                  <div
                    className={`text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}
                  >
                    {weather.temperature}°C
                  </div>
                  <p className="text-xs text-gray-600">
                    Feels like{" "}
                    {getTemperatureFeeling(
                      weather.feelsLike || weather.temperature
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Center Column - 5 Day Forecast */}
          <ForecastCards />
        </div>
      </CardContent>
    );
  }, [
    weather,
    weatherLoading,
    getWeatherData,
    getTemperatureColor,
    getTemperatureFeeling,
    capitalizeFirst,
  ]);

  const ForecastCards = useCallback(() => {
    return (
      <div className="md:col-span-2">
        <p className="text-sm font-medium text-gray-600 mb-2 tracking-[1.2]">
          5-Day Forecast
        </p>
        <div className="grid grid-cols-5 gap-2">
          {weatherLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="text-center">
                  <div className="animate-pulse bg-gray-200 rounded h-4 w-8 mx-auto mb-1"></div>
                  <div className="animate-pulse bg-gray-200 rounded h-3 w-6 mx-auto mb-1"></div>
                  <div className="animate-pulse bg-gray-200 rounded h-4 w-10 mx-auto"></div>
                </div>
              ))
            : forecast
                .slice(0, 5)
                .map((day, index) => <ForecastDayCard key={index} day={day} />)}
        </div>
      </div>
    );
  }, [forecast, weatherLoading]);

  const ForecastDayCard = useCallback(({ day }: { day: ForecastDay }) => {
    return (
      <div className="text-center py-4 border border-none shadow-md rounded-sm">
        <p className="text-md font-medium tracking-[1.1] text-gray-600 mb-1">
          {format(new Date(day.date), "EEE")}
        </p>
        <p className="text-xl text-orange-500 font-bold mb-1 tracking-[1.1]">
          {format(new Date(day.date), "d")}
        </p>
        <p className="text-xs font-medium text-gray-600 capitalize">
          {day.condition}
        </p>
      </div>
    );
  }, []);

  const CalendarCardContent = useCallback(() => {
    return (
      <CardContent className="p-4">
        <div className="text-center">
          {/* Current Date */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Today</p>
            {weatherLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-6 w-32 mx-auto"></div>
            ) : (
              <p className="text-lg font-bold text-gray-900">
                {currentDateDisplay}
              </p>
            )}
          </div>

          {/* Appointments Status */}
          <div className="mb-4">
            {weatherLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-6 w-24 mx-auto mb-2"></div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {appointmentsStatusDisplay.icon}
                  <p
                    className={`text-base font-semibold ${appointmentsStatusDisplay.color}`}
                  >
                    {appointmentsStatusDisplay.text}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  {appointmentsStatusDisplay.description}
                </p>
              </div>
            )}
          </div>

          {/* Weather Advice */}
          <div className="pt-4 border-t border-gray-200">
            {weatherLoading ? (
              <div className="animate-pulse bg-gray-200 rounded h-4 w-32 mx-auto"></div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-md tracking-tight font-bold text-gray-700">
                  {weatherAdvice.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    );
  }, [
    weatherLoading,
    currentDateDisplay,
    appointmentsStatusDisplay,
    weatherAdvice.message,
  ]);

  // Don't clear cache when component unmounts - cache persists
  useEffect(() => {
    return () => {
      // Cache persists between component mounts/unmounts
      // No cleanup needed - cache remains in localStorage
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-10 py-6">
        {/* Banner Carousel */}
        <section className="mb-6">
          <Carousel
            className="w-full"
            plugins={[plugin]}
            opts={{
              loop: true,
              align: "start",
            }}
            onMouseEnter={plugin.stop}
            onMouseLeave={plugin.reset}
          >
            <CarouselContent>
              {banners.map((banner) => {
                const BannerIcon = banner.icon;
                return (
                  <CarouselItem key={banner.id}>
                    <div className="relative h-64 rounded-sm shadow-sm overflow-hidden">
                      {/* Background Image */}
                      <Image
                        src={banner.image}
                        alt={banner.imageAlt}
                        fill
                        className="object-cover"
                        priority={banner.id === 1}
                      />

                      {/* Overlay for better text readability */}
                      <div
                        className={`absolute inset-0 ${banner.overlay}`}
                      ></div>

                      {/* Content */}
                      <div className="relative z-10 h-full flex items-center p-6">
                        <div className="max-w-2xl">
                          {/* Badge */}
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
                            {banner.badge}
                          </div>

                          <h2 className="text-4xl tracking-tight text-white font-bold mb-3">
                            {banner.title}
                          </h2>
                          <p className="text-white/90 tracking-[1.1] text-base mb-4">
                            {banner.description}
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-orange-500 hover:bg-gray-100 text-base px-10 py-5 font-medium"
                          >
                            {banner.cta}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Three Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weather Card */}
          <Card className="bg-white lg:col-span-2 rounded-sm border-none shadow-md">
            <WeatherCardContent />
          </Card>

          {/* Calendar Card */}
          <Card className="bg-white rounded-sm border-none shadow-md">
            <CalendarCardContent />
          </Card>
        </section>

        {/* Appointments Section */}
        <section className="mb-6">
          <Card className="bg-white border-black">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-black" />
                    Today's Appointments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasAppointmentsToday
                      ? `${todaysAppointments.length} appointment${todaysAppointments.length > 1 ? "s" : ""} scheduled`
                      : "No appointments today"}
                  </p>
                </div>
                {hasAppointmentsToday && (
                  <div className="text-sm font-semibold text-blue-600">
                    {todaysAppointments.length}
                  </div>
                )}
              </div>

              {hasAppointmentsToday ? (
                <div className="space-y-3">
                  {todaysAppointments.map((appointment) => (
                    <Card key={appointment._id} className="border border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {appointment.design.name}
                              </h3>
                              <div
                                className={`text-xs px-2 py-1 rounded ${
                                  appointment.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {appointment.status}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-black" />
                                <span className="font-medium text-gray-700">
                                  {format(
                                    parseISO(appointment.preferredDate),
                                    "MMM d"
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-black rounded-full"></div>
                                </div>
                                <span className="font-medium text-gray-700">
                                  {appointment.preferredTime}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {getMeetingTypeIcon(appointment.meetingType)}
                                <span className="font-medium text-gray-700 capitalize">
                                  {appointment.meetingType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">
                    No Appointments Today
                  </h3>
                  <p className="text-sm text-gray-500">
                    Enjoy your day! You're all caught up.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-black">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-5 w-5 text-black" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                My Appointments
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                View and manage scheduled meetings
              </p>
              <Button
                variant="outline"
                className="w-full text-sm py-2 border-black"
              >
                View Appointments
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-black">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Home className="h-5 w-5 text-black" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Design Gallery
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Explore home designs and inspirations
              </p>
              <Button
                variant="outline"
                className="w-full text-sm py-2 border-black"
              >
                Browse Designs
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-black">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="h-5 w-5 bg-black rounded-full"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Project Status
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Track ongoing design projects
              </p>
              <Button
                variant="outline"
                className="w-full text-sm py-2 border-black"
              >
                Check Status
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
