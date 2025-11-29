from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Category(Base):
    """Category model for organizing transactions."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(7), default="#6B7280")  # Hex color for UI

    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    """Transaction model for tracking income and expenses."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    transaction_type = Column(String(10), default="expense")  # "expense" or "income"
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    category = relationship("Category", back_populates="transactions")
