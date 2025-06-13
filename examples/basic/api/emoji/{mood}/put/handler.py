import json
import os
import sys

# Add the layer directory to Python path for emoji layer access
sys.path.append('/opt/python')
from emoji_layer import get_emoji

def handler(event, context):
    """
    PUT /emoji/{mood} - Update or set custom emoji for a mood
    
    Accepts a JSON body with 'emoji' field to set a custom emoji for the mood.
    Returns the updated mood-emoji mapping.
    """
    # Extract mood from path parameters
    mood = event.get('pathParameters', {}).get('mood', 'neutral')
    
    # Parse JSON body
    try:
        body = json.loads(event.get('body', '{}'))
        custom_emoji = body.get('emoji')
        
        if not custom_emoji:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing 'emoji' field in request body"})
            }
            
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Invalid JSON in request body"})
        }
    
    # Get current emoji for comparison
    current_emoji = get_emoji(mood)
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "mood": mood,
            "previous_emoji": current_emoji,
            "updated_emoji": custom_emoji, 
            "message": f"Emoji for '{mood}' updated from {current_emoji} to {custom_emoji}",
            "method": "PUT"
        })
    } 