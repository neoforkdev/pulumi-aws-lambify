import json

def handler(event, context):
    """
    POST /hello/{user} - Create a personalized greeting with custom message
    
    Accepts a JSON body with 'message' field and returns a greeting
    combining the URL parameter and the message from the body.
    """
    # Extract user from path parameters
    user = event.get('pathParameters', {}).get('user', 'Anonymous')
    
    # Parse JSON body
    try:
        body = json.loads(event.get('body', '{}'))
        custom_message = body.get('message', 'Hello')
    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid JSON in request body"})
        }
    
    # Create personalized greeting
    greeting = f"{custom_message}, {user}! Thanks for posting."
    
    return {
        "statusCode": 201,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "user": user,
            "greeting": greeting,
            "method": "POST"
        })
    } 