let userLocation = "Pune";
let currentCityData = null;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const shareBtn = document.getElementById('shareBtn');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsSection = document.getElementById('resultsSection');
const cityModal = document.getElementById('cityModal');
const cityChoices = document.getElementById('cityChoices');
const closeModal = document.getElementById('closeModal');
const favoritesModal = document.getElementById('favoritesModal');
const favoritesList = document.getElementById('favoritesList');
const closeFavModal = document.getElementById('closeFavModal');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const favCount = document.getElementById('favCount');

// --- NEW FEATURE: TYPING PLACEHOLDER ---
const placeholders = ["Where to next? Try Bali…", "Search Paris, Tokyo, Dubai…", "Explore Goa, Manali, London…"];
let phIndex = 0, charIndex = 0, isDeleting = false, typingTimer;

function animatePlaceholder() {
  const input = document.getElementById('cityInput');
  if (document.activeElement === input) return;
  const current = placeholders[phIndex];
  input.setAttribute('placeholder', isDeleting ? current.substring(0, charIndex--) : current.substring(0, charIndex++));
  if (!isDeleting && charIndex === current.length) { isDeleting = true; typingTimer = setTimeout(animatePlaceholder, 2000); }
  else if (isDeleting && charIndex === 0) { isDeleting = false; phIndex = (phIndex + 1) % placeholders.length; typingTimer = setTimeout(animatePlaceholder, 500); }
  else { typingTimer = setTimeout(animatePlaceholder, isDeleting ? 40 : 80); }
}

// --- NEW FEATURE: TOASTS ---
function showToast(message, type = 'error') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
}

// --- NEW FEATURE: VALUE ANIMATION ---
function animateValue(element, start, end, duration, suffix = '') {
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start) + suffix;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// --- AUTO SCROLL LOGIC ---
function showResults() {
  resultsSection.classList.remove('hidden');
  // Trigger Auto Scroll to results section
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// [Geocoding - Convert city name to coordinates]
async function fetchCityData(cityName) {
  try {
    showLoading();
    hideError();
    
    const geoRes = await fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=geo&params=q=${encodeURIComponent(cityName)}%26limit=5`);
    const geoData = await geoRes.json();
    
    if (!geoData || geoData.length === 0) {
      showToast('City not found. Please try another name.', 'error');
      hideLoading();
      return;
    }
    
    // Find the best match — prioritize results where the name starts with
    // or closely matches what the user typed
    const searchLower = cityName.toLowerCase().trim();

    // Score each result by how well it matches
    const scored = geoData.map(city => {
      const nameLower = city.name.toLowerCase();
      let score = 0;
      if (nameLower === searchLower) score = 100;                    // exact match
      else if (nameLower.startsWith(searchLower)) score = 80;        // starts with
      else if (nameLower.includes(searchLower)) score = 60;          // contains
      else if (searchLower.includes(nameLower)) score = 40;          // reverse contains
      else score = 0;                                                  // no match
      return { ...city, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // If best match has score 0, the API returned something completely unrelated
    // In that case show the city selection modal so user can pick
    if (scored[0].score === 0) {
      // Show all options for user to choose from
      showCityChoices(geoData);
      hideLoading();
      return;
    }

    const { lat, lon, name, country } = scored[0];
    await fetchWeatherData({ lat, lon, name, country });
    
  } catch (err) {
    showToast('Error searching for city. Please try again.', 'error');
    hideLoading();
    console.error(err);
  }
}

// [Best Time to Visit Lookup]
function getCityBestTime(cityName, country) {
  const cityLookup = {
    // India cities
    'mumbai': { months: 'Nov-Feb', reason: 'Pleasant winter • Low humidity' },
    'goa': { months: 'Nov-Mar', reason: 'Dry season • Perfect beach weather' },
    'delhi': { months: 'Oct-Mar', reason: 'Cool weather • Avoid summer heat' },
    'jaipur': { months: 'Oct-Mar', reason: 'Mild temperatures • Festival season' },
    'manali': { months: 'May-Jun & Sep-Oct', reason: 'Pre/post monsoon • Clear skies' },
    'bangalore': { months: 'Oct-Feb', reason: 'Pleasant weather • Less rainfall' },
    'chennai': { months: 'Nov-Feb', reason: 'Cool season • Less humid' },
    'kolkata': { months: 'Nov-Feb', reason: 'Winter season • Comfortable' },
    'hyderabad': { months: 'Oct-Feb', reason: 'Mild weather • Avoid summer' },
    'pune': { months: 'Oct-Mar', reason: 'Pleasant climate • Less rain' },
    'agra': { months: 'Oct-Mar', reason: 'Cool weather • Good visibility' },
    'udaipur': { months: 'Oct-Mar', reason: 'Mild temperatures • Lake views' },
    'varanasi': { months: 'Nov-Feb', reason: 'Comfortable weather • Festivals' },
    'kerala': { months: 'Sep-Mar', reason: 'Post monsoon • Backwater season' },
    'munnar': { months: 'Sep-May', reason: 'Tea harvest • Pleasant climate' },
    
    // International cities
    'paris': { months: 'Apr-Jun', reason: 'Spring bloom • Mild weather' },
    'tokyo': { months: 'Mar-May & Sep-Nov', reason: 'Cherry blossoms • Autumn colors' },
    'bali': { months: 'May-Sep', reason: 'Dry season • Less rainfall' },
    'dubai': { months: 'Nov-Mar', reason: 'Cool winter • Avoid summer heat' },
    'london': { months: 'May-Sep', reason: 'Warmest months • Long days' },
    'new york': { months: 'Sep-Nov', reason: 'Fall foliage • Mild temperatures' },
    'bangkok': { months: 'Nov-Mar', reason: 'Cool season • Less humidity' },
    'singapore': { months: 'Feb-Apr', reason: 'Less rainfall • Inter-monsoon' },
    'sydney': { months: 'Sep-Nov', reason: 'Spring bloom • Perfect temps' },
    'melbourne': { months: 'Mar-May & Sep-Nov', reason: 'Mild shoulder seasons' },
    'rome': { months: 'Apr-Jun & Sep-Oct', reason: 'Spring/autumn • Less crowds' },
    'barcelona': { months: 'May-Jun & Sep-Oct', reason: 'Warm beach weather • Festivals' },
    'amsterdam': { months: 'Apr-May & Sep-Oct', reason: 'Tulip season • Mild weather' },
    'berlin': { months: 'May-Sep', reason: 'Summer festivals • Outdoor life' },
    'cape town': { months: 'Nov-Mar', reason: 'Summer season • Dry & warm' },
    'cairo': { months: 'Oct-Apr', reason: 'Cool season • Desert comfortable' },
    'istanbul': { months: 'Apr-Jun & Sep-Nov', reason: 'Mild temperatures • Sightseeing' },
    'tokyo': { months: 'Mar-May & Sep-Nov', reason: 'Cherry blossoms • Autumn colors' },
    'seoul': { months: 'Apr-Jun & Sep-Nov', reason: 'Spring blooms • Fall foliage' },
    'kyoto': { months: 'Mar-May & Oct-Nov', reason: 'Cherry blossoms • Autumn leaves' },
    'hong kong': { months: 'Oct-Dec', reason: 'Cool dry season • Clear skies' },
    'maldives': { months: 'Nov-Apr', reason: 'Dry season • Calm seas' },
    'mauritius': { months: 'May-Dec', reason: 'Cool dry • Less humidity' },
    'seychelles': { months: 'Apr-May & Oct-Nov', reason: 'Calm seas • Good visibility' },
    'phuket': { months: 'Nov-Mar', reason: 'High season • Calm waters' },
    'chiang mai': { months: 'Nov-Feb', reason: 'Cool season • Festivals' },
    'ho chi minh': { months: 'Dec-Mar', reason: 'Dry season • Less humidity' },
    'hanoi': { months: 'Oct-Dec', reason: 'Cool dry • Pleasant weather' },
    'kuala lumpur': { months: 'May-Jul & Dec-Feb', reason: 'Less rainfall • Festivals' },
    'los angeles': { months: 'Mar-May & Sep-Nov', reason: 'Mild weather • Less crowds' },
    'san francisco': { months: 'Sep-Nov', reason: 'Warmest • Clearest skies' },
    'miami': { months: 'Nov-Mar', reason: 'Dry season • Less humidity' },
    'las vegas': { months: 'Mar-May & Oct-Nov', reason: 'Mild temperatures • Less heat' },
    'chicago': { months: 'Apr-Jun & Sep-Oct', reason: 'Spring/summer • Festivals' },
    'toronto': { months: 'May-Sep', reason: 'Warmest months • Outdoor events' },
    'vancouver': { months: 'Jun-Sep', reason: 'Summer sun • Warmest weather' },
    'rio de janeiro': { months: 'May-Oct', reason: 'Dry season • Less rainfall' },
    'buenos aires': { months: 'Mar-May & Sep-Nov', reason: 'Mild shoulder seasons' },
    'lima': { months: 'May-Sep', reason: 'Dry season • Clear skies' },
    'cancun': { months: 'Dec-Apr', reason: 'Dry season • Perfect beach weather' },
    'athens': { months: 'Apr-Jun & Sep-Oct', reason: 'Spring/autumn • Avoid summer heat' },
    'vienna': { months: 'Apr-May & Sep-Oct', reason: 'Pleasant weather • Cultural events' },
    'prague': { months: 'May-Jun & Sep-Oct', reason: 'Mild temperatures • Fewer crowds' },
    'budapest': { months: 'Mar-May & Sep-Nov', reason: 'Spring/autumn • Thermal baths' },
    'dubrovnik': { months: 'May-Jun & Sep-Oct', reason: 'Warm sea • Less crowded' },
    'santorini': { months: 'Apr-Jun & Sep-Oct', reason: 'Warm water • Sunset views' },
    'edinburgh': { months: 'May-Sep', reason: 'Warmest • Festival season' },
    'dublin': { months: 'May-Sep', reason: 'Mildest weather • Green landscapes' },
    'stockholm': { months: 'May-Aug', reason: 'Summer sun • Midnight sun' },
    'oslo': { months: 'May-Aug', reason: 'Summer warmth • Long days' },
    'helsinki': { months: 'Jun-Aug', reason: 'Summer • White nights' },
    'copenhagen': { months: 'May-Sep', reason: 'Warm months • Long days' },
    'reykjavik': { months: 'Jun-Aug', reason: 'Midnight sun • Best weather' },
    'petra': { months: 'Mar-May & Oct-Nov', reason: 'Mild temperatures • Hiking' },
    'jerusalem': { months: 'Mar-May & Sep-Nov', reason: 'Spring/autumn • Comfortable' },
    'marrakech': { months: 'Mar-May & Sep-Nov', reason: 'Mild weather • Avoid summer' },
    'casablanca': { months: 'Apr-May & Sep-Oct', reason: 'Spring/autumn • Coastal' },
    'zanzibar': { months: 'Jun-Oct', reason: 'Dry season • Cooler weather' },
    'nairobi': { months: 'Jun-Oct', reason: 'Dry season • Wildlife viewing' },
    'cape town': { months: 'Nov-Mar', reason: 'Summer • Dry season' },
    'auckland': { months: 'Nov-Apr', reason: 'Warm months • Outdoor activities' },
    'queenstown': { months: 'Dec-Feb', reason: 'Summer • Adventure sports' },
    'fiji': { months: 'May-Oct', reason: 'Dry season • Less humidity' },
    'bora bora': { months: 'Nov-Apr', reason: 'Dry season • Calm waters' },
    'santorini': { months: 'Apr-Oct', reason: 'Warm sea • Less rainfall' }
  };
  
  const cityKey = cityName.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (cityLookup[cityKey]) {
    return cityLookup[cityKey];
  }
  
  // Southern hemisphere countries (seasons reversed)
  const southernHemisphere = ['AU', 'NZ', 'ZA', 'AR', 'CL', 'BR', 'UY', 'PY', 'BO', 'PE'];
  const isSouthern = southernHemisphere.includes(country);
  
  const currentMonth = new Date().getMonth(); // 0-11
  
  // Generic seasonal recommendations
  if (isSouthern) {
    // Southern hemisphere: summer is Dec-Feb, winter Jun-Aug
    if (currentMonth >= 11 || currentMonth <= 1) {
      return { months: 'Dec-Feb', reason: 'Summer season • Warm weather' };
    } else if (currentMonth >= 2 && currentMonth <= 4) {
      return { months: 'Mar-May', reason: 'Autumn • Mild temperatures' };
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      return { months: 'Jun-Aug', reason: 'Winter • Cool season' };
    } else {
      return { months: 'Sep-Nov', reason: 'Spring bloom • Pleasant weather' };
    }
  } else {
    // Northern hemisphere: summer is Jun-Aug, winter Dec-Feb
    if (currentMonth >= 5 && currentMonth <= 7) {
      return { months: 'Jun-Aug', reason: 'Summer • Warmest months' };
    } else if (currentMonth >= 8 && currentMonth <= 10) {
      return { months: 'Sep-Nov', reason: 'Autumn • Mild weather' };
    } else if (currentMonth >= 11 || currentMonth <= 1) {
      return { months: 'Dec-Feb', reason: 'Winter • Cool season' };
    } else {
      return { months: 'Mar-May', reason: 'Spring • Pleasant temperatures' };
    }
  }
}

// [Core Weather Fetching Logic]
async function fetchWeatherData(cityData) {
  try {
    showLoading();
    hideError();
    const { lat, lon, name, country } = cityData;

    const [aqiRes, weatherRes, forecastRes, uvRes] = await Promise.all([
      fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=air_pollution&params=lat=${lat}%26lon=${lon}`),
      fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=weather&params=lat=${lat}%26lon=${lon}%26units=metric`),
      fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=forecast&params=lat=${lat}%26lon=${lon}%26units=metric`),
      fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=uvi&params=lat=${lat}%26lon=${lon}`)
    ]);

    const aqiData = await aqiRes.json();
    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();
    const uvData = await uvRes.json();

    currentCityData = {
      city: name, country, aqi: aqiData.list[0].main.aqi,
      temp: Math.round(weatherData.main.temp), humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed, description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon, timezone: weatherData.timezone,
      sunrise: weatherData.sys.sunrise, sunset: weatherData.sys.sunset,
      visibility: weatherData.visibility, uvIndex: Math.round(uvData.value),
      forecast: forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5)
    };

    displayResults(currentCityData);
    addRecentSearch(name);
    hideLoading();
    showResults(); // This triggers the auto-scroll
  } catch (err) {
    showToast('Error fetching weather data');
    hideLoading();
  }
}

// [Display Results in UI]
function displayResults(data) {
  // Store data globally for enhancements.js to use
  window.currentCityData = data;
  
  // City name and weather description
  document.getElementById('cityName').textContent = data.city;
  document.getElementById('weatherDesc').textContent = data.description;
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
  
  // Stats
  document.getElementById('aqiValue').textContent = data.aqi;
  const aqiLabels = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
  document.getElementById('aqiLabel').textContent = aqiLabels[data.aqi] || 'Unknown';
  
  document.getElementById('tempValue').textContent = `${data.temp}°C`;
  document.getElementById('feelsLike').textContent = `Feels like ${data.temp}°C`;
  
  document.getElementById('humidityValue').textContent = `${data.humidity}%`;
  document.getElementById('windSpeed').textContent = `Wind: ${data.windSpeed} m/s`;
  
  // UV Index display
  const uvValue = data.uvIndex || 0;
  let uvLabel = 'Low';
  if (uvValue >= 3 && uvValue <= 5) uvLabel = 'Moderate';
  else if (uvValue >= 6 && uvValue <= 7) uvLabel = 'High';
  else if (uvValue >= 8 && uvValue <= 10) uvLabel = 'Very High';
  else if (uvValue >= 11) uvLabel = 'Extreme';
  document.getElementById('uvValue').textContent = uvValue;
  document.getElementById('uvLabel').textContent = uvLabel;
  
  // Best Time to Visit
  const bestTime = getCityBestTime(data.city, data.country);
  document.getElementById('bestMonth').textContent = bestTime.months;
  document.getElementById('bestReason').textContent = bestTime.reason;
  
  // Traveler Rating
  const rating = getRatingFromData(data);
  const fullStars = Math.floor(rating.stars);
  const hasHalfStar = rating.stars % 1 === 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const starsString = '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
  document.getElementById('ratingStars').textContent = starsString;
  document.getElementById('ratingText').textContent = rating.label;
  document.getElementById('ratingBadge').textContent = rating.percent;
  
  // Health recommendation
  const healthEl = document.getElementById('healthRec');
  if (data.aqi <= 2) {
    healthEl.textContent = 'Air quality is good. Perfect for outdoor activities and sightseeing!';
  } else if (data.aqi === 3) {
    healthEl.textContent = 'Air quality is moderate. Sensitive individuals should limit prolonged outdoor exertion.';
  } else {
    healthEl.textContent = 'Air quality is poor. Consider wearing a mask and avoiding outdoor activities.';
  }
  
  // Forecast
  const forecastGrid = document.getElementById('forecastGrid');
  if (forecastGrid && data.forecast) {
    forecastGrid.innerHTML = data.forecast.map(day => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `
        <div class="forecast-item">
          <div class="forecast-day">${dayName}</div>
          <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
          <div class="forecast-temp">${Math.round(day.main.temp)}°</div>
          <div class="forecast-feels">Feels ${Math.round(day.main.feels_like)}°</div>
          <div class="forecast-desc">${day.weather[0].main}</div>
        </div>
      `;
    }).join('');
  }
  
  // Flight link
  const flightLink = document.getElementById('flightLink');
  const flightTitle = document.getElementById('flightTitle');
  if (flightLink && flightTitle) {
    flightTitle.textContent = `Ready to visit ${data.city}?`;
    flightLink.href = `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(data.city)}`;
  }
  
  // Hotel platforms - Featured Booking.com + Other platforms
  const bookingLink = document.getElementById('bookingLink');
  if (bookingLink) {
    bookingLink.href = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(data.city)}`;
  }
  
  const agodaLink = document.getElementById('agodaLink');
  if (agodaLink) {
    agodaLink.href = `https://www.agoda.com/search?city=${encodeURIComponent(data.city)}`;
  }
  
  const airbnbLink = document.getElementById('airbnbLink');
  if (airbnbLink) {
    airbnbLink.href = `https://www.airbnb.com/s/${encodeURIComponent(data.city)}/homes`;
  }
  
  const hotelscomLink = document.getElementById('hotelscomLink');
  if (hotelscomLink) {
    hotelscomLink.href = `https://www.hotels.com/search.do?q=${encodeURIComponent(data.city)}`;
  }
  
  // Update time info
  if (data.timezone) {
    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
    const local = new Date(utc + (data.timezone * 1000));
    document.getElementById('localTime').textContent = local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (data.sunrise && data.sunset) {
    const sr = new Date(data.sunrise * 1000);
    const ss = new Date(data.sunset * 1000);
    document.getElementById('sunriseTime').textContent = sr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunsetTime').textContent = ss.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (data.visibility) {
    document.getElementById('visibilityValue').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  }
  
  // Update map iframe
  const mapFrame = document.getElementById('cityMapFrame');
  if (mapFrame) { mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(data.city)}&output=embed&z=11`; }
  
  // Update destination cards based on searched city
  updateDestinationCards(data.city, data.country);
}

// [Update Destination Cards based on region]
function updateDestinationCards(searchedCity, country) {
  const cityDatabase = {
    india: [
      { name: 'Mumbai', imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=700&q=85', tag: 'TRENDING' },
      { name: 'Goa', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=700&q=85', tag: 'RECOMMENDED' },
      { name: 'Manali', imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=700&q=85', tag: 'PEACEFUL' },
      { name: 'Delhi', imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=700&q=85', tag: 'HISTORIC' },
      { name: 'Jaipur', imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=700&q=85', tag: 'ROYAL' },
      { name: 'Kerala', imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=85', tag: 'SERENE' },
      { name: 'Varanasi', imageUrl: 'https://images.unsplash.com/photo-1561361058-4b7b9b0c8f0c?w=700&q=85', tag: 'SPIRITUAL' },
      { name: 'Udaipur', imageUrl: 'https://images.unsplash.com/photo-1595658656771-6c5b2c8d52d8?w=700&q=85', tag: 'ROMANTIC' }
    ],
    europe: [
      { name: 'Paris', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=85', tag: 'ROMANTIC' },
      { name: 'London', imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=700&q=85', tag: 'ICONIC' },
      { name: 'Rome', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=700&q=85', tag: 'HISTORIC' },
      { name: 'Barcelona', imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=700&q=85', tag: 'VIBRANT' },
      { name: 'Amsterdam', imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e05b2e9a?w=700&q=85', tag: 'CHARMING' },
      { name: 'Berlin', imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=700&q=85', tag: 'TRENDING' },
      { name: 'Prague', imageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=700&q=85', tag: 'FAIRYTALE' }
    ],
    japan: [
      { name: 'Tokyo', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=85', tag: 'BUSTLING' },
      { name: 'Kyoto', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=700&q=85', tag: 'TRADITIONAL' },
      { name: 'Osaka', imageUrl: 'https://images.unsplash.com/photo-1590559899731-a382839554f4?w=700&q=85', tag: 'FOODIE' },
      { name: 'Hokkaido', imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=700&q=85', tag: 'WINTER' }
    ],
    thailand: [
      { name: 'Bangkok', imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=700&q=85', tag: 'DYNAMIC' },
      { name: 'Chiang Mai', imageUrl: 'https://images.unsplash.com/photo-1598935898639-97d5a5b8b8f9?w=700&q=85', tag: 'CULTURAL' },
      { name: 'Phuket', imageUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=700&q=85', tag: 'TROPICAL' },
      { name: 'Krabi', imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=700&q=85', tag: 'PARADISE' }
    ],
    us: [
      { name: 'New York', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=700&q=85', tag: 'ICONIC' },
      { name: 'Los Angeles', imageUrl: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=700&q=85', tag: 'GLAMOROUS' },
      { name: 'Miami', imageUrl: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=700&q=85', tag: 'BEACHY' },
      { name: 'San Francisco', imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=700&q=85', tag: 'TRENDY' },
      { name: 'Las Vegas', imageUrl: 'https://images.unsplash.com/photo-1581351123004-75798061a754?w=700&q=85', tag: 'EXCITING' }
    ],
    global: [
      { name: 'Dubai', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=700&q=85', tag: 'LUXURY' },
      { name: 'Bali', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=700&q=85', tag: 'TROPICAL' },
      { name: 'Singapore', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=700&q=85', tag: 'MODERN' },
      { name: 'Sydney', imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=700&q=85', tag: 'STUNNING' },
      { name: 'Tokyo', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=85', tag: 'TRENDING' },
      { name: 'Paris', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=85', tag: 'ROMANTIC' }
    ]
  };
  
  // Select region based on country
  let region = 'global';
  if (country === 'IN') region = 'india';
  else if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PT', 'GR'].includes(country)) region = 'europe';
  else if (country === 'JP') region = 'japan';
  else if (country === 'TH') region = 'thailand';
  else if (country === 'US') region = 'us';
  
  // Get cities from selected region, excluding searched city
  let regionCities = cityDatabase[region].filter(city => 
    city.name.toLowerCase() !== searchedCity.toLowerCase()
  );
  
  // Shuffle and pick 3
  regionCities = regionCities.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  // If we don't have enough cities from the region, fill from global
  if (regionCities.length < 3) {
    const globalCities = cityDatabase.global.filter(city => 
      city.name.toLowerCase() !== searchedCity.toLowerCase() &&
      !regionCities.find(c => c.name === city.name)
    );
    while (regionCities.length < 3 && globalCities.length > 0) {
      const randomIndex = Math.floor(Math.random() * globalCities.length);
      regionCities.push(globalCities.splice(randomIndex, 1)[0]);
    }
  }
  
  // Update the 3 destination cards
  const destCards = document.querySelectorAll('.dest-card');
  const defaultCity = { 
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=700&q=85', 
    tag: 'EXPLORE' 
  };
  
  destCards.forEach((card, index) => {
    const city = regionCities[index] || { 
      name: searchedCity, 
      imageUrl: defaultCity.imageUrl, 
      tag: defaultCity.tag 
    };
    card.querySelector('img').src = city.imageUrl;
    card.querySelector('img').alt = city.name;
    card.querySelector('.dest-name').textContent = city.name;
    card.querySelector('.dest-tag').textContent = city.tag;
    card.onclick = () => quickSearch(city.name);
  });
}

// [Traveler Rating based on weather data]
function getRatingFromData(data) {
  let rating = 5.0;
  
  // AQI deductions
  if (data.aqi >= 4) rating -= 1.5;
  else if (data.aqi === 3) rating -= 0.5;
  
  // Temperature deductions
  if (data.temp > 38 || data.temp < 2) rating -= 1.0;
  else if (data.temp > 33 || data.temp < 8) rating -= 0.5;
  
  // Humidity deduction
  if (data.humidity > 85) rating -= 0.5;
  
  // Wind speed deduction
  if (data.windSpeed > 12) rating -= 0.5;
  
  // Clamp between 2.5 and 5
  rating = Math.max(2.5, Math.min(5.0, rating));
  
  // Round to nearest 0.5
  rating = Math.round(rating * 2) / 2;
  
  // Generate label based on rating
  let label = "Great time to visit";
  if (rating >= 4.5) label = "Perfect time to visit";
  else if (rating >= 4.0) label = "Great time to visit";
  else if (rating >= 3.5) label = "Good time to visit";
  else if (rating >= 3.0) label = "Decent time to visit";
  else label = "Consider timing carefully";
  
  // Generate percent based on rating (deterministic)
  const percent = Math.round((rating / 5) * 100);
  
  return { stars: rating, label: label, percent: `${percent}% recommend` };
}

function displayTravelScore(data) {
  let score = 100 - ((data.aqi - 1) * 15);
  if (data.temp > 35 || data.temp < 5) score -= 20;
  score = Math.max(10, score);
  document.getElementById('scoreNumber').textContent = score;
  const ring = document.getElementById('scoreRingFill');
  ring.setAttribute('stroke-dasharray', `${score}, 100`);
  ring.style.stroke = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
}

function updateTimeInfo(data) {
  const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
  const local = new Date(utc + (data.timezone * 1000));
  document.getElementById('localTime').textContent = local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// [Search & Recent Searches]
function addRecentSearch(city) {
  let recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  recent = [city, ...recent.filter(c => c !== city)].slice(0, 4);
  localStorage.setItem('recentSearches', JSON.stringify(recent));
  renderRecent();
}

function renderRecent() {
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  const list = document.getElementById('recentList');
  if (recent.length > 0) {
    document.getElementById('recentSearches').classList.remove('hidden');
    list.innerHTML = recent.map(c => `<button class="recent-chip" onclick="quickSearch('${c}')">${c}</button>`).join('');
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  animatePlaceholder();
  renderRecent();
  lucide.createIcons();
  
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
});

// [Rest of existing Modal, Favorite, and Event Listener logic remains unchanged]
function showLoading() { loadingSpinner.classList.remove('hidden'); resultsSection.classList.add('hidden'); }
function hideLoading() { loadingSpinner.classList.add('hidden'); }
function hideError() { errorMsg.classList.add('hidden'); }

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchCityData(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// [Autocomplete functionality]
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
let debounceTimer;

// Debounced input listener for autocomplete
cityInput?.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  
  // Clear existing timer
  clearTimeout(debounceTimer);
  
  // Hide dropdown if less than 2 characters
  if (value.length < 2) {
    autocompleteDropdown?.classList.add('hidden');
    return;
  }
  
  // Debounce for 300ms
  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://tripsense-weather.jatinrahinj2006.workers.dev?endpoint=geo&params=q=${encodeURIComponent(value)}%26limit=5`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        renderAutocomplete(data);
      } else {
        autocompleteDropdown?.classList.add('hidden');
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
    }
  }, 300);
});

// Render autocomplete suggestions
function renderAutocomplete(cities) {
  if (!autocompleteDropdown) return;
  
  autocompleteDropdown.innerHTML = cities.map(city => `
    <div class="autocomplete-item" data-city="${city.name}" data-country="${city.country}">
      <i data-lucide="map-pin" style="width:14px;height:14px;color:var(--primary)"></i>
      <span>${city.name}</span>
      <span class="item-country">${city.country}</span>
    </div>
  `).join('');
  
  // Re-initialize icons for new elements
  if (window.lucide) lucide.createIcons({ el: autocompleteDropdown });
  
  autocompleteDropdown.classList.remove('hidden');
  
  // Add click handlers to items
  autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const cityName = item.getAttribute('data-city');
      cityInput.value = cityName;
      autocompleteDropdown.classList.add('hidden');
      searchBtn.click();
    });
  });
}

// Hide on blur with delay
cityInput?.addEventListener('blur', () => {
  setTimeout(() => {
    autocompleteDropdown?.classList.add('hidden');
  }, 150);
});

// Hide on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    autocompleteDropdown?.classList.add('hidden');
  }
});

// [Modal & Favorites Event Listeners]
closeModal?.addEventListener('click', () => cityModal.classList.add('hidden'));
closeFavModal?.addEventListener('click', () => favoritesModal.classList.add('hidden'));
closeShareModal?.addEventListener('click', () => shareModal.classList.add('hidden'));

cityModal?.addEventListener('click', (e) => { if (e.target === cityModal) cityModal.classList.add('hidden'); });
favoritesModal?.addEventListener('click', (e) => { if (e.target === favoritesModal) favoritesModal.classList.add('hidden'); });
shareModal?.addEventListener('click', (e) => { if (e.target === shareModal) shareModal.classList.add('hidden'); });

// Favorites functionality
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

function updateFavCount() {
  favCount.textContent = favorites.length;
  favCount.classList.toggle('hidden', favorites.length === 0);
}

function renderFavorites() {
  if (!favoritesList) return;
  if (favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="empty-favorites">
        <i data-lucide="heart"></i>
        <p>No favorite cities yet. Click the heart icon to add some!</p>
      </div>
    `;
  } else {
    favoritesList.innerHTML = favorites.map(city => `
      <div class="favorite-item" data-city="${city}">
        <div class="favorite-info">
          <div class="favorite-name">${city}</div>
        </div>
        <button class="remove-fav-btn" onclick="removeFavorite('${city}')">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `).join('');
  }
  lucide.createIcons();
}

window.removeFavorite = function(city) {
  favorites = favorites.filter(c => c !== city);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavCount();
  renderFavorites();
};

favoriteBtn?.addEventListener('click', () => {
  if (!currentCityData) return;
  const city = currentCityData.city;
  if (favorites.includes(city)) {
    favorites = favorites.filter(c => c !== city);
    showToast(`${city} removed from favorites`, 'info');
  } else {
    favorites.push(city);
    showToast(`${city} added to favorites!`, 'success');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavCount();
  favoriteBtn.classList.toggle('active', favorites.includes(city));
});

favoritesBtn?.addEventListener('click', () => {
  renderFavorites();
  favoritesModal.classList.remove('hidden');
  lucide.createIcons();
});

// Share functionality
shareBtn?.addEventListener('click', () => {
  if (!currentCityData) return;
  shareModal.classList.remove('hidden');
  lucide.createIcons();
});

document.getElementById('shareWhatsApp')?.addEventListener('click', () => {
  if (!currentCityData) return;
  const text = `Check out ${currentCityData.city} on TripSense! Temperature: ${currentCityData.temp}°C, Air Quality: ${currentCityData.aqi}/5`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
});

document.getElementById('shareTwitter')?.addEventListener('click', () => {
  if (!currentCityData) return;
  const text = `Exploring ${currentCityData.city} via TripSense! 🌤️ ${currentCityData.temp}°C | Air Quality: ${currentCityData.aqi}/5`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
});

document.getElementById('shareFacebook')?.addEventListener('click', () => {
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
});

document.getElementById('shareCopy')?.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const success = document.getElementById('shareSuccess');
    success.classList.remove('hidden');
    setTimeout(() => success.classList.add('hidden'), 2000);
  });
});

// Quick search from destination cards
window.quickSearch = function(city) {
  cityInput.value = city;
  searchBtn.click();
};

// Scroll to top
window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Initialize favorites count
updateFavCount();

// Dark Mode Toggle
darkModeBtn?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  const icon = darkModeBtn.querySelector('i');
  if (icon) {
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
  }
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
});

// Restore dark mode preference on load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  const icon = darkModeBtn?.querySelector('i');
  if (icon) icon.setAttribute('data-lucide', 'sun');
}