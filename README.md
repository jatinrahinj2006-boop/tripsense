# 🌍 TripSense - Intelligent Travel Companion

TripSense is a modern, responsive travel planning web application that provides real-time weather insights, air quality monitoring, destination recommendations, and AI-powered travel assistance.

![TripSense Preview](tripsense.png)

## ✨ Features

### 🌤️ Real-Time Weather & Air Quality
- Live weather data with temperature, humidity, wind speed, and conditions
- UV Index monitoring with safety recommendations
- Air Quality Index (AQI) with health advisories
- 5-day weather forecast with "feels like" temperatures

### 🗺️ Smart Destination Discovery
- Region-based destination recommendations
- Dynamic destination cards with Unsplash imagery
- Smart city matching algorithm for accurate search results
- Google Maps integration for location visualization

### 🏨 Hotel Booking Integration
- Featured Booking.com card with prominent CTA
- Quick access to Agoda, Airbnb, and Hotels.com
- Dynamic search links based on selected city

### 🤖 AI Travel Assistant (TripSense AI)
- Powered by Groq · Llama 3.1 via Cloudflare Worker proxy
- Context-aware responses using current weather data
- Smart suggestions for itineraries, packing, and local tips
- Dark mode compatible glassmorphism UI

### 🎨 Modern UI/UX
- Glassmorphism design with backdrop blur effects
- Dark/Light mode toggle with smooth transitions
- Responsive layout for mobile, tablet, and desktop
- Animated elements with CSS transitions and keyframes
- Typing placeholder animation in search box

### 🔧 Additional Features
- Recent search history with localStorage persistence
- Favorites system for saving preferred destinations
- Travel score calculator based on weather conditions
- Traveler rating strip with deterministic scoring
- Autocomplete city search with debouncing
- Toast notifications for user feedback
- Share functionality for trip details

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic markup |
| **CSS3** | Modern styling with CSS variables, Grid, Flexbox |
| **Vanilla JavaScript** | Core application logic |
| **OpenWeatherMap API** | Weather, AQI, UV Index, Geocoding |
| **Groq API (via Worker)** | AI chatbot responses |
| **Google Maps Embed** | Location visualization |
| **Lucide Icons** | Modern iconography |
| **Unsplash** | High-quality destination images |

## 📁 Project Structure

```
Tripsense/
├── index.html          # Main application file
├── style.css           # All styling with dark mode support
├── script.js           # Core application logic
├── chatbot.js          # AI assistant functionality
├── enhancements.js     # Additional UI enhancements
├── tripsense-logo.png  # Brand logo
├── tripsense.png       # Hero/preview image
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenWeatherMap API key (free tier available)

### Setup Instructions

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/yourusername/tripsense.git
   cd tripsense
   ```

2. **Get an OpenWeatherMap API Key**
   - Visit [openweathermap.org](https://openweathermap.org)
   - Create a free account
   - Navigate to API keys section
   - Copy your API key

3. **Configure the API Key**
   Open `script.js` and replace the placeholder API key:
   ```javascript
   const apiKey = "your_openweathermap_api_key_here";
   ```

4. **(Optional) Set up Cloudflare Worker for AI**
   The chatbot uses a Cloudflare Worker to securely proxy Groq API requests. If you want to use your own:
   - Create a Cloudflare Worker
   - Add your Groq API key as a secret
   - Update the URL in `chatbot.js`

5. **Run the application**
   - Open `index.html` in a web browser
   - Or use a local server:
     ```bash
     npx serve .
     # or
     python -m http.server 8080
     ```

## 📝 API Usage

### OpenWeatherMap APIs Used
- **Geocoding API** - Convert city names to coordinates
- **Current Weather API** - Real-time weather data
- **Air Pollution API** - AQI monitoring
- **5-Day Forecast API** - Weather predictions
- **UV Index API** - UV radiation levels

### Rate Limits
- OpenWeatherMap Free: 60 calls/minute, 1M calls/month
- Groq API (via Worker): 20 requests/minute, 1.5M tokens/day

## 🎨 Customization

### Color Scheme
CSS variables are defined in `:root` and `body.dark`:
```css
:root {
  --primary: #0891b2;
  --primary-light: #cffafe;
  --primary-dark: #164e63;
  /* ... more variables */
}
```

### Adding New Destinations
Edit the `cityDatabase` object in `script.js`:
```javascript
const cityDatabase = {
  india: [
    { name: 'YourCity', imageUrl: 'https://...', tag: 'TAG' }
  ]
};
```

## 🔒 Security Notes

- API keys are client-side (acceptable for demo/learning projects)
- For production, implement a backend proxy
- The chatbot uses a Cloudflare Worker to hide the Groq API key
- Never commit real API keys to public repositories

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## 📱 Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile | < 480px | Single column, stacked layout |
| Tablet | 480px - 768px | 2-column grids |
| Desktop | > 768px | Full layout, 3-column grids |

## 🚧 Known Limitations

- API calls require internet connection
- Search suggestions limited to OpenWeatherMap geocoding results
- Chatbot responses depend on Groq API availability
- Destination images loaded from external Unsplash URLs

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional language support
- More destination databases
- Offline functionality with service workers
- PWA capabilities
- Additional weather data sources

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🙏 Credits

- Weather data: [OpenWeatherMap](https://openweathermap.org)
- AI responses: [Groq](https://groq.com) · Llama 3.1
- Icons: [Lucide](https://lucide.dev)
- Images: [Unsplash](https://unsplash.com)
- Fonts: [Google Fonts](https://fonts.google.com)

---

**TripSense** — Breathing data into life 🌱
