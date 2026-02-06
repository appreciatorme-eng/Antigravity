"""
Centralized logging configuration for ai-newsletter execution scripts.
"""
import logging
import os

# Default log level can be overridden via environment variable
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance.

    Args:
        name: Logger name (typically __name__ or module name)

    Returns:
        Configured logger instance
    """
    # Configure root logger only once
    if not logging.getLogger().handlers:
        logging.basicConfig(
            level=getattr(logging, LOG_LEVEL, logging.INFO),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    return logging.getLogger(name)
