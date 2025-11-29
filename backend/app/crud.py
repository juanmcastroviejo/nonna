from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from . import models, schemas


# ============== Category Operations ==============

def get_categories(db: Session) -> List[models.Category]:
    """Get all categories."""
    return db.query(models.Category).all()


def get_category(db: Session, category_id: int) -> Optional[models.Category]:
    """Get a single category by ID."""
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    """Create a new category."""
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def create_default_categories(db: Session) -> None:
    """Create default categories if none exist."""
    if db.query(models.Category).count() == 0:
        default_categories = [
            {"name": "Food & Drink", "color": "#EF4444"},
            {"name": "Transportation", "color": "#F59E0B"},
            {"name": "Entertainment", "color": "#8B5CF6"},
            {"name": "Shopping", "color": "#EC4899"},
            {"name": "Bills & Utilities", "color": "#3B82F6"},
            {"name": "Health", "color": "#10B981"},
            {"name": "Income", "color": "#22C55E"},
            {"name": "Other", "color": "#6B7280"},
        ]
        for cat in default_categories:
            db.add(models.Category(**cat))
        db.commit()


# ============== Transaction Operations ==============

def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[models.Transaction]:
    """Get transactions with optional filtering."""
    query = db.query(models.Transaction)
    
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    
    return query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


def get_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    """Get a single transaction by ID."""
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()


def create_transaction(db: Session, transaction: schemas.TransactionCreate) -> models.Transaction:
    """Create a new transaction."""
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_transaction(db: Session, transaction_id: int) -> bool:
    """Delete a transaction by ID."""
    transaction = get_transaction(db, transaction_id)
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False


def update_transaction(db: Session, transaction_id: int, transaction: schemas.TransactionCreate) -> models.Transaction:
    """Update an existing transaction."""
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        db_transaction.amount = transaction.amount
        db_transaction.description = transaction.description
        db_transaction.transaction_type = transaction.transaction_type
        db_transaction.date = transaction.date
        db_transaction.category_id = transaction.category_id
        db.commit()
        db.refresh(db_transaction)
    return db_transaction


# ============== Analytics Operations ==============

def get_analytics_summary(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> schemas.AnalyticsSummary:
    """Get spending analytics summary."""
    query = db.query(models.Transaction)
    
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    
    transactions = query.all()
    
    # Calculate totals
    total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")
    
    # Calculate by category (expenses only)
    category_totals = {}
    for t in transactions:
        if t.transaction_type == "expense":
            cat_name = t.category.name
            cat_color = t.category.color
            if cat_name not in category_totals:
                category_totals[cat_name] = {"color": cat_color, "total": 0, "count": 0}
            category_totals[cat_name]["total"] += t.amount
            category_totals[cat_name]["count"] += 1
    
    # Build category summaries with percentages
    by_category = []
    for name, data in category_totals.items():
        percentage = (data["total"] / total_expenses * 100) if total_expenses > 0 else 0
        by_category.append(schemas.CategorySummary(
            category_name=name,
            category_color=data["color"],
            total=round(data["total"], 2),
            count=data["count"],
            percentage=round(percentage, 1),
        ))
    
    # Sort by total descending
    by_category.sort(key=lambda x: x.total, reverse=True)
    
    return schemas.AnalyticsSummary(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_balance=round(total_income - total_expenses, 2),
        by_category=by_category,
    )
