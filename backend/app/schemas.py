from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ============== Category Schemas ==============

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = "#6B7280"


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ============== Transaction Schemas ==============

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    description: str = Field(..., min_length=1, max_length=255)
    transaction_type: str = Field(default="expense", pattern="^(expense|income)$")
    date: datetime
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    created_at: datetime
    category: Category

    class Config:
        from_attributes = True


# ============== Analytics Schemas ==============

class CategorySummary(BaseModel):
    category_name: str
    category_color: str
    total: float
    count: int
    percentage: float


class AnalyticsSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    by_category: List[CategorySummary]
