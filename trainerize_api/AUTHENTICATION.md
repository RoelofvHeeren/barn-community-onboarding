# Authentication

The Trainerize API protects data by requiring an Authorization header with every request.

## Method: Basic Authentication

You must authenticate using the **Basic** HTTP authentication scheme.

### Header Format

The `Authorization` header is constructed as follows:

```http
Authorization: Basic [Base64Encoded(groupID:APIToken)]
```

### Steps to Construct the Header

1.  **Identify your Credentials:**
    *   **GroupID:** Your unique numeric group ID (e.g., `390246`).
    *   **APIToken:** Your secret API token (e.g., `OoX6NWvPUSVnG3OSnhYw`).

2.  **Combine Credentials:**
    Concatenate them with a colon (`:`) separator:
    `groupID:APIToken`
    *(Example: `390246:OoX6NWvPUSVnG3OSnhYw`)*

3.  **Base64 Encode:**
    Encode the combined string using Base64.

4.  **Add to Header:**
    Prefix the encoded string with `Basic ` (note the space).

### Example Code (JavaScript)

```javascript
const groupID = '390246'; // Replace with env var
const apiToken = 'OoX6NWvPUSVnG3OSnhYw'; // Replace with env var
const credentials = Buffer.from(`${groupID}:${apiToken}`).toString('base64');

const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json'
};

// Example usage with fetch
fetch('https://api.trainerize.com/v03/users', { headers })
  .then(response => response.json())
  .then(data => console.log(data));
```

## Response Codes related to Auth

- **401 Unauthorized:** Invalid credentials or missing header.
- **403 Forbidden:** Valid credentials but insufficient permissions or rate limit exceeded.
