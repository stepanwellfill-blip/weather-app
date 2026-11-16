// ============================================================
// Вставь сюда свой ключ с openweathermap.org
// ============================================================
const API_KEY = "8487334276a68c97223fb43b027eb154";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ============================================================
// Ссылки на DOM-элементы
// ============================================================
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const geoBtn = document.getElementById("geo-btn");
const retryBtn = document.getElementById("retry-btn");
const errorMessage = document.getElementById("error-message");
const currentWeatherEl = document.getElementById("current-weather");
const forecastGrid = document.getElementById("forecast-grid");

// ============================================================
// Утилиты для переключения состояний
// ============================================================
function showLoader() {
  document.body.dataset.state = "loading";
}

function hideLoader() {
  // Не сбрасываем состояние, если оно уже стало error или ready
}

function showError(message) {
  document.body.dataset.state = "error";
  errorMessage.textContent = message;
}

function setReadyState() {
  document.body.dataset.state = "ready";
}

function setEmptyState() {
  document.body.dataset.state = "empty";
}

// ============================================================
// localStorage — сохранение последнего города
// ============================================================
function saveCity(city) {
  try {
    localStorage.setItem("lastCity", city);
  } catch (e) {
    console.error("Не удалось сохранить город в localStorage:", e);
  }
}

function loadSavedCity() {
  try {
    return localStorage.getItem("lastCity");
  } catch (e) {
    console.error("Не удалось прочитать город из localStorage:", e);
    return null;
  }
}

// ============================================================
// Форматирование времени с учётом часового пояса города
// ============================================================
function formatTime(unixTimestamp, timezoneOffsetSeconds) {
  // timezoneOffsetSeconds — смещение в секундах от UTC (приходит из API)
  const date = new Date((unixTimestamp + timezoneOffsetSeconds) * 1000);
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC", // время уже сдвинуто вручную
  }).format(date);
}

// ============================================================
// Определение типа погоды для градиента фона
// ============================================================
function setWeatherBackground(weatherMain, weatherId) {
  let type = "cloudy"; // по умолчанию

  if (weatherMain === "Clear") type = "sunny";
  else if (weatherMain === "Rain" || weatherMain === "Drizzle" || weatherMain === "Thunderstorm") type = "rain";
  else if (weatherMain === "Snow") type = "snow";

  // Уточнение для облачности
  if (weatherMain === "Clouds") {
    if (weatherId >= 801 && weatherId <= 802) type = "sunny"; // малооблачно
    else type = "cloudy";
  }

  document.body.dataset.weather = type;
}

// ============================================================
// Рендер текущей погоды (обновленный дизайн)
// ============================================================
function renderCurrent(data) {
  const { name, main, weather, wind, sys, timezone, coord } = data;
  const w = weather[0];

  const sunrise = formatTime(sys.sunrise, timezone);
  const sunset = formatTime(sys.sunset, timezone);

  // Устанавливаем цвет фона в зависимости от погоды
  setWeatherBackground(w.main, w.id);

  // Генерируем текущую дату
  const today = new Intl.DateTimeFormat("ru-RU", { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  currentWeatherEl.innerHTML = `
    <div class="current-top">
      <div>
        <div class="current-city">${name}</div>
        <div class="current-date">${today}</div>
      </div>
    </div>
    
    <div class="current-hero">
      <div class="current-icon-wrapper">
        <img
          class="current-icon"
          src="https://openweathermap.org/img/wn/${w.icon}@4x.png"
          alt="${w.description}"
          onerror="this.style.display='none'"
        />
      </div>
      <div class="current-temp-block">
        <div class="current-temp">${Math.round(main.temp)}<sup>°C</sup></div>
        <div class="current-desc-text">${w.description}</div>
        <div class="current-feels">Ощущается как ${Math.round(main.feels_like)}°C</div>
      </div>
    </div>

    <div class="current-details">
      <div class="detail-item">
        <div class="detail-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3c-3 3.5-5 6.5-5 9.5a5 5 0 0 0 10 0C17 9.5 15 6.5 12 3Z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="detail-info">
          <div class="detail-label">Влажность</div>
          <div class="detail-value">${main.humidity}%</div>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="detail-info">
          <div class="detail-label">Ветер</div>
          <div class="detail-value">${wind.speed} м/с</div>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="detail-info">
          <div class="detail-label">Давление</div>
          <div class="detail-value">${Math.round(main.pressure * 0.7506)} мм рт. ст.</div>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="detail-info">
          <div class="detail-label">Восход / Закат</div>
          <div class="detail-value">${sunrise} / ${sunset}</div>
        </div>
      </div>
    </div>
  `;

  // Возвращаем координаты для запроса прогноза
  return { lat: coord.lat, lon: coord.lon };
}

// ============================================================
// Рендер прогноза (сгруппировано по дням, обновленный дизайн)
// ============================================================
function renderForecast(data) {
  const { list, city } = data;
  const timezone = city.timezone;

  // Группируем записи по дате (в часовом поясе города)
  const groups = {};

  list.forEach((item) => {
    const localDate = new Date((item.dt + timezone) * 1000);
    const dateKey = localDate.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  // Берём первые 5 дней
  const dayKeys = Object.keys(groups).sort().slice(0, 5);

  forecastGrid.innerHTML = "";

  dayKeys.forEach((key, index) => {
    const items = groups[key];
    if (!items || items.length === 0) return;

    // Мин и макс температура за день
    const temps = items.map((i) => i.main.temp);
    const min = Math.round(Math.min(...temps));
    const max = Math.round(Math.max(...temps));

    // Выбираем иконку, которая чаще встречается в дневные часы (9:00–18:00)
    const dayItems = items.filter((i) => {
      const hour = new Date((i.dt + timezone) * 1000).getUTCHours();
      return hour >= 9 && hour <= 18;
    });

    const iconCounts = {};
    const descCounts = {};
    (dayItems.length > 0 ? dayItems : items).forEach((i) => {
      const w = i.weather[0];
      iconCounts[w.icon] = (iconCounts[w.icon] || 0) + 1;
      descCounts[w.description] = (descCounts[w.description] || 0) + 1;
    });

    // Самая частая иконка и описание
    const mostFrequentIcon = Object.entries(iconCounts).sort((a, b) => b[1] - a[1])[0][0];
    const mostFrequentDesc = Object.entries(descCounts).sort((a, b) => b[1] - a[1])[0][0];

    // Форматируем дату
    const dateObj = new Date((items[0].dt + timezone) * 1000);
    const dayName = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(dateObj);
    const dateStr = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(dateObj);

    const card = document.createElement("article");
    card.className = "forecast-card";
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-date">${dateStr}</div>
      <div class="forecast-icon-wrapper">
        <img
          class="forecast-icon"
          src="https://openweathermap.org/img/wn/${mostFrequentIcon}@2x.png"
          alt="${mostFrequentDesc}"
          onerror="this.style.display='none'"
        />
      </div>
      <div class="forecast-temps">
        <span class="forecast-max">${max}°</span>
        <span class="forecast-min">${min}°</span>
      </div>
      <div class="forecast-desc">${mostFrequentDesc}</div>
    `;

    forecastGrid.appendChild(card);
  });
}

// ============================================================
// Запросы к API
// ============================================================
async function getWeatherByCity(city) {
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) throw new Error("CITY_NOT_FOUND");
    if (response.status === 401) throw new Error("INVALID_KEY");
    throw new Error("API_ERROR");
  }

  return response.json();
}

async function getWeatherByCoords(lat, lon) {
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 401) throw new Error("INVALID_KEY");
    throw new Error("API_ERROR");
  }

  return response.json();
}

async function getForecast(lat, lon) {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 401) throw new Error("INVALID_KEY");
    throw new Error("API_ERROR");
  }

  return response.json();
}

// ============================================================
// Основная логика загрузки погоды
// ============================================================
async function loadWeather(city) {
  showLoader();

  try {
    // 1. Текущая погода
    const currentData = await getWeatherByCity(city);

    // 2. Рендер текущей погоды + получаем координаты
    const coords = renderCurrent(currentData);

    // 3. Прогноз по координатам
    const forecastData = await getForecast(coords.lat, coords.lon);

    // 4. Рендер прогноза
    renderForecast(forecastData);

    // 5. Сохраняем город
    saveCity(city);

    // 6. Показываем готовое состояние
    setReadyState();
  } catch (error) {
    console.error("Ошибка при загрузке погоды:", error);

    if (error.message === "CITY_NOT_FOUND") {
      showError("Город не найден. Проверьте название.");
    } else if (error.message === "INVALID_KEY") {
      showError("Не удалось загрузить погоду. Попробуйте позже.");
    } else if (!navigator.onLine) {
      showError("Проверьте подключение к интернету.");
    } else {
      showError("Не удалось загрузить погоду. Попробуйте позже.");
    }
  }
}

async function loadWeatherByCoords(lat, lon) {
  showLoader();

  try {
    // 1. Текущая погода
    const currentData = await getWeatherByCoords(lat, lon);

    // 2. Рендер текущей погоды
    renderCurrent(currentData);

    // 3. Прогноз
    const forecastData = await getForecast(lat, lon);
    renderForecast(forecastData);

    // 4. Сохраняем название города, если есть
    if (currentData.name) {
      saveCity(currentData.name);
    }

    setReadyState();
  } catch (error) {
    console.error("Ошибка при загрузке погоды по координатам:", error);

    if (error.message === "INVALID_KEY") {
      showError("Не удалось загрузить погоду. Попробуйте позже.");
    } else if (!navigator.onLine) {
      showError("Проверьте подключение к интернету.");
    } else {
      showError("Не удалось загрузить погоду. Попробуйте позже.");
    }
  }
}

// ============================================================
// Геолокация
// ============================================================
function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Геолокация недоступна. Введите город вручную.");
    return;
  }

  showLoader();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherByCoords(latitude, longitude);
    },
    (error) => {
      console.error("Ошибка геолокации:", error);
      if (error.code === error.PERMISSION_DENIED) {
        showError("Геолокация недоступна. Введите город вручную.");
      } else {
        showError("Не удалось определить местоположение. Введите город вручную.");
      }
    },
    { timeout: 10000 }
  );
}

// ============================================================
// Обработчики событий
// ============================================================
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    cityInput.focus();
    return;
  }

  loadWeather(city);
});

geoBtn.addEventListener("click", handleGeolocation);

retryBtn.addEventListener("click", () => {
  const savedCity = loadSavedCity();
  if (savedCity) {
    loadWeather(savedCity);
  } else {
    setEmptyState();
  }
});

// ============================================================
// Инициализация при загрузке страницы
// ============================================================
(function init() {
  const savedCity = loadSavedCity();

  if (savedCity) {
    cityInput.value = savedCity;
    loadWeather(savedCity);
  } else {
    setEmptyState();
  }

  window.addEventListener("offline", () => {
    showError("Проверьте подключение к интернету.");
  });
})();