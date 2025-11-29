# Nonna 👓

**Financial wisdom, passed down.**

Nonna is a personal finance tracker that helps you understand where your money goes. Named after my grandmother who was a bank manager — she taught me that tracking your spending is the first step to financial freedom.

## Features

- **Transaction Management** — Add, view, and delete financial transactions
- **Category Organization** — Organize spending by categories (Food, Bills, Entertainment, etc.)
- **Spending Analytics** — Visual breakdown of where your money goes
- **Clean Dashboard** — Simple, intuitive interface to manage your finances

## Tech Stack

**Backend:**
- Python 3.12
- FastAPI
- SQLite (with SQLAlchemy ORM)
- Pydantic for data validation

**Frontend:**
- React 18
- Chart.js for visualizations
- CSS3 with custom properties

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Git

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
   uvicorn app.main:app --reload
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
| GET | `/api/transactions` | Get all transactions |
| GET | `/api/transactions/{id}` | Get a specific transaction |
| POST | `/api/transactions` | Create a new transaction |
| DELETE | `/api/transactions/{id}` | Delete a transaction |
| GET | `/api/analytics/summary` | Get spending summary by category |
| GET | `/api/categories` | Get all categories |

## Project Structure

```
nonna/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database configuration
│   │   └── crud.py          # Database operations
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## License

MIT

---

*Built with love, inspired by Nonna's wisdom.* 👓
