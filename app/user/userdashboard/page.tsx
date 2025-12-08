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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import {
  format,
  parseISO,
  isToday,
  addDays,
  differenceInDays,
  formatDistanceToNow,
} from "date-fns";
import { getUserInquiries } from "@/action/inquiries";
import { Inquiry } from "@/types/inquiry";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { getCompletedProjects } from "@/action/project";

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

// Interface for completed project (matches the one in action/project.ts)
interface CompletedProject {
  project_id: string;
  name: string;
  projectImages: Array<{
    url: string;
    title: string;
    description?: string;
    uploadedAt: string | Date;
  }>;
  startDate: string | Date;
  endDate: string | Date;
  statusUpdatedAt?: string | Date;
  location?: string; // Now just a string, not an object
}

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
  const [completedProjects, setCompletedProjects] = useState<
    CompletedProject[]
  >([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeolocationSupported, setIsGeolocationSupported] = useState(true);

  const bannerPlugin = Autoplay({
    delay: 3000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  // Check if geolocation is supported
  useEffect(() => {
    setIsGeolocationSupported("geolocation" in navigator);
  }, []);

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
    fetchCompletedProjects();
  }, []);

  const getWeatherData = useCallback(async () => {
    setWeatherLoading(true);
    setLocationError(null);

    try {
      // Check if geolocation is supported
      if (!isGeolocationSupported) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              console.error("Geolocation error:", error);
              let errorMessage = "Unable to get your location";

              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage =
                    "Location access denied. Please enable location services.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location information is unavailable.";
                  break;
                case error.TIMEOUT:
                  errorMessage = "Location request timed out.";
                  break;
              }

              setLocationError(errorMessage);
              reject(new Error(errorMessage));
            },
            {
              timeout: 10000,
              maximumAge: 60 * 60 * 1000,
              enableHighAccuracy: true,
            }
          );
        }
      );

      const { latitude, longitude } = position.coords;
      console.log("Got location:", latitude, longitude);
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

      // Use a default location if geolocation fails (Manila coordinates)
      const defaultLat = 14.5995;
      const defaultLng = 120.9842;

      setCurrentLocation({ lat: defaultLat, lng: defaultLng });
      setWeather({
        condition: "cloudy",
        temperature: 28,
        description: "Partly cloudy",
        city: "Manila",
        barangay: "Ermita",
        feelsLike: 30,
      });

      // Try to get weather for default location
      try {
        await Promise.all([
          getCurrentWeather(defaultLat, defaultLng),
          getForecastData(defaultLat, defaultLng),
        ]);
      } catch (fallbackError) {
        console.error("Fallback weather failed:", fallbackError);
        generateFallbackForecast();
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [getCache, isCacheValid, isGeolocationSupported]);

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
          } else if (result.error) {
            console.error("Weather API error:", result.error);
            setLocationError(result.error);
          }
        } else {
          console.error("Current weather API HTTP error:", response.status);
          setLocationError(`Weather API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching current weather:", error);
        setLocationError("Failed to fetch weather data");
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

  // Fetch completed projects using the server action
  const fetchCompletedProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      console.log("📋 Fetching completed projects from server action...");
      const result = await getCompletedProjects();
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} completed projects`);
        setCompletedProjects(result.data);
      } else {
        console.error("❌ Failed to fetch completed projects:", result.error);
        setCompletedProjects([]);
      }
    } catch (error) {
      console.error("❌ Error fetching completed projects:", error);
      setCompletedProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

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

  // Get time ago format (e.g., "1m", "2h", "3d")
  const getTimeAgo = useCallback((date: Date | string): string => {
    const now = new Date();
    const pastDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - pastDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    }
  }, []);

  // Don't clear cache when component unmounts - cache persists
  useEffect(() => {
    return () => {
      // Cache persists between component mounts/unmounts
      // No cleanup needed - cache remains in localStorage
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 md:px-6 lg:px-10 py-6">
        {" "}
        {/* Reduced padding on mobile */}
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {" "}
          {/* Reduced gap on mobile */}
          {/* Left Column: Main Grid (Carousel, Weather, Completed Projects) - Takes 2/3 on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {" "}
            {/* Reduced spacing on mobile */}
            {/* Carousel Section - Removed Card wrapper */}
            <Carousel
              className="w-full"
              plugins={[bannerPlugin]}
              opts={{
                loop: true,
                align: "start",
              }}
              onMouseEnter={bannerPlugin.stop}
              onMouseLeave={bannerPlugin.reset}
            >
              <CarouselContent>
                {banners.map((banner) => {
                  const BannerIcon = banner.icon;
                  return (
                    <CarouselItem key={banner.id}>
                      <div className="relative h-48 rounded-sm shadow-sm overflow-hidden">
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
                        <div className="relative z-10 h-full flex items-center p-4 md:p-6">
                          {" "}
                          {/* Reduced padding on mobile */}
                          <div className="max-w-2xl">
                            {/* Badge */}
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
                              {banner.badge}
                            </div>

                            <h2 className="text-xl md:text-2xl tracking-tight text-white font-bold mb-2">
                              {banner.title}
                            </h2>
                            <p className="text-white/90 tracking-[1.1] text-xs md:text-sm mb-3">
                              {banner.description}
                            </p>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-white text-orange-500 hover:bg-gray-100 text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 font-medium"
                            >
                              {banner.cta}
                              <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
            {/* Weather Section */}
            <Card className="bg-white rounded-sm border shadow-xs">
              <CardContent className="p-4 md:p-6">
                {" "}
                {/* Reduced padding on mobile */}
                {/* Weather Header with Refresh Icon */}
                <div className="flex justify-between items-start mb-4">
                  {/* Location at the top */}
                  <div>
                    {weatherLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-5 w-32"></div>
                    ) : (
                      <>
                        <p className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight">
                          You're in {weather.barangay}, {weather.city}
                        </p>
                        {locationError && (
                          <p className="text-xs text-red-500 mt-1">
                            {locationError}
                          </p>
                        )}
                      </>
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
                {/* Weather Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column - Today's Weather */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Today is</p>
                    {weatherLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-7 w-24"></div>
                    ) : (
                      <h2 className="text-2xl md:text-3xl font-bold text-orange-500 tracking-tight">
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
                            className={`text-xl md:text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}
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

                  {/* Right Column - 5 Day Forecast */}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-2 tracking-[1.2]">
                      5-Day Forecast
                    </p>
                    <div className="grid grid-cols-5 gap-1 md:gap-2">
                      {" "}
                      {/* Reduced gap on mobile */}
                      {weatherLoading
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="text-center">
                              <div className="animate-pulse bg-gray-200 rounded h-4 w-6 md:w-8 mx-auto mb-1"></div>
                              <div className="animate-pulse bg-gray-200 rounded h-3 w-4 md:w-6 mx-auto mb-1"></div>
                              <div className="animate-pulse bg-gray-200 rounded h-4 w-8 md:w-10 mx-auto"></div>
                            </div>
                          ))
                        : forecast.slice(0, 5).map((day, index) => (
                            <div
                              key={index}
                              className="text-center py-2 md:py-4 border border-none shadow-md rounded-sm"
                            >
                              <p className="text-xs md:text-md font-medium tracking-[1.1] text-gray-600 mb-1">
                                {format(new Date(day.date), "EEE")}
                              </p>
                              <p className="text-lg md:text-xl text-orange-500 font-bold mb-1 tracking-[1.1]">
                                {format(new Date(day.date), "d")}
                              </p>
                              <p className="text-xs font-medium text-gray-600 capitalize truncate px-1">
                                {day.condition}
                              </p>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Completed Projects Section - MODIFIED */}
            <div className="space-y-6 md:space-y-8">
              {" "}
              {/* Reduced spacing on mobile */}
              {/* Section Header */}
              <div className="flex items-center justify-between py-6 md:py-9 mt-6 md:mt-10">
                {" "}
                {/* Reduced padding on mobile */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Recently Completed Projects
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Browse through our successfully delivered projects
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-black text-xs md:text-sm"
                  onClick={fetchCompletedProjects}
                  disabled={projectsLoading}
                >
                  {projectsLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
              {projectsLoading ? (
                <div className="space-y-6 md:space-y-8">
                  {" "}
                  {/* Reduced spacing on mobile */}
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="border-0 shadow-md overflow-hidden"
                    >
                      <div className="animate-pulse">
                        <div className="bg-gray-200 h-6 w-32 mb-4"></div>
                        <div className="bg-gray-200 h-64 w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : completedProjects.length > 0 ? (
                <div className="space-y-6 md:space-y-10">
                  {" "}
                  {/* Reduced spacing on mobile */}
                  {completedProjects.map((project) => {
                    const mainImage =
                      project.projectImages?.[0]?.url ||
                      "/images/default-project.jpg";
                    const timeAgo = getTimeAgo(
                      project.statusUpdatedAt || project.endDate
                    );

                    return (
                      <div
                        key={project.project_id}
                        className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow rounded-t-lg rounded-b-none border-t-1 border-x-1"
                      >
                        {/* Project Header with Start Date */}
                        <div className="p-4 md:p-6 pb-3 md:pb-4 bg-white">
                          {" "}
                          {/* Reduced padding on mobile */}
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
                            {/* Left side: Project info */}
                            <div className="flex-1">
                              {/* Project Name */}
                              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                                {project.name}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                {/* Started Date */}
                                <div className="text-xs text-gray-500">
                                  Started:{" "}
                                  {format(
                                    new Date(project.startDate),
                                    "MMM d, yyyy"
                                  )}
                                </div>

                                {/* Location */}
                                {project.location && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    {project.location}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right side: Check icon and time ago */}
                            <div className="flex items-center justify-end gap-2">
                              {/* Check icon with time ago */}
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                <span className="text-xs font-medium text-gray-900">
                                  {timeAgo}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Project Image - Full width, no border radius */}
                        <div className="relative">
                          {project.projectImages &&
                          project.projectImages.length > 0 ? (
                            <Carousel
                              className="w-full"
                              opts={{
                                loop: true,
                                align: "start",
                              }}
                            >
                              <CarouselContent>
                                {project.projectImages.map((image, index) => (
                                  <CarouselItem
                                    key={index}
                                    className="relative"
                                  >
                                    <div className="relative h-64 md:h-80 w-full">
                                      <Image
                                        src={image.url}
                                        alt={
                                          image.title ||
                                          `Project image ${index + 1}`
                                        }
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                      />
                                      {/* Image Overlay with Info */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 md:p-4">
                                        <div className="text-white">
                                          <p className="font-medium text-sm md:text-base">
                                            {image.title}
                                          </p>
                                          {image.description && (
                                            <p className="text-xs md:text-sm text-white/80 mt-1">
                                              {image.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              {project.projectImages.length > 1 && (
                                <>
                                  <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-none shadow-lg h-8 w-8 md:h-10 md:w-10">
                                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                                  </CarouselPrevious>
                                  <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-none shadow-lg h-8 w-8 md:h-10 md:w-10">
                                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                                  </CarouselNext>
                                </>
                              )}
                            </Carousel>
                          ) : (
                            <div className="relative h-48 md:h-64 w-full bg-gray-100 flex items-center justify-center">
                              <p className="text-gray-500 text-sm md:text-base">
                                No images available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 border-0 shadow-md">
                  <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
                    No Completed Projects Yet
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mb-4">
                    Completed projects will appear here once they're finished.
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Right Column: Calendar, Appointments, etc. - Takes 1/3 on desktop, hidden on mobile */}
          <div className="hidden lg:block space-y-4 md:space-y-6">
            {" "}
            {/* Added hidden lg:block */}
            {/* Calendar Card */}
            <Card className="bg-white rounded-sm border shadow-sm sticky top-[90px]">
              <CardContent className="p-4 md:p-6">
                {" "}
                {/* Reduced padding on mobile */}
                <div className="text-center">
                  {/* Current Date */}
                  <div className="mb-4 md:mb-6">
                    <p className="text-xs md:text-sm text-gray-500">Today</p>
                    {weatherLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-6 w-32 mx-auto"></div>
                    ) : (
                      <p className="text-lg md:text-xl font-bold text-gray-900">
                        {currentDateDisplay}
                      </p>
                    )}
                  </div>

                  {/* Appointments Status */}
                  <div className="mb-4 md:mb-6">
                    {weatherLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-6 w-24 mx-auto mb-2"></div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          {appointmentsStatusDisplay.icon}
                          <p
                            className={`text-base md:text-lg font-semibold ${appointmentsStatusDisplay.color}`}
                          >
                            {appointmentsStatusDisplay.text}
                          </p>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                          {appointmentsStatusDisplay.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Weather Advice */}
                  <div className="pt-4 md:pt-6 border-t border-gray-200">
                    {weatherLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-4 w-32 mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm md:text-md tracking-tight font-bold text-gray-700">
                          {weatherAdvice.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Appointments Section - MOVED HERE */}
            <Card className="bg-white rounded-sm border shadow-sm sticky top-[calc(90px+20rem)]">
              <CardContent className="p-4 md:p-6">
                {" "}
                {/* Reduced padding on mobile */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-black" />
                      Today's Appointments
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">
                      {hasAppointmentsToday
                        ? `${todaysAppointments.length} appointment${todaysAppointments.length > 1 ? "s" : ""} scheduled`
                        : "No appointments today"}
                    </p>
                  </div>
                  {hasAppointmentsToday && (
                    <div className="text-xs md:text-sm font-semibold text-blue-600">
                      {todaysAppointments.length}
                    </div>
                  )}
                </div>
                {hasAppointmentsToday ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {todaysAppointments.map((appointment) => (
                      <Card
                        key={appointment._id}
                        className="border border-black"
                      >
                        <CardContent className="p-3 md:p-4">
                          {" "}
                          {/* Reduced padding on mobile */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
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

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                                {" "}
                                {/* Adjusted for right column */}
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
                                <div className="flex items-center gap-2 md:col-span-2">
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
                  <div className="text-center py-6 md:py-8">
                    {" "}
                    {/* Reduced padding on mobile */}
                    <Calendar className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-1">
                      No Appointments Today
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      Enjoy your day! You're all caught up.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
