# connector_api

### Listener manifest example
```json
{
  "client_name": "Listener",
  "description": "Webhook Event Listener",
  "enabled": true,
  "capabilities": {
    "webhooks": {
      "ms.MessagingEventNotification.ContentEvent": {
        "endpoint": "https://{domain}/event/ContentEvent",
        "max_retries": 2
      },
      "ms.MessagingEventNotification.RichContentEvent": {
        "endpoint": "https://{domain}/event/RichContentEvent",
        "max_retries": 2
      },
      "ms.MessagingEventNotification.AcceptStatusEvent": {
        "endpoint": "https://{domain}/event/AcceptStatusEvent",
        "max_retries": 1
      },
      "ms.MessagingEventNotification.ChatStateEvent": {
        "endpoint": "https://{domain}/event/ChatStateEvent",
        "max_retries": 3
      },
      "cqm.ExConversationChangeNotification": {
        "endpoint": "https://{domain}/event/ExConversationChangeNotification",
        "max_retries": 3
      }
    }
  }
}
```