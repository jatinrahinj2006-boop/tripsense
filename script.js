
const apiKey = "ea0fca7e491fa7f02d2db5d62c66f187";
let userLocation = "Pune";
let currentCityData = null;


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


document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  detectUserLocation();
  updateFavoritesCount();
  
  
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    updateDarkModeIcon();
  }
});


async function detectUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`);
        const geoData = await res.json();
        if (geoData.length) {
          userLocation = geoData[0].name;
        }
      } catch (err) {
        console.log('Could not detect location');
      }
    });
  }
}


async function useMyLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  showLoading();
  hideError();

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`);
      const geoData = await res.json();
      
      if (geoData.length) {
        const cityData = {
          name: geoData[0].name,
          country: geoData[0].country,
          state: geoData[0].state || null,
          lat: latitude,
          lon: longitude
        };
        await fetchWeatherData(cityData);
      } else {
        showError('Could not determine your location');
        hideLoading();
      }
    } catch (err) {
      showError('Error getting your location');
      hideLoading();
    }
  }, (error) => {
    showError('Please enable location permissions');
    hideLoading();
  });
}


const bestTimeData = {
  'bali': { months: 'April - October', reason: 'Dry season with clear skies and low humidity' },
  'paris': { months: 'April - June, Sep - Oct', reason: 'Pleasant weather, fewer tourists, good air quality' },
  'tokyo': { months: 'March - May, Oct - Nov', reason: 'Cherry blossoms in spring, mild autumn weather' },
  'dubai': { months: 'November - March', reason: 'Cooler temperatures, less humidity' },
  'london': { months: 'May - September', reason: 'Warmest months with longer daylight hours' },
  'new york': { months: 'April - June, Sep - Nov', reason: 'Mild weather, beautiful foliage in fall' },
  'mumbai': { months: 'November - February', reason: 'Cool and dry winter season' },
  'delhi': { months: 'October - March', reason: 'Pleasant winter weather, avoid summer heat' },
  'goa': { months: 'November - February', reason: 'Perfect beach weather, less humidity' },
  'singapore': { months: 'February - April', reason: 'Less rainfall, pleasant temperatures' },
  'bangkok': { months: 'November - February', reason: 'Cool and dry season' },
  'sydney': { months: 'September - November', reason: 'Spring weather, warm and pleasant' },
  'rome': { months: 'April - June, Sep - Oct', reason: 'Mild weather, fewer crowds' },
  'barcelona': { months: 'May - June, Sep - Oct', reason: 'Perfect beach weather, less crowded' },
  'amsterdam': { months: 'April - May, Sep - Oct', reason: 'Tulip season in spring, pleasant fall' },
  'moscow': { months: 'May - September', reason: 'Warm summer, avoid harsh winters' },
  'beijing': { months: 'September - October', reason: 'Clear skies, pleasant temperatures' },
  'jakarta': { months: 'May - September', reason: 'Dry season with less humidity' }
};

const countryCapitals = {
  'russia': { city: 'Moscow', country: 'RU', displayName: 'Russia (Country)' },
  'india': { city: 'New Delhi', country: 'IN', displayName: 'India (Country)' },
  'indonesia': { city: 'Jakarta', country: 'ID', displayName: 'Indonesia (Country)' },
  'china': { city: 'Beijing', country: 'CN', displayName: 'China (Country)' },
  'usa': { city: 'New York', country: 'US', displayName: 'United States (Country)' },
  'united states': { city: 'New York', country: 'US', displayName: 'United States (Country)' },
  'japan': { city: 'Tokyo', country: 'JP', displayName: 'Japan (Country)' },
  'france': { city: 'Paris', country: 'FR', displayName: 'France (Country)' },
  'germany': { city: 'Berlin', country: 'DE', displayName: 'Germany (Country)' },
  'uk': { city: 'London', country: 'GB', displayName: 'United Kingdom (Country)' },
  'united kingdom': { city: 'London', country: 'GB', displayName: 'United Kingdom (Country)' },
  'italy': { city: 'Rome', country: 'IT', displayName: 'Italy (Country)' },
  'spain': { city: 'Madrid', country: 'ES', displayName: 'Spain (Country)' },
  'australia': { city: 'Sydney', country: 'AU', displayName: 'Australia (Country)' },
  'canada': { city: 'Toronto', country: 'CA', displayName: 'Canada (Country)' },
  'brazil': { city: 'São Paulo', country: 'BR', displayName: 'Brazil (Country)' },
  'mexico': { city: 'Mexico City', country: 'MX', displayName: 'Mexico (Country)' },
  'thailand': { city: 'Bangkok', country: 'TH', displayName: 'Thailand (Country)' },
  'singapore': { city: 'Singapore', country: 'SG', displayName: 'Singapore (Country)' },
  'uae': { city: 'Dubai', country: 'AE', displayName: 'UAE (Country)' },
  'south korea': { city: 'Seoul', country: 'KR', displayName: 'South Korea (Country)' },
  'turkey': { city: 'Istanbul', country: 'TR', displayName: 'Turkey (Country)' },
  'egypt': { city: 'Cairo', country: 'EG', displayName: 'Egypt (Country)' },
  'south africa': { city: 'Cape Town', country: 'ZA', displayName: 'South Africa (Country)' }
};

function getBestTime(cityName) {
  const cityLower = cityName.toLowerCase();
  return bestTimeData[cityLower] || {
    months: 'Spring & Fall',
    reason: 'Generally pleasant weather with moderate temperatures'
  };
}

function getAQIColor(aqi) {
  const colors = ['#10b981', '#fbbf24', '#f97316', '#ef4444', '#7c3aed'];
  return colors[aqi - 1] || '#6b7280';
}

function getAQILabel(aqi) {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  return labels[aqi - 1] || 'Unknown';
}

function getHealthRecommendation(aqi) {
  const recommendations = [
    '🌟 Perfect air quality! Great day for outdoor activities.',
    '✅ Air quality is acceptable. Enjoy your outdoor plans!',
    '⚠️ Sensitive groups should limit prolonged outdoor exposure.',
    '🚨 Unhealthy air. Avoid outdoor activities if possible.',
    '☠️ Hazardous! Stay indoors and use air purifiers.'
  ];
  return recommendations[aqi - 1] || 'No data available';
}


async function fetchCityData(cityName) {
  if (!cityName.trim()) return;

  showLoading();
  hideError();
  hideResults();
  hideModal();

  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=10&appid=${apiKey}`);
    const geoData = await geoRes.json();

    if (!geoData.length) {
      showError('City not found. Try another one!');
      hideLoading();
      return;
    }

    if (geoData.length > 1) {
      hideLoading();
      showCityChoices(geoData);
      return;
    }

    await fetchWeatherData(geoData[0]);

  } catch (err) {
    showError('Error fetching data. Please try again!');
    hideLoading();
    console.error(err);
  }
}


function showCityChoices(cities) {
  cityChoices.innerHTML = '';
  
  const searchTerm = cityInput.value.trim().toLowerCase();
  const countryMatch = countryCapitals[searchTerm];
  
  if (countryMatch) {
    const countryOption = document.createElement('div');
    countryOption.className = 'city-option country-option';
    
    countryOption.innerHTML = `
      <i data-lucide="globe"></i>
      <div class="city-info">
        <div class="city-name">${countryMatch.displayName}</div>
        <div class="city-location">Capital: ${countryMatch.city}</div>
      </div>
    `;
    
    countryOption.addEventListener('click', async () => {
      hideModal();
      showLoading();
      
      const capitalData = {
        name: countryMatch.city,
        country: countryMatch.country,
        state: null,
        lat: null,
        lon: null
      };
      
      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${countryMatch.city},${countryMatch.country}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();
        if (geoData.length) {
          capitalData.lat = geoData[0].lat;
          capitalData.lon = geoData[0].lon;
          await fetchWeatherData(capitalData);
        }
      } catch (err) {
        showError('Error fetching country data');
        hideLoading();
      }
    });
    
    cityChoices.appendChild(countryOption);
  }
  
  cities.forEach((city) => {
    const option = document.createElement('div');
    option.className = 'city-option';
    
    let locationText = city.name;
    if (city.state && city.country === 'US') {
      locationText += `, ${city.state}, ${city.country}`;
    } else if (city.state) {
      locationText += `, ${city.state}, ${city.country}`;
    } else {
      locationText += `, ${city.country}`;
    }
    
    option.innerHTML = `
      <i data-lucide="map-pin"></i>
      <div class="city-info">
        <div class="city-name">${city.name}</div>
        <div class="city-location">${locationText}</div>
      </div>
    `;
    
    option.addEventListener('click', async () => {
      hideModal();
      showLoading();
      await fetchWeatherData(city);
    });
    
    cityChoices.appendChild(option);
  });
  
  lucide.createIcons();
  showModal();
}


async function fetchWeatherData(cityData) {
  try {
    const { lat, lon, name, country, state } = cityData;

    const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const aqiData = await aqiRes.json();
    const aqi = aqiData.list[0].main.aqi;

    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const forecastData = await forecastRes.json();
    const dailyForecast = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5);

    const bestTime = getBestTime(name);

    currentCityData = {
      city: name,
      country: country,
      state: state || null,
      aqi,
      temp: Math.round(weatherData.main.temp),
      feelsLike: Math.round(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      bestTime,
      forecast: dailyForecast
    };

    displayResults(currentCityData);
    hideLoading();
    showResults();

  } catch (err) {
    showError('Error fetching weather data. Please try again!');
    hideLoading();
    console.error(err);
  }
}


function displayResults(data) {
  let cityDisplay = data.city;
  
  if (data.country === 'US' && data.state && data.city.length < 10) {
    cityDisplay = `${data.city}, ${data.state}`;
  } else if (data.country !== 'US') {
    cityDisplay = `${data.city}, ${data.country}`;
  }
  
  document.getElementById('cityName').textContent = cityDisplay;
  document.getElementById('weatherDesc').textContent = data.description;
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@4x.png`;

  const aqiValue = document.getElementById('aqiValue');
  aqiValue.textContent = data.aqi;
  aqiValue.style.color = getAQIColor(data.aqi);
  
  const aqiLabel = document.getElementById('aqiLabel');
  aqiLabel.textContent = getAQILabel(data.aqi);
  aqiLabel.style.color = getAQIColor(data.aqi);

  document.getElementById('tempValue').textContent = `${data.temp}°C`;
  document.getElementById('feelsLike').textContent = `Feels like ${data.feelsLike}°C`;

  document.getElementById('humidityValue').textContent = `${data.humidity}%`;
  document.getElementById('windSpeed').textContent = `Wind: ${data.windSpeed} m/s`;

  document.getElementById('bestMonth').textContent = data.bestTime.months;
  document.getElementById('bestReason').textContent = data.bestTime.reason;

  document.getElementById('healthRec').textContent = getHealthRecommendation(data.aqi);

  const forecastGrid = document.getElementById('forecastGrid');
  forecastGrid.innerHTML = '';
  
  data.forecast.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="weather" class="forecast-icon">
      <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
      <div class="forecast-desc">${day.weather[0].description}</div>
    `;
    forecastGrid.appendChild(forecastItem);
  });

  document.getElementById('flightTitle').textContent = `Ready to Visit ${data.city}?`;
  const flightLink = document.getElementById('flightLink');
  
  
  const origin = encodeURIComponent(userLocation);
  const destination = encodeURIComponent(data.city);
  flightLink.href = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`;
  flightLink.textContent = `Search Flights from ${userLocation} →`;

  
  updateFavoriteButton();
  
  
  displayBookingPlatforms(data.city);
}


function displayBookingPlatforms(cityName) {
  const platformGrid = document.getElementById('platformGrid');
  const cityEncoded = encodeURIComponent(cityName);
  
  const platforms = [
    { 
      name: '🏠 Airbnb', 
      deepLink: `airbnb://s?location=${cityEncoded}`, 
      webLink: `https://www.airbnb.com/s/${cityEncoded}/homes`
    },
    { 
      name: '✈️ MakeMyTrip', 
      deepLink: `makemytrip://hotels?city=${cityEncoded}`, 
      webLink: `https://www.makemytrip.com/hotels/hotel-listing/?city=${cityEncoded}`
    },
    { 
      name: '🏨 Booking.com', 
      deepLink: `booking://search?city=${cityEncoded}`, 
      webLink: `https://www.booking.com/searchresults.html?ss=${cityEncoded}`
    },
    { 
      name: '🌟 Agoda', 
      deepLink: `agoda://hotel/search?city=${cityEncoded}`, 
      webLink: `https://www.agoda.com/search?city=${cityEncoded}`
    },
    { 
      name: '🛏️ OYO', 
      deepLink: `oyo://search?city=${cityEncoded}`, 
      webLink: `https://www.oyorooms.com/search/?location=${cityEncoded}`
    }
  ];
  
  platformGrid.innerHTML = platforms.map(platform => `
    <a href="${platform.deepLink}" 
       onclick="event.preventDefault(); openPlatform('${platform.deepLink}', '${platform.webLink}');"
       class="platform-btn">
      ${platform.name}
    </a>
  `).join('');
  
  lucide.createIcons();
}

function openPlatform(deepLink, webLink) {
  
  const start = Date.now();
  window.location.href = deepLink;
  
  
  setTimeout(() => {
    
    if (Date.now() - start < 2000) {
      window.open(webLink, '_blank');
    }
  }, 1500);
}


function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoritesCount();
}

function updateFavoritesCount() {
  const favorites = getFavorites();
  const count = favorites.length;
  
  if (count > 0) {
    favCount.textContent = count;
    favCount.classList.remove('hidden');
  } else {
    favCount.classList.add('hidden');
  }
}

function isFavorite(cityName) {
  const favorites = getFavorites();
  return favorites.some(fav => fav.city === cityName);
}

function updateFavoriteButton() {
  if (!currentCityData) return;
  
  if (isFavorite(currentCityData.city)) {
    favoriteBtn.classList.add('active');
  } else {
    favoriteBtn.classList.remove('active');
  }
  lucide.createIcons();
}

function toggleFavorite() {
  if (!currentCityData) return;
  
  const favorites = getFavorites();
  const cityName = currentCityData.city;
  const index = favorites.findIndex(fav => fav.city === cityName);
  
  if (index > -1) {
    
    favorites.splice(index, 1);
  } else {
    
    if (favorites.length >= 10) {
      showError('Maximum 10 favorite cities allowed!');
      return;
    }
    favorites.push({
      city: cityName,
      country: currentCityData.country
    });
  }
  
  saveFavorites(favorites);
  updateFavoriteButton();
}

function showFavorites() {
  const favorites = getFavorites();
  favoritesList.innerHTML = '';
  
  if (favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="empty-favorites">
        <i data-lucide="heart" style="width: 64px; height: 64px;"></i>
        <p>No favorite cities yet!</p>
        <p>Click the ❤️ button on any city to save it here.</p>
      </div>
    `;
  } else {
    favorites.forEach(fav => {
      const item = document.createElement('div');
      item.className = 'favorite-item';
      item.innerHTML = `
        <div class="favorite-info">
          <div class="favorite-name">${fav.city}, ${fav.country}</div>
        </div>
        <button class="remove-fav-btn" onclick="removeFavorite('${fav.city}')">
          <i data-lucide="trash-2"></i>
        </button>
      `;
      
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-fav-btn')) {
          hideAllModals();
          fetchCityData(fav.city);
        }
      });
      
      favoritesList.appendChild(item);
    });
  }
  
  lucide.createIcons();
  favoritesModal.classList.remove('hidden');
}

function removeFavorite(cityName) {
  const favorites = getFavorites();
  const filtered = favorites.filter(fav => fav.city !== cityName);
  saveFavorites(filtered);
  showFavorites();
  updateFavoriteButton();
}


function shareCity() {
  if (!currentCityData) return;
  
  shareModal.classList.remove('hidden');
  document.getElementById('shareSuccess').classList.add('hidden');
}

function getShareText() {
  if (!currentCityData) return '';
  
  return `Check out ${currentCityData.city}! 🌍\n\n` +
         `🌡️ Temperature: ${currentCityData.temp}°C\n` +
         `💨 Air Quality: ${getAQILabel(currentCityData.aqi)}\n` +
         `📅 Best Time: ${currentCityData.bestTime.months}\n\n` +
         `Plan your trip with AirSense!`;
}

function shareToWhatsApp() {
  const text = encodeURIComponent(getShareText());
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareToTwitter() {
  const text = encodeURIComponent(getShareText());
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function shareToFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function copyLink() {
  const text = getShareText() + '\n' + window.location.href;
  
  navigator.clipboard.writeText(text).then(() => {
    document.getElementById('shareSuccess').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('shareSuccess').classList.add('hidden');
    }, 3000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}


function showLoading() {
  loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
  loadingSpinner.classList.add('hidden');
}

function showResults() {
  resultsSection.classList.remove('hidden');
}

function hideResults() {
  resultsSection.classList.add('hidden');
}

function showError(message) {
  errorText.textContent = message;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function showModal() {
  cityModal.classList.remove('hidden');
}

function hideModal() {
  cityModal.classList.add('hidden');
}

function hideAllModals() {
  cityModal.classList.add('hidden');
  favoritesModal.classList.add('hidden');
  shareModal.classList.add('hidden');
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  updateDarkModeIcon();
}

function updateDarkModeIcon() {
  const isDark = document.body.classList.contains('dark');
  darkModeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  lucide.createIcons();
}


searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchCityData(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchCityData(city);
  }
});

locationBtn.addEventListener('click', useMyLocation);
darkModeBtn.addEventListener('click', toggleDarkMode);
favoritesBtn.addEventListener('click', showFavorites);
favoriteBtn.addEventListener('click', toggleFavorite);
shareBtn.addEventListener('click', shareCity);

closeModal.addEventListener('click', hideModal);
closeFavModal.addEventListener('click', () => favoritesModal.classList.add('hidden'));
closeShareModal.addEventListener('click', () => shareModal.classList.add('hidden'));


cityModal.addEventListener('click', (e) => {
  if (e.target === cityModal) hideModal();
});
favoritesModal.addEventListener('click', (e) => {
  if (e.target === favoritesModal) favoritesModal.classList.add('hidden');
});
shareModal.addEventListener('click', (e) => {
  if (e.target === shareModal) shareModal.classList.add('hidden');
});


document.getElementById('shareWhatsApp').addEventListener('click', shareToWhatsApp);
document.getElementById('shareTwitter').addEventListener('click', shareToTwitter);
document.getElementById('shareFacebook').addEventListener('click', shareToFacebook);
document.getElementById('shareCopy').addEventListener('click', copyLink);