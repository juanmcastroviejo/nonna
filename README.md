<h1 align="center">Nonna</h1>

<p align="center">
  <em>Alla fine, tutto torna.</em>
</p>

---

Inspired by my grandmother, Nonna is an AI-powered personal finance tracker that helps you understand where your money goes.

## Features

- **AI-Powered Transaction Entry** — Type naturally like "Starbucks $8.45" and Nonna automatically categorizes it using OpenAI
- **Smart Categorization** — Automatically detects income vs. expenses and assigns appropriate categories
- **Full CRUD Operations** — Create, read, update, and delete transactions with an intuitive interface
- **Spending Analytics** — Visual breakdown of spending by category with interactive charts
- **Real-time Dashboard** — Summary cards showing total income, expenses, and net balance

## Tech Stack

**Backend:**
- Python 3.12
- FastAPI
- SQLite with SQLAlchemy ORM
- OpenAI API (GPT-3.5 Turbo)
- Pydantic for data validation

**Frontend:**
- React 18
- Chart.js for data visualization
- CSS3 with custom properties

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Git
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/juanmcastroviejo/nonna.git
   cd nonna
```

2. **Set up the backend**
```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install openai
```

3. **Set up the frontend**
```bash
   cd ../frontend
   npm install
```

### Running the Application

1. **Start the backend** (from the `backend` directory):
```bash
   source venv/bin/activate
   OPENAI_API_KEY=your_api_key_here uvicorn app.main:app --reload
```
   API will be available at `http://localhost:8000`

2. **Start the frontend** (from the `frontend` directory):
```bash
   npm start
```
   App will open at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parse` | Parse natural language into transaction data (AI) |
| GET | `/api/transactions` | Get all transactions |
| GET | `/api/transactions/{id}` | Get a specific transaction |
| POST | `/api/transactions` | Create a new transaction |
| PUT | `/api/transactions/{id}` | Update a transaction |
| DELETE | `/api/transactions/{id}` | Delete a transaction |
| GET | `/api/analytics/summary` | Get spending summary by category |
| GET | `/api/categories` | Get all categories |

## Project Structure
```
nonna/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application & routes
│   │   ├── models.py        # SQLAlchemy database models
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   ├── database.py      # Database configuration
│   │   ├── crud.py          # Database operations
│   │   └── ai_parser.py     # OpenAI integration for NLP
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── nonna-text-logo.png
│   │   ├── App.js           # Main React component
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## License

MIT

---
