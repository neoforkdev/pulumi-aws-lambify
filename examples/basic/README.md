# Basic API Example

This example demonstrates a modern REST API with multiple endpoints and HTTP methods showcasing different features of the AWS Lambda deployment system.

## API Endpoints

### 1. Hello Endpoint

**Path**: `/hello/{user}`

#### GET Method

- **Description**: Simple greeting endpoint that echoes the user name
- **Example**: `GET /hello/john` → `{"message": "Hello, john!"}`

#### POST Method

- **Description**: Create a personalized greeting with custom message
- **Body**: `{"message": "Custom greeting"}`
- **Example**: `POST /hello/john` with body `{"message": "Welcome"}` → `{"user": "john", "greeting": "Welcome, john! Thanks for posting.", "method": "POST"}`

### 2. Calculator Endpoint

**Path**: `/add/[a]/[b]`

#### GET Method

- **Description**: Adds two numbers and returns the result
- **Example**: `GET /add/5/3` → `{"a": 5.0, "b": 3.0, "result": 8.0}`
- **Error Handling**: Returns 400 status for invalid numbers

### 3. Cowsay Endpoint

**Path**: `/cow/{text}`

#### GET Method

- **Description**: Generates ASCII art cow with the provided text using cowsay library
- **Dependencies**: `cowsay==6.1` (specified in requirements.txt)
- **Example**: `GET /cow/hello` → ASCII cow saying "hello"

### 4. Emoji Mood Endpoint

**Path**: `/emoji/{mood}`

#### GET Method

- **Description**: Returns an emoji corresponding to the provided mood
- **Dependencies**: Uses the `emoji` layer
- **Example**: `GET /emoji/happy` → `{"mood": "happy", "emoji": "😄"}`

#### PUT Method

- **Description**: Update or set custom emoji for a mood
- **Body**: `{"emoji": "🎉"}`
- **Dependencies**: Uses the `emoji` layer
- **Example**: `PUT /emoji/celebration` with body `{"emoji": "🎊"}` → Updates emoji mapping

## Layers

### Emoji Layer

- **Name**: `emoji`
- **Location**: `/layers/emoji/`
- **Purpose**: Provides mood-to-emoji mapping functionality
- **Available Moods**: happy, sad, angry, excited, love, confused, surprised, tired, cool, worried, laughing, wink, neutral, thinking, celebration, heart_eyes, crying, sick, crazy, robot
- **Default**: Returns 🤷 (shrug) for unknown moods

## API Structure

The new API structure follows a method-based approach where each HTTP method has its own subdirectory:

```
examples/basic/
├── api/
│   ├── hello/{user}/
│   │   ├── get/
│   │   │   ├── handler.py
│   │   │   └── config.yaml
│   │   └── post/
│   │       ├── handler.py
│   │       └── config.yaml
│   ├── add/[a]/[b]/
│   │   └── get/
│   │       ├── handler.py
│   │       └── config.yaml
│   ├── cow/{text}/
│   │   └── get/
│   │       ├── handler.py
│   │       ├── config.yaml
│   │       └── requirements.txt
│   └── emoji/{mood}/
│       ├── get/
│       │   ├── handler.py
│       │   └── config.yaml
│       └── put/
│           ├── handler.py
│           └── config.yaml
├── layers/
│   └── emoji/
│       ├── layer.yaml
│       └── emoji_layer.py
└── README.md
```

## Key Features

### Multi-Method Support

- **Route-based Organization**: Each API route can support multiple HTTP methods
- **Method Isolation**: Each HTTP method has its own handler, configuration, and dependencies
- **Independent Scaling**: Different methods on the same route can have different configurations (memory, timeout, etc.)

### Method-Specific Configuration

- Each method directory contains its own `config.yaml` with method-specific settings
- Dependencies can be specified per method using `requirements.txt`
- Optional method-specific OpenAPI specifications

### RESTful Design

- Supports standard HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Encourages proper REST API design patterns
- Clear separation between read and write operations

## Usage

This example can be deployed using your AWS Lambda deployment tool. Each method will be automatically configured as a separate Lambda function based on the `config.yaml` files and directory structure.

The system will create:

- **Separate Lambda functions** for each HTTP method
- **Shared API Gateway resources** for each route path
- **Independent configuration** per method
- **Optimized resource management** with method-specific scaling
