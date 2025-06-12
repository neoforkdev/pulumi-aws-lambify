"""
Emoji Layer - Maps moods to corresponding emojis
"""

MOOD_EMOJI_MAP = {
    'happy': '😄',
    'sad': '😢',
    'angry': '😠',
    'excited': '🤩',
    'love': '❤️',
    'confused': '😕',
    'surprised': '😲',
    'tired': '😴',
    'cool': '😎',
    'worried': '😟',
    'laughing': '😂',
    'wink': '😉',
    'neutral': '😐',
    'thinking': '🤔',
    'celebration': '🎉',
    'heart_eyes': '😍',
    'crying': '😭',
    'sick': '🤒',
    'crazy': '🤪',
    'robot': '🤖'
}

def get_emoji_for_mood(mood: str) -> str:
    """
    Get emoji for a given mood.
    
    Args:
        mood (str): The mood string
        
    Returns:
        str: The corresponding emoji, or a default emoji if mood not found
    """
    # Convert to lowercase for case-insensitive matching
    mood_lower = mood.lower().strip()
    
    # Return the emoji or a default one if not found
    return MOOD_EMOJI_MAP.get(mood_lower, '🤷')  # Shrug emoji as default

def get_available_moods() -> list:
    """
    Get list of all available moods.
    
    Returns:
        list: List of available mood strings
    """
    return list(MOOD_EMOJI_MAP.keys()) 