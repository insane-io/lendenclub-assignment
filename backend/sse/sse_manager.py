import asyncio
from collections import defaultdict
from typing import Any, Dict, List


class SSEManager:
    def __init__(self) -> None:
        # map user_id -> list of asyncio.Queue
        self._subs: Dict[int, List[asyncio.Queue]] = defaultdict(list)
        self._loop: asyncio.AbstractEventLoop | None = None

    def init_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Store main event loop reference so publish can be called from sync threads."""
        self._loop = loop

    def subscribe(self, user_id: int) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subs[user_id].append(q)
        return q

    def unsubscribe(self, user_id: int, q: asyncio.Queue) -> None:
        try:
            self._subs[user_id].remove(q)
        except Exception:
            pass

    def publish(self, user_id: int, data: Any) -> None:
        """Thread-safe publish: schedule put_nowait on the main loop for each subscriber queue."""
        loop = self._loop
        if loop is None:
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None
        if not loop:
            # no loop available: drop silently
            return

        queues = list(self._subs.get(user_id, []))
        for q in queues:
            loop.call_soon_threadsafe(q.put_nowait, data)


sse_manager = SSEManager()
