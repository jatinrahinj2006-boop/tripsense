/* ============================================================
   TripSense AI Chatbot - Powered by Groq · Llama 3.1
   ============================================================ */

class TripSenseAI {
  constructor() {
    this.messagesContainer = document.getElementById('chatbotMessages');
    this.input = document.getElementById('chatbotInput');
    this.sendBtn = document.getElementById('chatbotSend');
    this.toggleBtn = document.getElementById('chatbotToggle');
    this.container = document.getElementById('chatbotContainer');
    this.closeBtn = document.getElementById('chatbotClose');
    this.clearBtn = document.getElementById('chatbotClear');
    
    this.conversationHistory = [];
    this.isProcessing = false;
    
    this.init();
  }
  
  init() {
    // Event listeners
    this.toggleBtn?.addEventListener('click', () => this.toggleChat());
    this.closeBtn?.addEventListener('click', () => this.closeChat());
    this.clearBtn?.addEventListener('click', () => this.clearConversation());
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    
    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.container.classList.contains('hidden')) {
        this.closeChat();
      }
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.closeChat();
      }
    });
    
    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
  }
  
  toggleChat() {
    const isHidden = this.container.classList.contains('hidden');
    
    if (isHidden) {
      this.container.classList.remove('hidden');
      this.toggleBtn.style.transform = 'scale(0)';
      setTimeout(() => {
        this.input?.focus();
        this.scrollToBottom();
      }, 100);
    } else {
      this.closeChat();
    }
  }
  
  closeChat() {
    this.container.classList.add('hidden');
    this.toggleBtn.style.transform = 'scale(1)';
  }
  
  async sendMessage(messageText = null) {
    if (this.isProcessing) return;
    
    const text = messageText || this.input?.value?.trim();
    if (!text) return;
    
    // Clear input if manually typed
    if (!messageText && this.input) {
      this.input.value = '';
    }
    
    // Add user message to UI
    this.addMessage(text, 'user');
    
    // Show typing indicator
    this.showTypingIndicator();
    
    this.isProcessing = true;
    
    try {
      const response = await this.getAIResponse(text);
      this.hideTypingIndicator();
      this.addMessage(response, 'bot');
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please make sure you\'ve added your Groq API key in the chatbot.js file, or try again later.', 'bot', true);
      console.error('Chatbot error:', error);
    } finally {
      this.isProcessing = false;
      this.scrollToBottom();
    }
  }
  
  async getAIResponse(userMessage) {
    // Get current city context from the website
    const currentCity = window.currentCityData;
    const cityContext = currentCity ? 
      `Current location context: ${currentCity.city}, ${currentCity.country}. ` +
      `Temperature: ${currentCity.temp}°C, Humidity: ${currentCity.humidity}%, ` +
      `Air Quality Index: ${currentCity.aqi}/5, Wind: ${currentCity.windSpeed} m/s, ` +
      `Weather: ${currentCity.description}.` : 
      'No specific location is currently being viewed.';
    
    const systemPrompt = `You are TripSense AI, an expert travel assistant integrated into the TripSense travel website. 

${cityContext}

Your role is to help users with:
- Trip planning and itinerary creation
- Weather and climate information
- Best times to visit destinations
- Local attractions and things to do
- Packing recommendations based on weather
- Travel tips and advice
- Location comparisons
- Air quality and health recommendations for travelers

Keep responses friendly, concise (2-4 paragraphs max), and actionable. Use emojis occasionally to be engaging. If the user asks about the current location, reference the weather and conditions provided above. If recommending new destinations, consider weather patterns and seasonal factors.

Format your responses with:
- Short paragraphs
- Bullet points for lists
- Bold text for important information
- Emojis where appropriate`;

    try {
      console.log('Making AI request via proxy...');
      
      const response = await fetch('https://tripsense-proxy.jatinrahinj2006.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Groq's fast, cost-effective model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.9,
        })
      });
      
      // Handle rate limiting (429)
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED: Too many requests. Please wait a moment and try again.');
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Groq API Error Response:', errorData);
          errorMessage = errorData.error?.message || errorData.error?.type || `HTTP ${response.status}: ${response.statusText}`;
        } catch (parseErr) {
          console.error('Could not parse error response:', parseErr);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Unexpected response format');
      }
      
    } catch (error) {
      console.error('Groq API error:', error);
      
      // Check for specific API errors
      const errorMsg = error.message || '';
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RATE_LIMIT') || errorMsg.includes('Too many requests') || errorMsg.includes('rate limit');
      const isApiKeyError = errorMsg.includes('Authentication') || errorMsg.includes('auth') || errorMsg.includes('401') || errorMsg.includes('invalid token') || errorMsg.includes('invalid_api_key');
      const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('CORS') || errorMsg.includes('Failed to fetch');
      
      if (isRateLimit) {
        return '⏱️ **Rate Limit Reached**\n\nYou\'ve hit the rate limit for Groq API. This is common with the free tier.\n\n**Solutions:**\n• **Wait a few seconds** and try again\n• Groq free tier: 20 requests/minute, 1,500,000 tokens/day\n\nMeanwhile, here\'s what I can tell you:\n\n' + this.getMockResponse(userMessage);
      }
      
      if (isApiKeyError) {
        return '⚠️ **AI Service Issue**\n\nThere seems to be a problem connecting to the AI service.\n\n**Error:** `' + errorMsg + '`\n\nMeanwhile, here\'s a general response:\n\n' + this.getMockResponse(userMessage);
      }
      
      if (isNetworkError) {
        return '⚠️ **Connection Issue**\n\nCould not connect to Groq API. This might be due to:\n• Network connectivity issues\n• CORS restrictions (if testing locally without a server)\n• API service downtime\n\n**Error:** `' + errorMsg + '`\n\nMeanwhile, here\'s a general response:\n\n' + this.getMockResponse(userMessage);
      }
      
      // Show the actual error for debugging
      return '⚠️ **API Error Occurred**\n\n**Error:** `' + errorMsg + '`\n\nPlease check the browser console for more details. If this persists:\n• Verify your API key at [console.groq.com](https://console.groq.com)\n• Make sure the key starts with `gsk_`\n\nMeanwhile, here\'s a general response:\n\n' + this.getMockResponse(userMessage);
    }
  }
  
  getMockResponse(userMessage) {
    const currentCity = window.currentCityData;
    const cityName = currentCity?.city || 'this location';
    const temp = currentCity?.temp;
    const aqi = currentCity?.aqi;
    
    const message = userMessage.toLowerCase();
    
    // Smart fallback responses based on keywords
    if (message.includes('best time') || message.includes('when to visit')) {
      return `🌤️ **Best Time to Visit ${cityName}**\n\nBased on the current weather data${temp ? ` (${temp}°C)` : ''}, I'd recommend:\n\n• **Spring (March-May)** and **Fall (September-November)** typically offer the most pleasant weather\n• **Avoid peak summer** if temperatures exceed 35°C\n• **Check local festivals** - they can enhance your experience\n\nWould you like me to suggest specific months based on your preferences?`;
    }
    
    if (message.includes('pack') || message.includes('what to bring')) {
      let packing = '🎒 **Packing Suggestions**\n\n';
      
      if (temp > 30) {
        packing += 'Since it\'s hot there:\n• Light cotton clothing\n• Sunscreen (SPF 50+)\n• Sunglasses and hat\n• Water bottle\n• Comfortable sandals';
      } else if (temp < 15) {
        packing += 'Since it\'s cold there:\n• Warm layers and jacket\n• Thermals\n• Warm socks and boots\n• Gloves and scarf\n• Umbrella';
      } else {
        packing += 'For mild weather:\n• Light layers\n• Comfortable walking shoes\n• Light jacket for evenings\n• Sunscreen\n• Reusable water bottle';
      }
      
      if (aqi >= 3) {
        packing += '\n• **N95 masks** (recommended due to air quality)';
      }
      
      return packing;
    }
    
    if (message.includes('itinerary') || message.includes('plan') || message.includes('schedule')) {
      return `📅 **3-Day ${cityName} Itinerary**\n\n**Day 1: Arrival & Local Exploration**\n• Settle into your accommodation\n• Explore the local neighborhood\n• Try authentic local cuisine\n• Evening walk in a scenic area\n\n**Day 2: Main Attractions**\n• Visit top-rated landmarks\n• Cultural experiences (museums, temples, etc.)\n• Local market shopping\n• Sunset viewpoint\n\n**Day 3: Activities & Relaxation**\n• Adventure activity or day trip\n• Spa or wellness experience\n• Souvenir shopping\n• Farewell dinner\n\nWould you like me to customize this based on your interests?`;
    }
    
    if (message.includes('attraction') || message.includes('thing to do') || message.includes('sightseeing')) {
      return `📍 **Top Attractions in ${cityName}**\n\n• **Historical Sites** - Explore the rich heritage and architecture\n• **Local Markets** - Experience authentic culture and street food\n• **Natural Landmarks** - Parks, viewpoints, and scenic spots\n• **Cultural Centers** - Museums, galleries, and performance venues\n• **Shopping Districts** - From traditional crafts to modern malls\n\nI recommend checking local tourism websites for current events and opening hours.\n\nWant suggestions for a specific type of activity?`;
    }
    
    if (message.includes('weather') || message.includes('temperature') || message.includes('climate')) {
      if (currentCity) {
        return `🌤️ **Current Weather in ${cityName}**\n\n• **Temperature:** ${currentCity.temp}°C\n• **Humidity:** ${currentCity.humidity}%\n• **Conditions:** ${currentCity.description}\n• **Air Quality:** ${currentCity.aqi}/5\n• **Wind:** ${currentCity.windSpeed} m/s\n\n${currentCity.temp > 30 ? 'It\'s quite hot - stay hydrated! ☀️' : currentCity.temp < 15 ? 'It\'s chilly - pack warm clothes! ❄️' : 'Pleasant weather for exploring! 🌤️'}`;
      }
      return `🌤️ **Weather Information**\n\nPlease search for a location first using the search bar above, and I can provide specific weather details and recommendations!\n\nIn general, check the forecast before your trip and pack accordingly.`;
    }
    
    if (message.includes('air quality') || message.includes('pollution') || message.includes('aqi')) {
      if (currentCity) {
        const aqiLabels = { 1: 'Good ✅', 2: 'Fair 🟡', 3: 'Moderate 🟠', 4: 'Poor 🔴', 5: 'Very Poor ⚠️' };
        return `💨 **Air Quality in ${cityName}**\n\n**Current AQI: ${currentCity.aqi}/5** - ${aqiLabels[currentCity.aqi] || 'Unknown'}\n\n${currentCity.aqi <= 2 ? 'Air quality is good! Perfect for outdoor activities. 🌳' : currentCity.aqi === 3 ? 'Air quality is moderate. Sensitive individuals should limit prolonged outdoor exertion. 😷' : 'Air quality is poor. Consider wearing a mask and avoiding outdoor activities. ⚠️'}\n\n**Health Recommendations:**\n${currentCity.aqi >= 3 ? '• Wear N95 masks outdoors\n• Avoid strenuous outdoor exercise\n• Stay indoors during peak pollution hours' : '• Enjoy outdoor sightseeing\n• Visit parks and nature areas\n• Perfect time for walking tours'}`;
      }
    }
    
    if (message.includes('compare') || message.includes('difference between') || message.includes('vs')) {
      return `⚖️ **Comparing Destinations**\n\nUse the **Compare button** in the top navigation to compare two cities side-by-side!\n\nI can compare:\n• Temperature and weather\n• Air quality index\n• Humidity levels\n• Wind conditions\n\nThis helps you choose the best destination for your travel dates.`;
    }
    
    if (message.includes('recommend') || message.includes('suggest') || message.includes('where should i go')) {
      return `🌍 **Destination Recommendations**\n\nBased on popular preferences:\n\n**For Beach Lovers:**\n• Goa, Bali, Phuket, Maldives\n\n**For Culture & History:**\n• Rome, Kyoto, Istanbul, Cairo\n\n**For Nature & Adventure:**\n• Manali, Queenstown, Costa Rica\n\n**For City Experiences:**\n• Tokyo, New York, Paris, Singapore\n\nTell me your preferences (budget, interests, travel dates) for personalized suggestions!`;
    }
    
    if (message.includes('budget') || message.includes('cost') || message.includes('expensive') || message.includes('cheap')) {
      return `💰 **Budget Travel Tips**\n\n**Money-Saving Strategies:**\n• Book flights 2-3 months in advance\n• Use price comparison tools\n• Stay in hostels or vacation rentals\n• Eat at local restaurants, not tourist spots\n• Use public transportation\n• Travel during shoulder season\n\n**Free Activities:**\n• Walking tours\n• Public parks and beaches\n• Free museum days\n• Local festivals and events\n\nWant specific budget tips for a destination?`;
    }
    
    if (message.includes('flight') || message.includes('book')) {
      return `✈️ **Booking Your Trip**\n\nClick the **"Search Flights"** button in the results section to find flights powered by Google Flights!\n\n**Booking Tips:**\n• Clear browser cookies before searching\n• Use incognito mode for better prices\n• Be flexible with dates (±3 days)\n• Consider nearby airports\n• Set up price alerts\n\nFor hotels, check the "Find Your Perfect Stay" section with links to Booking.com, Agoda, Airbnb, and Hotels.com!`;
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `👋 Hello there! I'm your AI Trip Assistant!\n\nI can help you with:\n🏖️ Trip planning & itineraries\n🌤️ Weather & best time to visit\n📍 Location recommendations\n🎒 Packing suggestions\n✈️ Travel tips & advice\n\n${currentCity ? `I see you're looking at **${currentCity.city}**. Ask me anything about it!` : 'Search for a location above, or ask me general travel questions!'}`;
    }
    
    if (message.includes('thank')) {
      return `😊 You're very welcome!\n\nHappy travels! If you need more help with your trip planning, just ask. Safe journey! 🌍✈️`;
    }
    
    // Default response
    return `🤔 **That's an interesting question!**\n\nAs your travel assistant, I can help you with:\n\n• 🌤️ Weather information and best travel times\n• 📅 Creating itineraries and trip planning\n• 🎒 Packing recommendations\n• 📍 Local attractions and activities\n• 💨 Air quality and health advice\n• 🌍 Destination recommendations\n• 💰 Budget travel tips\n\nWhat would you like to know about ${currentCity ? `**${currentCity.city}**` : 'your next adventure'}?`;
  }
  
  addMessage(text, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'bot' ? '<i data-lucide="bot"></i>' : '<i data-lucide="user"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isError) {
      contentDiv.innerHTML = `<div class="chat-error">${text}</div>`;
    } else {
      // Convert markdown-like formatting to HTML
      let formattedText = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
        .replace(/`(.+?)`/g, '<code>$1</code>') // Code
        .replace(/\n\n/g, '</p><p>') // Paragraphs
        .replace(/\n/g, '<br>'); // Line breaks
      
      // Handle bullet lists
      if (formattedText.includes('•')) {
        formattedText = formattedText.replace(/•(.+?)(?=<br>|$)/g, '<li>$1</li>');
        formattedText = formattedText.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
      }
      
      contentDiv.innerHTML = `<p>${formattedText}</p>`;
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    this.messagesContainer.appendChild(messageDiv);
    
    // Initialize icons for new message
    if (window.lucide) {
      lucide.createIcons({ el: messageDiv });
    }
    
    this.scrollToBottom();
  }
  
  showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'chat-message bot-message typing-message';
    indicatorDiv.innerHTML = `
      <div class="message-avatar">
        <i data-lucide="bot"></i>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(indicatorDiv);
    
    if (window.lucide) {
      lucide.createIcons({ el: indicatorDiv });
    }
    
    this.scrollToBottom();
  }
  
  hideTypingIndicator() {
    const typingMessage = this.messagesContainer.querySelector('.typing-message');
    if (typingMessage) {
      typingMessage.remove();
    }
  }
  
  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 50);
  }
  
  clearConversation() {
    // Keep only the welcome message
    const welcomeMessage = this.messagesContainer.querySelector('.bot-message');
    this.messagesContainer.innerHTML = '';
    
    if (welcomeMessage) {
      this.messagesContainer.appendChild(welcomeMessage.cloneNode(true));
    }
    
    this.conversationHistory = [];
    
    // Re-initialize icons
    if (window.lucide) {
      lucide.createIcons({ el: this.messagesContainer });
    }
  }
}

// Global function for suggestion chips
function askAI(question) {
  const chatbot = window.tripSenseAI;
  if (chatbot) {
    chatbot.sendMessage(question);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.tripSenseAI = new TripSenseAI();
  
  // Re-initialize icons after chatbot loads
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Chatbot initialized
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ TripSense AI Chatbot', 'font-size: 16px; font-weight: bold; color: #10b981;');
  console.log('%cReady to help with your travel questions!', 'color: #64748b;');
});
