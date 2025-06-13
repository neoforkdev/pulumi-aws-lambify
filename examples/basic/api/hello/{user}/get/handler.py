def lambda_handler(event, context):
    """
    Simple hello endpoint that echoes the user name.
    """
    # Extract the user parameter from the path
    user = event.get('pathParameters', {}).get('user', 'Anonymous')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': f'{{"message": "Hello, {user}!"}}'
    } 