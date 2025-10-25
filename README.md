# /users/register Endpoint Documentation

## Description
The `/users/register` endpoint is used to register a new user in the application. It accepts user details, validates the input, hashes the password, and creates a new user record in the database. Upon successful registration, it generates and returns an authentication token along with the user details.

## Request Body
The request body must be in JSON format and should contain the following fields:

- `fullname`: An object containing the user's full name.
  - `firstname`: A string representing the user's first name. This field is required and must be at least 3 characters long.
  - `lastname`: A string representing the user's last name. This field is optional.
- `email`: A string representing the user's email address. This field is required and must be unique and at least 5 characters long.
- `password`: A string representing the user's password. This field is required and must be at least 6 characters long.

### Example Request
```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

## Responses
- **201 Created**: The user has been successfully registered. The response will include the generated authentication token and the user details.
  - Example Response:
  ```json
  {
    "token": "your_jwt_token_here",
    "user": {
      "fullname": {
        "firstname": "John",
        "lastname": "Doe"
      },
      "email": "john.doe@example.com"
    }
  }
  ```

- **400 Bad Request**: The request body is invalid or missing required fields. The response will include an array of error messages.
  - Example Response:
  ```json
  {
    "errors": [
      {
        "msg": "First name must be atleast 3 characters long!!",
        "param": "fullname.firstname",
        "location": "body"
      },
      {
        "msg": "Invalid Email",
        "param": "email",
        "location": "body"
      }
    ]
  }
  ```

## Status Codes
- **201**: User successfully registered.
- **400**: Bad request due to validation errors.