# connector_api

```json
{
  "client_name": "Test Webhook Connector",
  "description": "Webhook Event Listener",
  "enabled": true,
  "capabilities": {
    "webhooks": {
      "ms.MessagingEventNotification.ContentEvent": {
        "endpoint": "https://54fb-45-25-45-52.ngrok.io/event/ContentEvent",
        "max_retries": 3
      },
      "ms.MessagingEventNotification.RichContentEvent": {
        "endpoint": "https://54fb-45-25-45-52.ngrok.io/event/RichContentEvent",
        "max_retries": 5
      },
      "ms.MessagingEventNotification.AcceptStatusEvent": {
        "endpoint": "https://54fb-45-25-45-52.ngrok.io/event/AcceptStatusEvent",
        "max_retries": 1
      },
      "ms.MessagingEventNotification.ChatStateEvent": {
        "endpoint": "https://54fb-45-25-45-52.ngrok.io/event/ChatStateEvent"
      },
      "cqm.ExConversationChangeNotification": {
        "endpoint": "https://54fb-45-25-45-52.ngrok.io/event/ExConversationChangeNotification"
      }
    }
  }
}
```