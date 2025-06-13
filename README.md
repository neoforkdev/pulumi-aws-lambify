# Jetway by Neofork

A modern toolkit for managing AWS Lambda APIs, formerly known as Pulumi AWS Lambify.

## Overview

Jetway provides a file-based routing framework for AWS Lambda + API Gateway that supports multiple HTTP methods per route through a clean directory structure.

## API Structure

### Multi-Method Routes

The framework uses HTTP method subdirectories to support multiple methods on the same API route:

```
api/
├── users/
│   ├── get/
│   │   ├── handler.py          # GET /users
│   │   ├── config.yaml
│   │   └── openapi.yaml        # Optional method-specific OpenAPI spec
│   ├── post/
│   │   ├── handler.py          # POST /users  
│   │   ├── config.yaml
│   │   └── requirements.txt    # Optional method-specific dependencies
│   └── put/
│       ├── handler.py          # PUT /users
│       └── config.yaml
├── users/{id}/
│   ├── get/
│   │   ├── handler.py          # GET /users/{id}
│   │   └── config.yaml
│   └── delete/
│       ├── handler.py          # DELETE /users/{id}
│       └── config.yaml
└── health/
    └── get/
        ├── handler.py          # GET /health
        └── config.yaml
```

### Supported HTTP Methods

- `get` - GET requests
- `post` - POST requests  
- `put` - PUT requests
- `delete` - DELETE requests
- `patch` - PATCH requests
- `head` - HEAD requests
- `options` - OPTIONS requests

## Key Features

### Method Isolation
- Each HTTP method is implemented as a separate Lambda function
- Independent configuration per method (memory, timeout, environment variables)
- Method-specific dependencies and OpenAPI specifications
- Individual scaling and monitoring per method

### RESTful Design
- Encourages proper REST API patterns
- Clear separation between read and write operations
- Route-based organization with method-specific implementations

### Resource Optimization
- Shared API Gateway resources per route path
- Separate Lambda functions per HTTP method
- Optimized cold start performance per operation type

### Configuration Flexibility
- Method-specific `config.yaml` files
- Optional `requirements.txt` per method
- Method-specific OpenAPI documentation
- Layer support for shared code

## Example Usage

See the `examples/basic/` directory for a complete working example demonstrating:
- Multi-method endpoints (GET and POST on same route)
- Method-specific configurations
- Dependencies and layers
- RESTful API design patterns

## Migration from Single-Method Structure

The framework has migrated from a single-method per route structure to support multiple methods. This provides:
- Better RESTful API organization
- Independent scaling per HTTP method
- Cleaner separation of concerns
- Enhanced monitoring and debugging capabilities
