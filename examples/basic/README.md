# Basic API Example

This example demonstrates a simple REST API with multiple endpoints showcasing different features of the AWS Lambda deployment system.

## API Endpoints

### 1. Hello Endpoint
- **Path**: `/hello/{user}`
- **Method**: GET
- **Description**: Simple greeting endpoint that echoes the user name
- **Example**: `/hello/john` → `{"message": "Hello, john!"}`

### 2. Calculator Endpoint
- **Path**: `/add/[a]/[b]`
- **Method**: GET
- **Description**: Adds two numbers and returns the result
- **Example**: `/add/5/3` → `{"a": 5.0, "b": 3.0, "result": 8.0}`
- **Error Handling**: Returns 400 status for invalid numbers

### 3. Cowsay Endpoint
- **Path**: `/cow/{text}`
- **Method**: GET
- **Description**: Generates ASCII art cow with the provided text using cowsay library
- **Dependencies**: `cowsay==6.1` (specified in requirements.txt)
- **Example**: `/cow/hello` → ASCII cow saying "hello"

### 4. Emoji Mood Endpoint
- **Path**: `/emoji/{mood}`
- **Method**: GET
- **Description**: Returns an emoji corresponding to the provided mood
- **Dependencies**: Uses the `emoji` layer
- **Example**: `/emoji/happy` → `{"mood": "happy", "emoji": "😄"}`

## Layers

### Emoji Layer
- **Name**: `emoji`
- **Location**: `/layers/emoji/`
- **Purpose**: Provides mood-to-emoji mapping functionality
- **Available Moods**: happy, sad, angry, excited, love, confused, surprised, tired, cool, worried, laughing, wink, neutral, thinking, celebration, heart_eyes, crying, sick, crazy, robot
- **Default**: Returns 🤷 (shrug) for unknown moods

## Structure

```
examples/basic/
├── api/
│   ├── hello/{user}/
│   │   ├── handler.py
│   │   └── config.yaml
│   ├── add/[a]/[b]/
│   │   ├── handler.py
│   │   └── config.yaml
│   ├── cow/{text}/
│   │   ├── handler.py
│   │   ├── config.yaml
│   │   └── requirements.txt
│   └── emoji/{mood}/
│       ├── handler.py
│       └── config.yaml
├── layers/
│   └── emoji/
│       └── emoji_layer.py
└── README.md
```

## Usage

This example can be deployed using your AWS Lambda deployment tool. Each endpoint will be automatically configured based on the `config.yaml` files and directory structure. 