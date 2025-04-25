import os

class Config:
    # API Settings
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', '8000'))
    
    # CORS Settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # WebSocket Settings
    WS_PING_INTERVAL = 20
    WS_PING_TIMEOUT = 10
    MESSAGE_TIMEOUT = 30
    
    # Node URLs
    NODE_URLS = {
        'hc1': os.getenv('HC1_NODE_URL', 'wss://my.hc1node.com:35998'),
        'zenonhub': os.getenv('ZENONHUB_NODE_URL', 'wss://node.zenonhub.io:35998'),
        'atsocy': os.getenv('ATSOCY_NODE_URL', 'wss://node.atsocy.com:35998')
    }
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'fork_monitor.log') 