import cowsay

def lambda_handler(event, context):
    """
    Generate cowsay output for the given text.
    """
    # Extract the text parameter from the path
    text = event.get('pathParameters', {}).get('text', 'Hello World!')
    
    # Generate cowsay output
    cow_output = cowsay.get_output_string('cow', text)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/plain'
        },
        'body': cow_output
    } 