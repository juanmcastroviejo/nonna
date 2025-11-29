from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .database import engine, get_db
from . import models, schemas, crud

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Nonna API",
    description="Personal finance tracker API - Financial wisdom, passed down.",
    version="1.0.0",
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Startup Event ==============

@app.on_event("startup")
def startup_event():
    """Initialize default categories on startup."""
    db = Session(bind=engine)
    try:
        crud.create_default_categories(db)
    finally:
        db.close()


# ============== Root Endpoint ==============

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "message": "Welcome to Nonna API",
        "tagline": "Financial wisdom, passed down.",
        "docs": "/docs",
    }


# ============== Category Endpoints ==============

@app.get("/api/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    """Get all available categories."""
    return crud.get_categories(db)


@app.post("/api/categories", response_model=schemas.Category, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category."""
    return crud.create_category(db, category)


# ============== Transaction Endpoints ==============

@app.get("/api/transactions", response_model=List[schemas.Transaction])
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """
    Get all transactions with optional filtering.
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **category_id**: Filter by category
    - **start_date**: Filter transactions on or after this date
    - **end_date**: Filter transactions on or before this date
    """
    return crud.get_transactions(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
    )


@app.get("/api/transactions/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction by ID."""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@app.post("/api/transactions", response_model=schemas.Transaction, status_code=201)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    """Create a new transaction."""
    # Verify category exists
    category = crud.get_category(db, transaction.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category_id")
    return crud.create_transaction(db, transaction)


@app.delete("/api/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction by ID."""
    success = crud.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return None


# ============== Analytics Endpoints ==============

@app.get("/api/analytics/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """
    Get spending analytics summary.
    
    Returns total income, total expenses, net balance, and breakdown by category.
    """
    return crud.get_analytics_summary(db, start_date=start_date, end_date=end_date)
