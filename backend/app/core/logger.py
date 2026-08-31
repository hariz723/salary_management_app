import logging
import sys

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=DATE_FORMAT,
    handlers=[logging.StreamHandler(sys.stdout)],
)


def get_logger(name: str = "app") -> logging.Logger:
    """Returns a standardized logger instance with uniform formatting."""
    return logging.getLogger(name)


logger = get_logger("acme_salary")
