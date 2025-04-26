import asyncio
import websockets
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Optional, List
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import signal
import sys
from contextlib import asynccontextmanager
from config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fork_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Momentum:
    height: int
    hash: str
    timestamp: float
    is_stale: bool = False

@dataclass
class NodeState:
    websocket: Optional[websockets.WebSocketClientProtocol] = None
    subscription_id: Optional[str] = None
    last_height: Optional[int] = None
    last_hash: Optional[str] = None
    is_connected: bool = False
    last_message_time: float = 0
    momentums: List[Momentum] = field(default_factory=list)

class ForkMonitor:
    def __init__(self):
        self.nodes = {
            'hc1': NodeState(),
            'zenonhub': NodeState(),
            'atsocy': NodeState()
        }
        self.node_urls = Config.NODE_URLS
        self.subscribe_message = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "ledger.subscribe",
            "params": ["momentums"]
        }
        self.message_timeout = Config.MESSAGE_TIMEOUT
        self.shutdown_event = None
        self.tasks = []
        self.app = None

    def create_app(self):
        self.shutdown_event = asyncio.Event()
        
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # Startup
            self.tasks = [
                asyncio.create_task(self.monitor_node(node_name))
                for node_name in self.nodes.keys()
            ]
            yield
            # Shutdown
            logger.info("Shutting down monitor tasks...")
            self.shutdown_event.set()
            await self.cleanup()
            for task in self.tasks:
                task.cancel()
            await asyncio.gather(*self.tasks, return_exceptions=True)
            logger.info("All tasks cleaned up")

        app = FastAPI(lifespan=lifespan)
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Allow all origins
            allow_credentials=True,
            allow_methods=["*"],  # Allow all methods
            allow_headers=["*"],  # Allow all headers
        )

        @app.get("/api/nodes")
        async def get_nodes():
            logger.info("Received request for nodes data")
            data = {
                node_name: {
                    "is_connected": node.is_connected,
                    "momentums": [
                        {
                            "height": m.height,
                            "hash": m.hash,
                            "timestamp": m.timestamp,
                            "is_stale": m.is_stale
                        } for m in node.momentums[-5:]
                    ]
                }
                for node_name, node in self.nodes.items()
            }
            logger.info(f"Returning data for {len(data)} nodes")
            return data

        return app

    def update_momentums(self, node_name: str, height: int, hash: str):
        """Update the momentums list for a node."""
        node = self.nodes[node_name]
        node.momentums.append(Momentum(height=height, hash=hash, timestamp=time.time()))
        # Keep only the last 5 momentums
        if len(node.momentums) > 5:
            node.momentums = node.momentums[-5:]

    async def connect_node(self, node_name: str) -> None:
        """Establish connection to a node and subscribe to momentums."""
        try:
            logger.info(f"Attempting to connect to {node_name} node...")
            self.nodes[node_name].websocket = await websockets.connect(
                self.node_urls[node_name],
                ping_interval=20,
                ping_timeout=10
            )
            logger.info(f"Sending subscription message to {node_name} node")
            await self.nodes[node_name].websocket.send(json.dumps(self.subscribe_message))
            
            # Wait for subscription response with timeout
            try:
                response = await asyncio.wait_for(
                    self.nodes[node_name].websocket.recv(),
                    timeout=10
                )
                response_data = json.loads(response)
                logger.info(f"Received subscription response from {node_name}: {response}")
                
                if 'result' in response_data:
                    self.nodes[node_name].subscription_id = response_data['result']
                    self.nodes[node_name].is_connected = True
                    self.nodes[node_name].last_message_time = time.time()
                    logger.info(f"Successfully connected to {node_name} node with subscription ID: {response_data['result']}")
                else:
                    logger.error(f"Failed to get subscription ID from {node_name} node. Response: {response}")
                    self.nodes[node_name].is_connected = False
                    await self.handle_disconnection(node_name)
            except asyncio.TimeoutError:
                logger.error(f"Timeout waiting for subscription response from {node_name} node")
                self.nodes[node_name].is_connected = False
                await self.handle_disconnection(node_name)
                
        except Exception as e:
            logger.error(f"Error connecting to {node_name} node: {str(e)}")
            self.nodes[node_name].is_connected = False
            await self.handle_disconnection(node_name)

    async def handle_disconnection(self, node_name: str) -> None:
        """Handle node disconnection by clearing state and preparing for reconnection."""
        node = self.nodes[node_name]
        node.is_connected = False
        node.subscription_id = None
        if node.websocket and not node.websocket.closed:
            await node.websocket.close()
        node.websocket = None
        # Keep the last few momentums but mark them as stale
        if node.momentums:
            for momentum in node.momentums:
                momentum.is_stale = True

    async def check_connection_health(self, node_name: str) -> None:
        """Check if the connection is healthy and reconnect if necessary."""
        if not self.nodes[node_name].is_connected:
            return

        current_time = time.time()
        if current_time - self.nodes[node_name].last_message_time > self.message_timeout:
            logger.warning(f"No messages received from {node_name} node for {self.message_timeout} seconds.")
            await self.handle_disconnection(node_name)

    async def cleanup(self):
        """Clean up WebSocket connections"""
        logger.info("Cleaning up connections...")
        for node_name, node in self.nodes.items():
            if node.websocket and not node.websocket.closed:
                await node.websocket.close()
                logger.info(f"Closed connection to {node_name}")

    async def monitor_node(self, node_name: str) -> None:
        """Monitor a single node for momentum updates."""
        while True:
            try:
                if self.shutdown_event.is_set():
                    logger.info(f"Shutdown signal received for {node_name}")
                    break

                if not self.nodes[node_name].is_connected:
                    await self.connect_node(node_name)
                    if not self.nodes[node_name].is_connected:
                        await asyncio.sleep(5)
                        continue

                # Check connection health
                await self.check_connection_health(node_name)
                if not self.nodes[node_name].is_connected:
                    continue

                try:
                    response = await asyncio.wait_for(
                        self.nodes[node_name].websocket.recv(),
                        timeout=1.0  # Short timeout to check shutdown_event frequently
                    )
                    self.nodes[node_name].last_message_time = time.time()
                    data = json.loads(response)
                    
                    if 'params' in data and 'result' in data['params']:
                        momentum = data['params']['result'][0]
                        self.nodes[node_name].last_height = momentum['height']
                        self.nodes[node_name].last_hash = momentum['hash']
                        self.update_momentums(node_name, momentum['height'], momentum['hash'])
                        logger.info(f"Processed momentum from {node_name}: Height={momentum['height']}, Hash={momentum['hash']}")
                        await self.check_for_fork()
                    else:
                        logger.warning(f"Unexpected message format from {node_name}: {response}")
                except asyncio.TimeoutError:
                    continue
                    
            except websockets.exceptions.ConnectionClosed:
                if not self.shutdown_event.is_set():
                    logger.warning(f"Connection to {node_name} node closed. Attempting to reconnect...")
                    self.nodes[node_name].is_connected = False
                    await asyncio.sleep(5)
            except Exception as e:
                if not self.shutdown_event.is_set():
                    logger.error(f"Error monitoring {node_name} node: {str(e)}")
                    self.nodes[node_name].is_connected = False
                    await asyncio.sleep(5)

    async def check_for_fork(self) -> None:
        """Compare hashes between nodes and detect forks."""
        # Check if all nodes are connected
        if not all(node.is_connected for node in self.nodes.values()):
            logger.warning("Lost Connection - One or more nodes are disconnected")
            return

        # Check if we have data from all nodes
        if any(node.last_height is None or node.last_hash is None for node in self.nodes.values()):
            logger.info("Waiting for data from all nodes...")
            return

        # Get all current heights
        heights = {node_name: node.last_height for node_name, node in self.nodes.items()}
        
        # Check if all nodes are at the same height
        if len(set(heights.values())) > 1:
            logger.info("Nodes are at different heights, waiting for sync:")
            for node_name, height in heights.items():
                logger.info(f"{node_name}: Height={height}")
            return

        # All nodes are at the same height, now compare hashes
        reference_height = self.nodes['hc1'].last_height
        reference_hash = self.nodes['hc1'].last_hash

        # Check if all nodes have the same hash
        all_same = all(
            node.last_hash == reference_hash
            for node in self.nodes.values()
        )

        if all_same:
            logger.info(f"Height: {reference_height}, Hash: {reference_hash}")
        else:
            logger.warning("Fork detected! Node status:")
            for node_name, node in self.nodes.items():
                logger.warning(f"{node_name}: Height={node.last_height}, Hash={node.last_hash}")

def run():
    monitor = ForkMonitor()
    app = monitor.create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    finally:
        logger.info("Exiting...") 