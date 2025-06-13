def lambda_handler(event, context):
    """
    Add two numbers from path parameters.
    """
    try:
        # Extract path parameters
        path_params = event.get('pathParameters', {})
        a = float(path_params.get('a', 0))
        b = float(path_params.get('b', 0))
        
        result = a + b
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': f'{{"a": {a}, "b": {b}, "result": {result}}}'
        }
    except (ValueError, TypeError) as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': f'{{"error": "Invalid numbers provided: {str(e)}"}}'
        } 