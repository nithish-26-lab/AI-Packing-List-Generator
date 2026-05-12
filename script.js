// State Machine for Chatbot
// ─── Casual Chat Knowledge Base ─────────────────────────────────────────────
const CASUAL_INTENTS = [
  {
    tag: "greeting",
    patterns: [/^(hi|hello|hey|hii|hlo|hola|howdy|yo|sup|what's up|wassup|namaste|good morning|good afternoon|good evening)/i],
    responses: [
      "Hey there! 👋 I'm Nexo, your AI travel buddy! So, where are we heading today? 🌍",
      "Hello! 😊 Great to see you! Tell me your destination and I'll plan your perfect trip! ✈️",
      "Hi! 🌟 I'm Nexo. Which city or country are you travelling to?"
    ]
  },
  {
    tag: "how_are_you",
    patterns: [/how are you|how r u|how do you do|how's it going|you good|u good/i],
    responses: [
      "I'm doing great, thanks for asking! 😄 How about you — how are you doing today?",
      "Feeling fantastic! 🚀 But more importantly, how are YOU doing? 😊",
      "I'm just a bot, but a cheerful one! 🤖 Hope you're having a wonderful day — how's everything on your end?"
    ]
  },
  {
    tag: "bot_identity",
    patterns: [/who are you|what are you|what is nexo|tell me about yourself|your name/i],
    responses: [
      "I'm Nexo 🤖 — your AI-powered travel packing assistant! I fetch live weather and build you a personalised packing list for any destination. Pretty cool, right? 😎",
      "Name's Nexo! ✈️ I help travellers pack smart by checking real-time weather and generating a custom packing list. Just tell me where you're headed!"
    ]
  },
  {
    tag: "capabilities",
    patterns: [/what can you do|how can you help|your features|capabilities|help me/i],
    responses: [
      "Here's what I can do for you 🎒<br><br>✅ Fetch <b>live weather</b> for any city<br>✅ Generate a <b>personalised packing list</b><br>✅ Give tips based on weather conditions<br><br>Just say something like <i>\"I'm going to Goa for 5 days\"</i> and I'll take care of the rest!",
      "I specialise in travel packing! 🌍 Tell me your destination and trip duration and I'll fetch the weather + build your perfect packing list."
    ]
  },
  {
    tag: "thanks",
    patterns: [/^(thanks|thank you|thx|ty|thankyou|many thanks|cheers)/i],
    responses: [
      "You're welcome! 😊 Happy to help. Need anything else?",
      "Anytime! ✈️ Safe travels!",
      "My pleasure! 🎒 Let me know if you need a packing list for anywhere."
    ]
  },
  {
    tag: "goodbye",
    patterns: [/^(bye|goodbye|see you|take care|later|cya|good night|good bye)/i],
    responses: [
      "Bye! Have an amazing trip ✈️ Come back anytime!",
      "See you soon! 👋 Safe travels!",
      "Goodbye! 🌍 Don't forget to pack smart!"
    ]
  },
  {
    tag: "compliment",
    patterns: [/you are (great|awesome|amazing|cool|good|the best)|good bot|nice bot/i],
    responses: [
      "Aww, thanks! 😊 You just made my circuits happy! 🤖",
      "That means a lot! 🌟 I'm here whenever you need travel help!"
    ]
  },
  {
    tag: "joke",
    patterns: [/tell me a joke|joke|make me laugh|something funny/i],
    responses: [
      "Why don't travellers ever starve? Because they can always find a <b>fork in the road!</b> 😄✈️",
      "What do you call a fish without eyes? A <b>fsh</b>! 😂 Anyway — planning any trips?",
      "I tried to write a joke about packing... but it was too heavy! 😄🎒"
    ]
  },
  {
    tag: "weather_casual",
    patterns: [/what.*weather|how.*weather|is it (hot|cold|raining|sunny|warm)/i],
    responses: [
      "Great question! Tell me which city you're curious about and I'll fetch the live weather for you! 🌤️",
      "I can check live weather for any city! 🌍 Just tell me where — like <i>\"What's the weather in Manali?\"</i>"
    ]
  },
  {
    tag: "bored",
    patterns: [/i am bored|i'm bored|nothing to do|bored/i],
    responses: [
      "Bored? Time to plan a trip! 🌍 Tell me a destination and I'll build you an exciting packing list!",
      "Boredom is just a sign you need an adventure! ✈️ Where do you want to go?"
    ]
  },
  {
    tag: "lonely",
    patterns: [/i am lonely|i feel lonely|feeling lonely|i'm alone/i],
    responses: [
      "Aw, I'm here for you! 😊 And hey — travelling is a great way to meet new people! Want to plan a trip?",
      "I may be a bot but I'm always here to chat! 🤖 Or better yet — plan a solo adventure! 🌍"
    ]
  }
];

// ── Gibberish / Random Input Detector ──────────────────────────────────────
function isGibberish(text) {
  const t = text.trim();

  // Too short (single char or 1-2 character inputs like "k", "2", "hh")
  if (t.length <= 2) return true;

  // Pure number(s) — e.g. "2", "123", "456"
  if (/^\d+$/.test(t)) return true;

  // Single repeated character — e.g. "aaaa", "kkkkk", "hhhh"
  if (/^(.)\1+$/.test(t)) return true;

  // No vowels at all in a word of length >= 4 — e.g. "bhhjjj", "kkksd", "zxcvb"
  if (t.length >= 4 && !/[aeiou]/i.test(t)) return true;

  // Very high ratio of consecutive repeated characters — e.g. "abccccde"
  const repeatedGroups = t.match(/(.)\1{2,}/g);
  if (repeatedGroups) {
    const repeatedChars = repeatedGroups.join('').length;
    if (repeatedChars / t.length > 0.5) return true;
  }

  // Mixed random characters — high consonant cluster density
  // Counts sequences of 4+ consonants in a row
  const consonantClusters = t.match(/[^aeiou\s\d]{4,}/gi);
  if (consonantClusters && consonantClusters.length > 0) {
    const clusterLen = consonantClusters.reduce((a, b) => a + b.length, 0);
    if (clusterLen / t.length > 0.65) return true;
  }

  return false;
}

// Detect if the user is asking about packing / trip planning
function detectPackingIntent(text) {
  const lower = text.toLowerCase();
  const packingKeywords = [
    /pack(ing)?.*list|what.*pack|what.*bring|what.*carry/i,
    /trip.*list|travel.*list|bag.*list/i,
    /going to|travelling to|traveling to|visiting|i want to go|i'm going|i am going|plan.*trip|plan.*travel/i,
    /packing.*for|prepare.*trip|what.*take.*trip/i,
    /destination.*pack|help.*pack/i
  ];
  return packingKeywords.some(rx => rx.test(lower));
}

// Extract destination from natural language like "I'm going to Goa"
function extractDestination(text) {
  const patterns = [
    /(?:going to|travelling to|traveling to|visiting|trip to|travel to|headed to|fly(?:ing)? to|i want to go to|i am going to|i'm going to)\s+([A-Za-z][\w\s]+?)(?:\s+for|\s+in|\.|,|$)/i,
    /(?:what.*pack.*for|packing.*for|list.*for)\s+([A-Za-z][\w\s]+?)(?:\s+for|\s+in|\.|,|$)/i
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1].trim();
  }
  return null;
}

// Extract duration from natural language like "5 days", "a week", "2 nights"
function extractDuration(text) {
  const weekMatch = text.match(/(\d+)\s*week/i);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  const dayMatch = text.match(/(\d+)\s*(?:day|night)/i);
  if (dayMatch) return parseInt(dayMatch[1]);
  const numMatch = text.match(/\b(\d+)\b/);
  if (numMatch) return parseInt(numMatch[1]);
  return null;
}

// Get a random casual response
function getCasualResponse(text) {
  for (const intent of CASUAL_INTENTS) {
    for (const rx of intent.patterns) {
      if (rx.test(text)) {
        const r = intent.responses;
        return r[Math.floor(Math.random() * r.length)];
      }
    }
  }
  return null;
}

// ── Destination-based Suggestions ──────────────────────────────────────────
function suggestPlaces(place) {
  const p = place.toLowerCase();
  if (p.includes("kerala")) return "Munnar, Alleppey, and Thekkady";
  if (p.includes("shimla")) return "Mall Road, Kufri, and Jakhoo Temple";
  if (p.includes("goa")) return "Baga Beach, Calangute Beach, and Old Goa";
  if (p.includes("paris")) return "Eiffel Tower, Louvre Museum, and Notre Dame";
  if (p.includes("london")) return "Big Ben, London Eye, and Tower Bridge";
  return "the top-rated local attractions and hidden gems";
}

function detectFollowupIntent(input) {
  const low = input.toLowerCase();
  if (low.includes("hotel") || low.includes("stay") || low.includes("accommodation")) return "hotel";
  if (low.includes("tip") || low.includes("advice") || low.includes("guide")) return "tips";
  if (low.includes("place") || low.includes("visit") || low.includes("see") || low.includes("sightseeing")) return "places";
  return "unknown";
}

function isValidType(input) {
  return ["vacation", "holiday", "business", "work", "adventure", "trek", "honeymoon"].some(t => input.toLowerCase().includes(t));
}

const STATE = {
  GREETING: 'greeting',
  ASK_DESTINATION: 'ask_destination',
  CONFIRM_IMAGE_DESTINATION: 'confirm_image_destination',
  CONFIRM_PROCEED: 'confirm_proceed',
  ASK_DURATION: 'ask_duration',
  ASK_TYPE: 'ask_type',
  ASK_PEOPLE: 'ask_people',
  PROCESSING: 'processing',
  FOLLOWUP: 'followup'
};

let currentState = STATE.GREETING;
let travelData = {
  destination: '',
  duration: 0,
  type: '',
  people: 0,
  lat: null,
  lon: null,
  weather: null
};

// DOM Elements will be initialized in DOMContentLoaded
let chatContainer, userInput, sendBtn, resetBtn, chatbotWidget, chatbotToggler, closeChatBtn, sliderTrack;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log("Nexo AI: Initializing...");

  // Initialize DOM Elements
  chatContainer = document.getElementById('chat-container');
  userInput = document.getElementById('user-input');
  sendBtn = document.getElementById('send-btn');
  resetBtn = document.getElementById('reset-btn');
  chatbotWidget = document.getElementById('chatbot-widget');
  chatbotToggler = document.getElementById('chatbot-toggler');
  const togglerLabel = document.getElementById('toggler-label');
  closeChatBtn = document.getElementById('close-chat-btn');
  sliderTrack = document.querySelector('.slider-track');

  if (!chatContainer || !chatbotWidget || !chatbotToggler) {
    console.error("Nexo AI: Failed to find critical DOM elements!");
    return;
  }

  console.log("Nexo AI: DOM elements found. Setting up listeners...");

  resetBot();

  sendBtn.addEventListener('click', handleUserInput);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput();
  });

  resetBtn.addEventListener('click', resetBot);

  // Toggle Chatbot Widget
  const toggleChat = () => {
    chatbotWidget.classList.toggle('open');
    if (chatbotWidget.classList.contains('open')) {
      userInput.focus();
    }
  };

  chatbotToggler.addEventListener('click', toggleChat);
  if (togglerLabel) togglerLabel.addEventListener('click', toggleChat);

  closeChatBtn.addEventListener('click', () => {
    chatbotWidget.classList.remove('open');
  });

  // Destination Cards Click Logic
  const slideCards = document.querySelectorAll('.slide-card');
  slideCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const locationName = card.querySelector('h3').innerText;
      chatbotWidget.classList.add('open');
      userInput.focus();

      if (currentState === STATE.ASK_DESTINATION || currentState === STATE.GREETING) {
        if (chatContainer.children.length <= 1) {
          chatContainer.innerHTML = '';
        }
        const message = `Are you planning to go to ${locationName}?`;
        addUserMessage(message);
        travelData.destination = locationName;
        currentState = STATE.CONFIRM_IMAGE_DESTINATION;

        const typingId = showTypingIndicator();
        setTimeout(() => {
          removeTypingIndicator(typingId);
          const buttonsHtml = `
            <div class="quick-replies">
              <button class="quick-reply-btn" onclick="handleChipClick('Yes')">Yes</button>
              <button class="quick-reply-btn" onclick="handleChipClick('No')">No</button>
            </div>
          `;
          addBotMessage(`Wow, <b>${locationName}</b> is a beautiful place! 🌍 Do you want to plan your trip here? ${buttonsHtml}`);
        }, 800);
      }
    });
  });

  // Start infinite typing effect for the bubble
  console.log("Nexo AI: Starting bubble typing...");
  startTypingEffect("Hey iam nexo 👋");
});

function startTypingEffect(text) {
  const el = document.getElementById('typing-text');
  if (!el) {
    console.error("Nexo AI: typing-text element not found!");
    return;
  }

  let i = 0;
  let isDeleting = false;

  function type() {
    const currentText = text.substring(0, i);
    el.textContent = currentText;

    if (!isDeleting && i < text.length) {
      i++;
      setTimeout(type, 100);
    } else if (isDeleting && i > 0) {
      i--;
      setTimeout(type, 50);
    } else {
      isDeleting = !isDeleting;
      // Wait 1.5s when done typing, 0.5s when done deleting
      setTimeout(type, isDeleting ? 1500 : 500);
    }
  }

  type();
}

function resetBot() {
  chatContainer.innerHTML = '';
  currentState = STATE.ASK_DESTINATION;
  travelData = { destination: '', duration: 0, type: '', people: 0, lat: null, lon: null, weather: null };

  const chips = document.getElementById('suggestion-chips');
  if (chips) chips.style.display = 'flex';

  setTimeout(() => {
    addBotMessage("Hey! 👋 I'm <b>Nexo</b>, your AI travel buddy. Where are we heading today?");
  }, 300);
}

async function handleUserInput() {
  const text = userInput.value.trim();
  if (!text || currentState === STATE.PROCESSING) return;

  addUserMessage(text);
  userInput.value = '';
  userInput.focus();

  // ── FOLLOW-UP State ──────────────────────────────────────────────────
  if (currentState === STATE.FOLLOWUP) {
    const intent = detectFollowupIntent(text);
    const typingId = showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator(typingId);
      if (intent === "hotel") {
        addBotMessage(`In <b>${travelData.destination}</b>, you can find great hotels near popular tourist areas. I recommend checking out top-rated stays on Booking.com or Airbnb! 🏨`);
      } else if (intent === "tips") {
        addBotMessage(`For your trip to <b>${travelData.destination}</b>, plan early, keep your documents handy, and always check the local weather updates! ✈️`);
      } else if (intent === "places") {
        const places = suggestPlaces(travelData.destination);
        addBotMessage(`You should definitely explore <b>${places}</b> while you're there! 🏛️`);
      } else if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("ok")) {
        addBotMessage("Would you like hotel suggestions, travel tips, or places to visit? Just ask!");
      } else {
        addBotMessage("You can ask for <b>hotels</b>, <b>travel tips</b>, or <b>places to visit</b>. Or tell me a new destination to start over!");
        // If they enter a new destination, it will be handled by the fallback below if we change state
        // But for now, let's keep them in follow-up unless they trigger a new packing intent
      }
    }, 700);

    // Check if they want to start a new trip even in follow-up
    if (detectPackingIntent(text)) {
      const dest = extractDestination(text);
      if (dest) {
        travelData.destination = dest;
        currentState = STATE.ASK_DURATION;
        // Fall through to packing intent handler below
      } else {
        return;
      }
    } else {
      return;
    }
  }

  // ── CONFIRM_IMAGE_DESTINATION State ────────────────────────────────────
  if (currentState === STATE.CONFIRM_IMAGE_DESTINATION) {
    if (text.toLowerCase().includes("yes") || text.toLowerCase() === "y" || text.toLowerCase() === "yep" || text.toLowerCase() === "yeah" || text.toLowerCase() === "sure") {
      currentState = STATE.ASK_DURATION;
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage(`Awesome! 🌍 How many days will you be staying there?`);
      }, 600);
    } else if (text.toLowerCase().includes("no")) {
      addBotMessage("No problem! Please choose another place or type a destination.");
      currentState = STATE.ASK_DESTINATION;
    } else {
      addBotMessage("Do you want to plan your trip here? Please choose <b>Yes</b> or <b>No</b>. 😊");
    }
    return;
  }

  // ── CONFIRM_PROCEED State ──────────────────────────────────────────────
  if (currentState === STATE.CONFIRM_PROCEED) {
    if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("proceed") || text.toLowerCase().includes("ok")) {
      currentState = STATE.ASK_DURATION;
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage(`Awesome! 🌍 How many days will you be staying in <b>${travelData.destination}</b>?`);
      }, 600);
    } else if (text.toLowerCase().includes("no")) {
      addBotMessage("No problem! Where else would you like to go?");
      currentState = STATE.ASK_DESTINATION;
    } else {
      addBotMessage("Shall we proceed with planning your trip? Please say <b>Yes</b> or <b>Proceed</b>. 😊");
    }
    return;
  }

  // ── ASK_DURATION State ─────────────────────────────────────────────────
  if (currentState === STATE.ASK_DURATION) {
    const days = extractDuration(text);
    if (days && days > 0) {
      travelData.duration = days;
      currentState = STATE.ASK_TYPE;
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        const typeButtonsHtml = `
          <div class="quick-replies">
            <button class="quick-reply-btn" onclick="handleChipClick('Vacation')">Vacation</button>
            <button class="quick-reply-btn" onclick="handleChipClick('Business')">Business</button>
            <button class="quick-reply-btn" onclick="handleChipClick('Adventure')">Adventure</button>
          </div>
        `;
        addBotMessage(`Got it! 📅 What type of trip is this? ${typeButtonsHtml}`);
      }, 600);
    } else {
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage("How many days will you be staying? Just tell me the number! 📅");
      }, 600);
    }
    return;
  }

  // ── ASK_TYPE State ─────────────────────────────────────────────────────
  if (currentState === STATE.ASK_TYPE) {
    if (isValidType(text)) {
      travelData.type = text;
      currentState = STATE.ASK_PEOPLE;
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage(`Great, a <b>${text}</b> trip! 🎒 How many people are traveling?`);
      }, 600);
    } else {
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage("Please choose: <b>vacation</b>, <b>business</b>, or <b>adventure</b>. 😊");
      }, 600);
    }
    return;
  }

  // ── ASK_PEOPLE State ───────────────────────────────────────────────────
  if (currentState === STATE.ASK_PEOPLE) {
    const count = parseInt(text);
    if (!isNaN(count) && count > 0) {
      travelData.people = count;
      currentState = STATE.PROCESSING;
      const typingId = showTypingIndicator();
      await processTravelData(typingId);
    } else {
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage("How many people are traveling? Please enter a number. 👥");
      }, 600);
    }
    return;
  }

  // ── Check for packing intent (Natural Language) ────────────────────────
  if (detectPackingIntent(text)) {
    const dest = extractDestination(text);
    const days = extractDuration(text);

    if (dest) {
      travelData.destination = dest;
      const typingId = showTypingIndicator();
      await fetchWeatherAndShowProceed(typingId);
      return;
    }
  }

  // ── ASK_DESTINATION State ──────────────────────────────────────────────
  if (currentState === STATE.ASK_DESTINATION) {
    const lowerText = text.toLowerCase();
    if (lowerText === "yes" || lowerText === "yep" || lowerText === "sure" || lowerText === "yeah" || lowerText === "y") {
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage("Awesome! Where are you planning to go? 🌍");
      }, 600);
      return;
    }

    const casual = getCasualResponse(text);
    if (casual) {
      const typingId = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage(casual);
      }, 700);
      return;
    }

    // Block gibberish / random input — don't send it to the weather API
    if (isGibberish(text)) {
      const typingId = showTypingIndicator();
      const confused = [
        "Hmm, I didn't quite understand that 😅 Could you type a destination? For example: <i>'Paris'</i> or <i>'I'm going to Goa'</i>",
        "That doesn't look like a place I know! 🤔 Please type a city or country name.",
        "I'm not sure what you mean. 😊 Try something like <i>'Take me to Tokyo'</i> or just type <i>'Goa'</i>!",
        "Oops, that doesn't look like a destination! 🗺️ Where are you planning to travel?"
      ];
      setTimeout(() => {
        removeTypingIndicator(typingId);
        addBotMessage(confused[Math.floor(Math.random() * confused.length)]);
      }, 700);
      return;
    }

    travelData.destination = text;
    const typingId = showTypingIndicator();
    await fetchWeatherAndShowProceed(typingId);
    return;
  }

  // ── Fallback ───────────────────────────────────────────────────────────
  const casual = getCasualResponse(text);
  if (casual) {
    const typingId = showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator(typingId);
      addBotMessage(casual);
    }, 700);
  } else if (isGibberish(text)) {
    // Gibberish / random characters typed anywhere outside a specific state
    const typingId = showTypingIndicator();
    const gibberishReplies = [
      "Hmm, I didn't understand that 😅 I'm a travel assistant — try asking me about packing for a trip!",
      "That doesn't make sense to me 🤖 Try typing something like <i>'I'm going to London for 5 days'</i>!",
      "I only understand travel-related requests! 🌍 Try: <i>'Pack for Paris'</i> or <i>'Trip to Dubai'</i>.",
      "Looks like random text! 😄 I'm Nexo — I help with packing lists. Where are you headed?"
    ];
    setTimeout(() => {
      removeTypingIndicator(typingId);
      addBotMessage(gibberishReplies[Math.floor(Math.random() * gibberishReplies.length)]);
    }, 700);
  } else {
    const typingId = showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator(typingId);
      const fallbacks = [
        "Hmm, I'm not sure I got that. 🤔 You can ask me about packing for a trip, or just chat!",
        "I didn't quite get that 😅 — try something like <i>'I'm going to Paris for 7 days'</i>!",
        "Not sure what you mean, but I'm here! 😊 Want a packing list for somewhere?"
      ];
      addBotMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }, 700);
  }
}

const WEATHER_API_KEY = 'a13f725c0be44cfa87c112958262504';
const GEMINI_API_KEY = 'AIzaSyAzXdA8lQ19SqJdV8AGHLxIcEfLvpXnXWA';

async function fetchWeatherAndShowProceed(typingId) {
  try {
    if (WEATHER_API_KEY === 'YOUR_WEATHERAPI_KEY') {
      throw new Error("Please enter your WeatherAPI.com key in script.js!");
    }

    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(travelData.destination)}`);
    const data = await res.json();

    if (data.error) {
      removeTypingIndicator(typingId);
      addBotMessage(`I couldn't find weather for "${travelData.destination}". ${data.error.message} Let's try again. Where are you going?`);
      currentState = STATE.ASK_DESTINATION;
      return;
    }

    const location = data.location;
    const locationName = `${location.name}, ${location.region ? location.region + ', ' : ''}${location.country}`;
    const current = data.current;

    // Store weather for later
    travelData.weather = {
      locationName,
      tempC: Math.round(current.temp_c),
      tempF: Math.round(current.temp_f),
      tempString: `${Math.round(current.temp_c)}°C / ${Math.round(current.temp_f)}°F`,
      conditionStr: current.condition.text
    };

    removeTypingIndicator(typingId);
    let icon = "☀️";
    const condLower = travelData.weather.conditionStr.toLowerCase();
    if (condLower.includes("rain") || condLower.includes("drizzle")) icon = "🌧️";
    else if (condLower.includes("snow")) icon = "❄️";
    else if (condLower.includes("thunderstorm") || condLower.includes("storm")) icon = "⛈️";
    else if (condLower.includes("cloud") || condLower.includes("mist") || condLower.includes("fog") || condLower.includes("haze")) icon = "☁️";

    addBotMessage(`Wow, <b>${locationName}</b> is a great choice! 🌍`);

    const typingIdWeather = showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator(typingIdWeather);
      addBotMessage(`Here are the current weather conditions for <b>${locationName}</b>: 🌤️`);

      setTimeout(() => {
        addBotMessage(`<div class="weather-info"><span class="weather-icon">${icon}</span><div><strong>${locationName}</strong><br>🌡️ Temperature: ${travelData.weather.tempString}<br>🌤️ Condition: ${travelData.weather.conditionStr}</div></div>`);

        const typingIdProceed = showTypingIndicator();
        setTimeout(() => {
          removeTypingIndicator(typingIdProceed);
          const buttonsHtml = `
            <div class="quick-replies">
              <button class="quick-reply-btn" onclick="handleChipClick('Yes')">Yes</button>
              <button class="quick-reply-btn" onclick="handleChipClick('No')">No</button>
            </div>
          `;
          addBotMessage(`Shall we proceed with planning your trip? ${buttonsHtml}`);
          currentState = STATE.CONFIRM_PROCEED;
        }, 800);
      }, 400);
    }, 800);

  } catch (error) {
    console.error("Error fetching weather:", error);
    removeTypingIndicator(typingId);
    addBotMessage(`Hmm, something went wrong fetching the weather. Let's try again. Where are you going?`);
    currentState = STATE.ASK_DESTINATION;
  }
}

async function processTravelData(typingId) {
  try {
    if (!travelData.weather) {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(travelData.destination)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const loc = data.location;
      const cur = data.current;
      travelData.weather = {
        locationName: `${loc.name}, ${loc.region ? loc.region + ', ' : ''}${loc.country}`,
        tempC: Math.round(cur.temp_c),
        tempF: Math.round(cur.temp_f),
        tempString: `${Math.round(cur.temp_c)}°C / ${Math.round(cur.temp_f)}°F`,
        conditionStr: cur.condition.text
      };
    }

    const w = travelData.weather;
    const locationName = w.locationName;
    const tempString = w.tempString;
    const conditionStr = w.conditionStr;

    removeTypingIndicator(typingId);

    // 1. Show trip summary
    addBotMessage(`That sounds like a wonderful <b>${travelData.type}</b> trip for <b>${travelData.people}</b> people! 🌍 The current temperature there is <b>${tempString}</b>. Let me prepare your packing list...`);

    // 2. Try Gemini AI, fallback to rule-based list
    const newTypingId = showTypingIndicator();
    const packingListHTML = await generatePackingListFromGemini(locationName, travelData.duration, tempString, conditionStr);
    removeTypingIndicator(newTypingId);
    addBotMessage(packingListHTML);

    setTimeout(() => {
      addBotMessage("Thank you for using Nexo! Have a great trip! ✈️");
      currentState = STATE.GREETING;
    }, 1500);

  } catch (error) {
    console.error("Error processing request:", error);
    removeTypingIndicator(typingId);
    addBotMessage(`Hmm, something went wrong. Let's try again. Where are you going?`);
    currentState = STATE.ASK_DESTINATION;
  }
}

function getRuleBasedPackingList(name, days, tempC, condition) {
  const condLower = condition.toLowerCase();
  const isHot = tempC >= 28;
  const isCold = tempC <= 15;
  const isRainy = condLower.includes("rain") || condLower.includes("drizzle") || condLower.includes("thunderstorm");
  const isSnowy = condLower.includes("snow");

  let clothing = isSnowy
    ? `<li>🧥 Heavy winter jacket</li><li>🧤 Gloves & woolen socks</li><li>🧣 Scarf & beanie</li><li>👢 Waterproof snow boots</li><li>🧶 Thermal innerwear</li>`
    : isCold
      ? `<li>🧥 Jacket / windcheater</li><li>👖 Full-length trousers</li><li>🧣 Scarf</li><li>👟 Comfortable closed shoes</li><li>🧤 Light gloves</li>`
      : isHot
        ? `<li>👕 Light cotton t-shirts (${days} sets)</li><li>🩳 Shorts / breathable trousers</li><li>🕶️ Sunglasses</li><li>🧢 Hat / cap</li><li>👟 Comfortable sandals or sneakers</li>`
        : `<li>👕 T-shirts & casual tops (${days} sets)</li><li>👖 Jeans / trousers</li><li>🧥 Light jacket (for evenings)</li><li>👟 Comfortable walking shoes</li>`;

  if (isRainy) clothing += `<li>☂️ Umbrella or raincoat</li><li>👟 Waterproof shoes</li>`;

  const essentials = `<li>🪥 Toothbrush & toothpaste</li><li>🧴 Shampoo & body wash</li><li>💊 Basic medicines & first-aid kit</li><li>📱 Phone charger & power bank</li><li>🪪 ID proof / passport</li><li>💳 Cash & cards</li>`;
  const extras = isHot
    ? `<li>🧴 Sunscreen SPF 50+</li><li>💧 Reusable water bottle</li><li>🩺 Electrolyte sachets</li>`
    : isSnowy
      ? `<li>🔋 Hand warmers</li><li>🧴 Lip balm & moisturiser</li><li>☀️ Sunscreen (snow reflects UV)</li>`
      : `<li>📷 Camera</li><li>📚 Book / entertainment</li><li>🎒 Day backpack</li>`;

  return `<div class="packing-list">
    <div class="packing-category">👗 Clothing</div><ul>${clothing}</ul>
    <div class="packing-category">🪥 Essentials</div><ul>${essentials}</ul>
    <div class="packing-category">✨ Travel Extras</div><ul>${extras}</ul>
</div><p style="font-size:0.78em;opacity:0.7;margin-top:8px">⚡ Smart packing list (AI unavailable — try again later for personalized suggestions)</p>`;
}

async function generatePackingListFromGemini(name, days, tempString, condition) {
  // Safely parse the numeric temperature from strings like "28°C / 82°F"
  const tempCMatch = tempString.match(/(-?\d+)/);
  const tempC = tempCMatch ? parseInt(tempCMatch[1]) : 20;

  const prompt = `You are an expert AI packing assistant. I am traveling to ${name} for ${days} days.
The trip type is ${travelData.type} and there are ${travelData.people} people traveling.
The current weather there is ${tempString} and ${condition}.
Please generate a concise, personalized packing list for me.
IMPORTANT RULES:
1. Your entire response MUST be raw, valid HTML that can be injected directly into a div.
2. DO NOT use markdown formatting, do not use \`\`\`html tags.
3. Organize the list into logical categories using <div class="packing-category">Category Name</div> followed by <ul> and <li> tags. Include emojis in the category names.
4. Keep the list practical and highly specific to the weather conditions, trip type, and number of people.
5. Start directly with the packing categories — do NOT repeat the weather header (it's already shown above).
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    if (data.error) {
      console.warn("Gemini unavailable, using rule-based fallback:", data.error.message);
      return getRuleBasedPackingList(name, days, tempC, condition);
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let html = data.candidates[0].content.parts[0].text;
      html = html.replace(/```html/g, '').replace(/```/g, '').trim();
      return html;
    } else {
      return getRuleBasedPackingList(name, days, tempC, condition);
    }
  } catch (e) {
    console.warn("Gemini fetch failed, using fallback:", e);
    return getRuleBasedPackingList(name, days, tempC, condition);
  }
}

// UI Helpers
function addUserMessage(text) {
  const div = document.createElement('div');
  div.className = 'message user-message';
  div.textContent = text;
  chatContainer.appendChild(div);
  scrollToBottom();
}

function addBotMessage(html) {
  const div = document.createElement('div');
  div.className = 'message bot-message';
  div.innerHTML = html;
  chatContainer.appendChild(div);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'typing-indicator';
  div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  chatContainer.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Global function for chip clicks
window.handleChipClick = function (text) {
  userInput.value = text;
  handleUserInput();
  // Hide chips after first interaction to keep chat clean
  const chips = document.getElementById('suggestion-chips');
  if (chips) chips.style.display = 'none';
};
