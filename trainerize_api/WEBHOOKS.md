# Webhooks

Webhooks allow your application to receive real-time notifications about events in Trainerize.

## Registration

Webhooks are not managed via the API itself.

**To register a webhook:**
Email **api@trainerize.com** with your request.
Include the URL you want to receive events at.

## Security (Verification)

Incoming webhook requests will include a custom HTTP header for verification:

`TR-SecretKey: [HookKey]`

You should verify that this key matches the secret key provided to you by Trainerize support.

## Handling Requests

- **Timeout:** Your endpoint must respond within **500ms**.
- **Best Practice:** Do not process heavy logic synchronously. Acknowledge the request immediately (return 200 OK) and queue the payload for background processing.
- **Retries:** Trainerize will attempt to deliver the message **3 times** if your endpoint fails or times out.

## Available Events

Common events include:
- `dailyWorkout.completed`
- `goal.added`
- `msg.received`
- `appointment.added`
- (See full documentation for comprehensive list)
