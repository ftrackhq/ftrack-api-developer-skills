#!/usr/bin/env python3
"""
Ftrack Exception Handling Examples

This module demonstrates comprehensive exception handling patterns
for ftrack API development.
"""

import ftrack_api
from ftrack_api import exception
import logging
import time
from functools import wraps


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


def safe_ftrack_operation(session, task_id):
    """Safely perform ftrack operations with proper error handling."""
    try:
        # Your ftrack operation
        entity = session.query(f'Task where id is "{task_id}"').one()

    except exception.NoResultFoundError:
        logging.warning(f"Task {task_id} not found - creating new one")
        entity = session.create("Task", {"name": f"Recovered Task {task_id}"})

    except exception.MultipleResultsFoundError:
        logging.warning(f"Multiple tasks found for {task_id} - using first")
        entity = session.query(f'Task where id is "{task_id}"').first()

    except exception.PermissionError as e:
        logging.error(f"Permission denied for task {task_id}: {e}")
        raise

    except exception.ServerUnreachableError:
        logging.error("Cannot connect to ftrack server")
        # Implement retry logic with exponential backoff
        raise

    except exception.ServerError as e:
        logging.error(f"Server error: {e}")
        # Check error details and handle appropriately
        if "timeout" in str(e).lower():
            # Handle timeout - maybe retry with smaller batch
            pass
        elif "rate limit" in str(e).lower():
            # Handle rate limiting
            time.sleep(5)  # Wait before retry
        raise

    except exception.ComponentInLocationError as e:
        logging.error(f"Component already in location: {e}")
        # Handle duplicate component scenario
        raise

    except exception.ComponentNotInLocationError as e:
        logging.error(f"Component not found in location: {e}")
        # Handle missing component scenario
        raise

    except exception.QueryError as e:
        logging.error(f"Query error: {e}")
        # Handle query syntax or execution errors
        raise

    except exception.OperationError as e:
        logging.error(f"Operation failed: {e}")
        # Handle general operation failures
        raise

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        session.rollback()
        raise

    return entity


def robust_event_handler(event):
    """Event handler with comprehensive error handling."""
    session = event["session"]
    topic = event["topic"]

    try:
        # Process event
        if topic.endswith(".update"):
            entity_id = event["source"]["id"]
            entity = session.get(entity_id)

            # Handle entity update
            logging.info(f"Processing update for {entity['entity_type']} {entity_id}")

        return {"success": True, "message": "Event processed"}

    except exception.EntityNotFoundError:
        logging.warning(f"Entity not found for event: {event}")
        return {"success": False, "message": "Entity not found"}

    except exception.PermissionError:
        logging.warning(f"Permission denied for event: {event}")
        return {"success": False, "message": "Permission denied"}

    except exception.ServerError as e:
        logging.error(f"Server error processing event: {e}")
        # Consider re-queuing the event for later processing
        return {"success": False, "message": "Server error"}

    except exception.ComponentInLocationError as e:
        logging.error(f"Component location conflict: {e}")
        return {"success": False, "message": "Component conflict"}

    except exception.ComponentNotInLocationError as e:
        logging.error(f"Component not found in location: {e}")
        return {"success": False, "message": "Component not found"}

    except exception.QueryError as e:
        logging.error(f"Query execution error: {e}")
        return {"success": False, "message": "Query error"}

    except Exception as e:
        logging.error(f"Unexpected error in event handler: {e}", exc_info=True)
        # Critical error - should be investigated
        return {"success": False, "message": "Handler failed"}


def retry_on_server_error(max_retries=3, base_delay=1):
    """Decorator to retry operations on server errors."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exception.ServerUnreachableError as e:
                    last_exception = e
                    delay = base_delay * (2**attempt)  # Exponential backoff
                    logging.warning(
                        f"Attempt {attempt + 1} failed, retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                except exception.ServerTimeoutError as e:
                    last_exception = e
                    delay = base_delay * (2**attempt)
                    logging.warning(
                        f"Timeout on attempt {attempt + 1}, retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                except exception.ComponentInLocationError as e:
                    # Don't retry on component conflicts
                    raise
                except exception.ComponentNotInLocationError as e:
                    # Don't retry on missing components
                    raise
                except exception.QueryError as e:
                    # Don't retry on query errors
                    raise
                except exception.ServerError as e:
                    # Only retry on specific server errors
                    if "temporary" in str(e).lower():
                        last_exception = e
                        delay = base_delay * (2**attempt)
                        logging.warning(f"Temporary error, retrying in {delay}s: {e}")
                        time.sleep(delay)
                    else:
                        raise

            raise last_exception if last_exception else Exception("Unknown error")

        return wrapper

    return decorator


@retry_on_server_error(max_retries=5)
def get_entity_with_retry(session, entity_id):
    """Get entity with automatic retry on server errors."""
    return session.query(f'Task where id is "{entity_id}"').one()


class TaskWorkflowError(Exception):
    """Base exception for task workflow issues."""

    pass


class InvalidTaskStateError(TaskWorkflowError):
    """Task is in invalid state for operation."""

    pass


class TaskPermissionError(TaskWorkflowError):
    """Insufficient permissions for task operation."""

    pass


def validate_and_process_task(session, task_id, new_status):
    """Validate task state and process with custom exceptions."""
    try:
        task = session.query(f'Task where id is "{task_id}"').one()

        # Validate current state
        if task["status"]["name"] == "Completed":
            raise InvalidTaskStateError(f"Task {task_id} is already completed")

        if task["status"]["name"] == "On Hold":
            raise InvalidTaskStateError(
                f"Task {task_id} is on hold and cannot be modified"
            )

        # Check permissions
        if not has_permission(session, "modify", task):
            raise TaskPermissionError(f"No permission to modify task {task_id}")

        # Process task
        task["status"] = session.query(f'Status where name is "{new_status}"').one()
        session.commit()

    except exception.NoResultFoundError:
        raise TaskWorkflowError(f"Task {task_id} not found")
    except exception.MultipleResultsFoundError:
        raise TaskWorkflowError(f"Multiple tasks found for {task_id}")
    except exception.FtrackException as e:
        session.rollback()
        raise TaskWorkflowError(f"Ftrack error processing task: {e}")
    except Exception as e:
        session.rollback()
        raise TaskWorkflowError(f"Unexpected error: {e}")


def has_permission(session, action, entity):
    """Check if current user has permission for action on entity."""
    # Implement your permission checking logic
    return True


if __name__ == "__main__":
    # Example usage
    print("Ftrack Exception Handling Examples")
    print("=" * 50)

    # Create a mock session for demonstration
    class MockSession:
        def query(self, query_str):
            return self

        def one(self):
            raise exception.NoResultFoundError("Entity not found")

        def rollback(self):
            print("Rolling back transaction")

    session = MockSession()

    # Test safe operation
    try:
        result = safe_ftrack_operation(session, "test-task-id")
    except Exception as e:
        print(f"Handled exception: {e}")

    # Test retry decorator
    try:
        result = get_entity_with_retry(session, "test-id")
    except Exception as e:
        print(f"Retry failed: {e}")

    print("\nException handling examples completed!")
