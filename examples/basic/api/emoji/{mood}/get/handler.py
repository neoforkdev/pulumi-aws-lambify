import sys
sys.path.append('/opt/python')

from emoji_layer import get_emoji_for_mood

def lambda_handler(event, context):
    """
    Get emoji for the given mood using the emoji layer.
    """
    # Extract the mood parameter from the path
    mood = event.get('pathParameters', {}).get('mood', 'neutral')
    
    # Get emoji from the layer function
    emoji = get_emoji_for_mood(mood)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': f'{{"mood": "{mood}", "emoji": "{emoji}"}}'
    } 