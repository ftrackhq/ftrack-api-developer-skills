#!/usr/bin/env python3
"""
Ftrack Performance Optimization Examples

This module demonstrates various performance optimization techniques
for ftrack API development.
"""

import ftrack_api
from ftrack_api import exception
import logging
import time
import datetime
import random


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


def optimized_query_examples(session):
    """Demonstrate optimized query patterns."""

    print("\n=== Query Optimization Examples ===")

    # 1. Projection optimization
    print("\n1. Projection Optimization:")

    # ✓ OPTIMAL: Only select needed attributes
    print("Good: Specific projections")
    projects = session.query("select name, full_name, status.name from Project").all()
    print(f"Retrieved {len(projects)} projects with projections")

    # ✗ SUBOPTIMAL: Fetches all attributes
    print("Bad: Fetching all attributes")
    # projects = session.query('Project').all()  # Don't do this!

    # 2. Relationship optimization
    print("\n2. Relationship Optimization:")

    # ✓ OPTIMAL: Use ancestors for hierarchy traversal
    project_id = "your-project-id"
    query = ('Task where ancestors any (id is "{0}")').format(project_id)
    print(f"Good: Using ancestors - {query}")

    # ✗ SUBOPTIMAL: Deep relationship chains
    # tasks = session.query(
    #     'Task where parent.parent.parent.id is "{0}"'.format(project_id)
    # ).all()  # Don't do this!

    # 3. Filter pushdown
    print("\n3. Filter Pushdown:")

    # ✓ OPTIMAL: Filter at database level
    query = (
        'Task where status.name is "In Progress" and priority > 2 and due_date > {0}'
    ).format(datetime.date.today())
    print(f"Good: Server-side filtering - {query}")

    # ✗ SUBOPTIMAL: Filter in Python
    # tasks = session.query('Task').all()
    # filtered = [t for t in tasks if t['status']['name'] == 'In Progress']

    # 4. Pagination strategies
    print("\n4. Pagination Strategies:")

    # ✓ OPTIMAL: Use server-side pagination
    query = session.query("Task order by created_at desc")
    query.page_size = 200  # Reduced from default 500
    results = query.all()
    print(f"Good: Paginated query with page_size={query.page_size}")

    # Cursor-based pagination example
    print("Cursor-based pagination:")
    last_id = None
    page_count = 0
    while page_count < 2:  # Limit for demo
        if last_id:
            tasks = session.query(
                'Task where id > "{0}" order by id asc limit 100'.format(last_id)
            ).all()
        else:
            tasks = session.query("Task order by id asc limit 100").all()

        if not tasks:
            break

        print(f"Page {page_count + 1}: {len(tasks)} tasks")

        # Process batch (demo only)
        for task in tasks[:2]:  # Limit output
            print(f"  - {task['name']}")

        last_id = tasks[-1]["id"]
        page_count += 1


def batch_operation_examples(session):
    """Demonstrate batch operation patterns."""

    print("\n=== Batch Operation Examples ===")

    # Get reference entities
    project = session.query("Project").first()
    task_type = session.query('Type where name is "Task"').one()
    not_started_status = session.query('Status where name is "Not Started"').one()

    if not project:
        print("No project found for batch examples")
        return

    # 1. Bulk entity creation
    print("\n1. Bulk Entity Creation:")

    # ✓ OPTIMAL: Bulk create with single commit
    new_entities = []
    for i in range(5):
        new_entities.append(
            {
                "name": f"Task {i}",
                "parent": project,
                "type": task_type,
                "status": not_started_status,
                "priority": random.randint(1, 5),
            }
        )

    print(f"Creating {len(new_entities)} tasks in bulk...")
    with session.auto_populating():
        tasks = [session.create("Task", data) for data in new_entities]
    session.commit()
    print(f"Created {len(tasks)} tasks with single commit")

    # 2. Bulk updates
    print("\n2. Bulk Updates:")

    # Get tasks to update
    tasks_to_update = session.query(
        'Task where status.name is "Not Started" limit 5'
    ).all()

    print(f"Updating {len(tasks_to_update)} tasks...")
    for task in tasks_to_update:
        task["metadata"]["last_review"] = datetime.datetime.now()
        task["priority"] = 3

    # Single commit for all updates
    session.commit()
    print("Bulk update completed with single commit")

    # 3. Efficient relationship updates
    print("\n3. Relationship Updates:")

    # Pre-load reference entities
    status_completed = session.query('Status where name is "Completed"').one()

    # Bulk status update
    active_tasks = session.query(
        'Task where status.name is "In Progress" limit 3'
    ).all()

    print(f"Updating status for {len(active_tasks)} tasks...")
    for task in active_tasks:
        task["status"] = status_completed

    session.commit()
    print("Relationship update completed")


def caching_examples(session):
    """Demonstrate caching strategies."""

    print("\n=== Caching Examples ===")

    # Cache statistics
    print(f"Current cache size: {len(session.cache)}")
    print(f"Cached types: {session.cache.entity_types()}")

    # Strategic cache clearing
    print("\nCache management:")
    session.cache.clear("Task")  # Clear only Task cache
    print("Cleared Task cache")

    # Cache warm-up pattern
    print("\nCache warm-up:")
    project_ids = ["proj1", "proj2", "proj3"]  # Replace with real IDs
    for proj_id in project_ids:
        try:
            session.query(f'Project where id is "{proj_id}"').one()
        except:
            pass  # Ignore errors in warm-up
    print(f"Warmed cache with {len(project_ids)} projects")


def event_optimization_examples(session):
    """Demonstrate event system optimization."""

    print("\n=== Event Optimization Examples ===")

    # 1. Efficient event subscription
    print("\n1. Targeted Event Subscription:")

    def handle_status_change(event):
        """Handle only status change events."""
        print(f"Status changed: {event}")
        return {"success": True}

    # ✓ OPTIMAL: Targeted subscription
    subscription = session.event_hub.subscribe(
        'topic=ftrack.update and source.entity_type is "Task" '
        'and data.changes.status.old is "In Progress"',
        handle_status_change,
    )
    print("Subscribed to specific status change events")

    # 2. Event filtering in handler
    print("\n2. Event Filtering:")

    def handle_specific_updates(event):
        """Handle only relevant updates efficiently."""
        topic = event["topic"]
        data = event["data"]

        # Early exit for irrelevant events
        if not topic.endswith(".update"):
            return {"success": True}

        entity_type = data["source"]["entity_type"]
        if entity_type != "Task":
            return {"success": True}

        # Process only specific changes
        if "changes" in data and "status" in data["changes"]:
            print(f"Processing status change: {data['changes']['status']}")

        return {"success": True}

    subscription2 = session.event_hub.subscribe(
        "topic=ftrack.*",  # Broad but filtered in handler
        handle_specific_updates,
    )
    print("Subscribed with in-handler filtering")

    # Clean up
    subscription.unsubscribe()
    subscription2.unsubscribe()


def performance_monitoring_examples():
    """Demonstrate performance monitoring techniques."""

    print("\n=== Performance Monitoring Examples ===")

    # Query timing decorator
    def time_query(func):
        """Time a query execution."""

        def wrapper(query_str, *args, **kwargs):
            start = time.time()
            result = func(query_str, *args, **kwargs)
            elapsed = time.time() - start
            print(f"Query took {elapsed:.3f}s: {query_str[:50]}...")
            return result

        return wrapper

    # Performance logging
    class PerformanceLogger:
        """Log performance metrics."""

        def __init__(self):
            self.queries = []
            self.total_time = 0

        def log_query(self, query_str, elapsed):
            """Log query performance."""
            self.queries.append((query_str, elapsed))
            self.total_time += elapsed

        def get_stats(self):
            """Get performance statistics."""
            return {
                "query_count": len(self.queries),
                "total_time": self.total_time,
                "avg_time": self.total_time / len(self.queries) if self.queries else 0,
            }

    logger = PerformanceLogger()

    # Example usage
    print("Performance monitoring setup complete")
    print(f"Logger ready: {logger.get_stats()}")


def main():
    """Main demonstration function."""

    print("Ftrack Performance Optimization Examples")
    print("=" * 60)

    try:
        # Connect to ftrack
        session = ftrack_api.Session()

        # Run examples
        optimized_query_examples(session)
        batch_operation_examples(session)
        caching_examples(session)
        event_optimization_examples(session)
        performance_monitoring_examples()

        # Clean up
        session.close()

    except exception.FtrackException as e:
        print(f"Ftrack error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
