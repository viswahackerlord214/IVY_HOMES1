# Ivy Homes — Property Marketplace (Internship Assignment)

A full-stack property marketplace web application built for the Ivy Homes Software Engineering Internship (September 2026). Includes real API integration, data analysis of 4700+ listings, and discovery of 20 API documentation discrepancies.

## 🚀 Features

- **Authentication** — Real login against Ivy Homes API with 3 demo accounts, 15-minute token auto-refresh, session persistence across page reloads
- **Browse Listings** — Paginated property listings with server-side filters for locality, BHK, price range, and furnishing
- **Listing Detail** — Individual pages for each listing with full property info, direct URL access
- **Saved Listings** — Per-user favourites that persist across sessions (via `/v1/saved` endpoint)
- **Rentals** — Browsable rental listings with correct monthly rent display
- **Projects** — Builder project cards showing price ranges, amenities, units, and possession dates
- **Insights Dashboard** — Data analysis findings, locality distribution, key metrics, API discoveries
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Error Handling** — Loading skeletons, empty states, error states for every page

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Styling | Vanilla CSS (custom dark theme design system) |
| API Layer | fetch API with retry wrapper and token refresh |
| Data Analysis | Node.js scripts |

## 📁 Architecture

```
ivy_homes/
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components (Header, PropertyCard, Filters, Pagination)
│   │   ├── pages/             # Page components (Login, Listings, Detail, Rentals, Projects, Saved, Insights)
│   │   ├── context/           # React Context (AuthContext)
│   │   ├── services/          # API service layer (all API calls centralized)
│   │   ├── utils/             # Formatting utilities (currency, area, dates)
│   │   └── styles/            # CSS design system
│   ├── .env.example
│   └── package.json
├── scripts/                   # Data collection and analysis
│   ├── fetch-all-data.js      # Downloads all listings, rentals, projects
│   ├── calculate-answers.js   # Computes all 10 answers
│   ├── analyze-all.js         # Comprehensive analysis
│   ├── deep-investigate.js    # Deep investigation of project prices, carpet area units
│   ├── deep-investigate-2.js  # Unique property and fake listing analysis
│   └── fake-detection.js      # Fake listing detection with pattern matching
├── submission.json            # Assignment answers and findings
└── README.md
```

## 🏃 How to Run Locally

```bash
# Clone the repository
git clone <repo_url>
cd ivy_homes

# Setup frontend
cd frontend
cp .env.example .env
# Edit .env and add your API key: VITE_API_KEY=IVY26-XXXXXXXXXXXX
npm install
npm run dev
# Open http://localhost:5173

# Run data analysis
cd ../scripts
node fetch-all-data.js       # Downloads all data (takes ~60 seconds)
node calculate-answers.js    # Computes all 10 answers
```

**Demo accounts:** demo1@ivy.homes, demo2@ivy.homes, demo3@ivy.homes (password provided with API key)

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_KEY` | Ivy Homes API key (required) |

**Security note:** The API key is bundled into the client-side JavaScript by Vite. This is unavoidable for a client-only SPA making direct API calls. In production, a server-side proxy would hide the key. The assignment requires direct API calls, so this is the safest practical architecture.

## 🔍 API Integration

### Authentication
- Login via `POST /auth/login` with `X-API-Key` header (NOT query parameter as docs say)
- Response returns `access_token` (not `token`), expires in 900s (not 86400s)
- Auto-refresh via undocumented `POST /auth/refresh` with `refresh_token`
- Logout is stateless — tokens are discarded client-side

### Pagination
- All collection endpoints use **offset/limit** (not page/limit)
- Maximum limit is **50** (not 200)
- Response shape: `{offset, limit, count, total, has_more, results}`

### Favourites
- Actual endpoint: `/v1/saved` (not `/v1/favourites`)
- POST requires `{listing_id}` (not `{id}`)

### Filtering
- All documented filters (locality, bhk, min_price, max_price, furnishing, sort_by, order) work correctly server-side


## 🚀 What I Would Do With Another Two Days

📱 Mobile UX Improvements — Further optimize the application for smaller screens with improved navigation, responsive layouts, and touch-friendly interactions.

🔐 Server-Side API Proxy — Move API requests behind a server-side proxy to keep API credentials secure and prevent exposing them in client-side code.

🗺️ Interactive Map View — Visualize property listings on an interactive map using their latitude and longitude coordinates, with synchronized map markers and listing cards.

📊 Price Trend Charts — Add locality-level price visualizations to help users understand pricing patterns and market trends.

⚖️ Property Comparison — Allow users to compare saved properties side-by-side based on price, area, BHK, price/sq.ft., locality, and other key attributes.

🤖 ML-Based Listing Anomaly Detection — Extend the existing listing analysis with ML-based anomaly detection to identify unusual pricing patterns and potentially suspicious listings.

⚡ Performance & Testing — Add automated tests for critical functionality and improve performance through API caching, image lazy-loading, and optimized data processing.

## 🤖 LLM/Tools Used

This project was built with the assistance of Claude,ChatGPT, and Anti Gravity. The AI was used for:
- API investigation and systematic testing of endpoints
- Data analysis scripts for answering the 10 questions
- React component generation and CSS design
- Documentation writing

All AI-generated code was reviewed and validated. API discoveries, data analysis patterns, and hypothesis testing were guided by my understanding of the assignment requirements.

## 📝 Known Limitations

1. **API key in client bundle** — The VITE_API_KEY is embedded in the built JavaScript. A server proxy would fix this.
2. **Q8 timestamp ambiguity** — Listing timestamps lack timezone suffix; treated as UTC. IST interpretation gives 149 instead of 142.
3. **Q6 carpet area units** — magichomes listings have area in sqm but we use the raw value (sqft assumption) per the API field name. This inflates the price/sqft for those records.
4. **No image assets** — Property cards use gradient backgrounds since the API doesn't provide image URLs.

