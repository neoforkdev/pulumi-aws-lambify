"""
Utility functions for the emoji layer
"""

def format_emoji_response(mood: str, emoji: str) -> dict:
    """Format the emoji response with mood and emoji."""
    return {
        'mood': mood,
        'emoji': emoji,
        'status': 'success'
    }

def validate_mood(mood: str) -> bool:
    """Validate if a mood is a valid string."""
    return isinstance(mood, str) and len(mood.strip()) > 0 