import os
import json
import re
from openai import OpenAI

# Initialize OpenAI client - reads from environment variable
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CATEGORIES = [
    "Food & Drink",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Bills & Utilities",
    "Health",
    "Income",
    "Other"
]

def parse_transaction(user_input: str) -> dict:
    """
    Parse natural language input into structured transaction data.
    
    Examples:
        "Starbucks $8.45" -> {amount: 8.45, description: "Starbucks", category: "Food & Drink", type: "expense"}
        "Paycheck $2500" -> {amount: 2500, description: "Paycheck", category: "Income", type: "income"}
        "Uber to airport 25" -> {amount: 25, description: "Uber to airport", category: "Transportation", type: "expense"}
    """
    
    prompt = f"""Parse this transaction into structured data. Extract the amount, description, and categorize it.

Transaction: "{user_input}"

Available categories: {', '.join(CATEGORIES)}

Rules:
- If it sounds like income (paycheck, salary, payment received, freelance, deposit, refund), set type to "income" and category to "Income"
- Otherwise, set type to "expense" and choose the most appropriate category
- Extract the dollar amount (look for $, numbers, or written amounts)
- The description should be clean and concise

Respond ONLY with valid JSON in this exact format, no other text:
{{"amount": 0.00, "description": "string", "category": "string", "transaction_type": "expense or income"}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a financial transaction parser. Respond only with valid JSON, no markdown or extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=150
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up response if it has markdown code blocks
        if result_text.startswith("```"):
            result_text = re.sub(r'^```json?\n?', '', result_text)
            result_text = re.sub(r'\n?```$', '', result_text)
        
        result = json.loads(result_text)
        
        # Validate category
        if result.get("category") not in CATEGORIES:
            result["category"] = "Other"
        
        # Validate transaction type
        if result.get("transaction_type") not in ["expense", "income"]:
            result["transaction_type"] = "expense"
            
        # Ensure amount is positive
        result["amount"] = abs(float(result.get("amount", 0)))
        
        return {
            "success": True,
            "data": result
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse AI response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
