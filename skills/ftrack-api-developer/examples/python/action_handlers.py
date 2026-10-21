#!/usr/bin/env python3
"""
Ftrack Action Handler Examples

This module demonstrates comprehensive action handler patterns
for ftrack actions, including both base and advanced implementations.

Official Docs: https://github.com/ftrackhq/ftrack-action-handler
"""

import ftrack_api
import logging
import os
import sys
from ftrack_action_handler.action import BaseAction


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==============================================================================
# BASIC ACTION HANDLER PATTERN
# ==============================================================================

class SimpleStatusUpdateAction(BaseAction):
    """
    Simple action to update task status.

    This demonstrates the minimum required methods for a basic action:
    - register(): Called to subscribe the action to ftrack events
    - discover(): Determines if action should be shown for selected entities
    - launch(): Executes the action logic
    """

    label = 'Simple Status Update'
    identifier = 'com.example.simple_status_update'
    description = 'Update task status to completed'

    def register(self):
        """Register action with the event hub."""
        # Subscribe to action discovery
        self.session.event_hub.subscribe(
            'topic=ftrack.action.discover and source.user.username={0}'.format(
                self.session.api_user
            ),
            self.discover
        )

        # Subscribe to action launch
        self.session.event_hub.subscribe(
            'topic=ftrack.action.launch and data.actionIdentifier={0}'.format(
                self.identifier
            ),
            self.launch
        )

    def discover(self, event):
        """
        Return action config if action should be available.

        Args:
            event: Discovery event containing selection information

        Returns:
            dict: Action configuration or None if not applicable
        """
        # Get selected entities
        selection = event['data'].get('selection', [])

        # Only show for Task entities
        if not selection:
            return

        # Check if all selected items are tasks
        for item in selection:
            if item.get('entityType') != 'task':
                return None

        # Return action configuration
        return {
            'items': [{
                'label': self.label,
                'description': self.description,
                'actionIdentifier': self.identifier,
                'icon': 'https://example.com/icon.png'  # Optional icon
            }]
        }

    def launch(self, event):
        """
        Execute the action.

        Args:
            event: Launch event containing selection and user data

        Returns:
            dict: Result with success status and message
        """
        selection = event['data'].get('selection', [])

        if not selection:
            return {
                'success': False,
                'message': 'No entities selected'
            }

        try:
            # Get completed status
            completed_status = self.session.query(
                'Status where name is "Completed"'
            ).one()

            # Update each selected task
            updated_count = 0
            for item in selection:
                entity_id = item['entityId']
                task = self.session.query(
                    f'Task where id is "{entity_id}"'
                ).one()

                task['status'] = completed_status
                updated_count += 1

            # Commit changes
            self.session.commit()

            return {
                'success': True,
                'message': f'Updated {updated_count} task(s) to Completed'
            }

        except Exception as e:
            self.session.rollback()
            logger.error(f'Action failed: {e}', exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }


# ==============================================================================
# ADVANCED ACTION HANDLER WITH UI FORM
# ==============================================================================

class AdvancedTaskCreationAction(BaseAction):
    """
    Advanced action with custom UI form for user input.

    This demonstrates:
    - Custom interface() method for UI forms
    - Multiple form field types (text, select, boolean, number)
    - Form validation
    - Complex entity creation logic
    """

    label = 'Advanced Task Creator'
    identifier = 'com.example.advanced_task_creator'
    description = 'Create tasks with custom configuration'

    def register(self):
        """Register action with event hub."""
        self.session.event_hub.subscribe(
            'topic=ftrack.action.discover and source.user.username={0}'.format(
                self.session.api_user
            ),
            self.discover
        )

        self.session.event_hub.subscribe(
            'topic=ftrack.action.launch and data.actionIdentifier={0}'.format(
                self.identifier
            ),
            self.launch
        )

    def discover(self, event):
        """Show action only for Project entities."""
        selection = event['data'].get('selection', [])

        if not selection:
            return

        # Only show for single project selection
        if len(selection) == 1 and selection[0].get('entityType') == 'show':
            return {
                'items': [{
                    'label': self.label,
                    'description': self.description,
                    'actionIdentifier': self.identifier,
                    'icon': 'https://example.com/advanced-icon.png'
                }]
            }

    def interface(self, session, entities, values):
        """
        Return custom UI form for user input.

        Args:
            session: ftrack session
            entities: Selected entities
            values: Current form values (for validation/updates)

        Returns:
            list: UI form elements configuration
        """
        # Get available statuses for dropdown
        statuses = session.query('Status').all()
        status_options = [
            {'label': status['name'], 'value': status['id']}
            for status in statuses
        ]

        # Get available task types
        task_types = session.query('Type where name like "Task%"').all()
        type_options = [
            {'label': task_type['name'], 'value': task_type['id']}
            for task_type in task_types
        ]

        # Build form interface
        return [
            {
                'type': 'label',
                'value': '## Task Creation Settings'
            },
            {
                'label': 'Task Name Prefix',
                'name': 'task_prefix',
                'type': 'text',
                'value': values.get('task_prefix', 'TASK_'),
                'empty_text': 'Enter task name prefix'
            },
            {
                'label': 'Number of Tasks',
                'name': 'task_count',
                'type': 'number',
                'value': values.get('task_count', 5),
                'empty_text': 'Enter number of tasks to create'
            },
            {
                'label': 'Task Type',
                'name': 'task_type',
                'type': 'enumerator',
                'data': type_options,
                'value': values.get('task_type', type_options[0]['value'] if type_options else None)
            },
            {
                'label': 'Initial Status',
                'name': 'status',
                'type': 'enumerator',
                'data': status_options,
                'value': values.get('status', status_options[0]['value'] if status_options else None)
            },
            {
                'label': 'Priority',
                'name': 'priority',
                'type': 'number',
                'value': values.get('priority', 3),
                'empty_text': 'Priority (1-5)'
            },
            {
                'label': 'Add to Milestone',
                'name': 'add_milestone',
                'type': 'boolean',
                'value': values.get('add_milestone', False)
            },
            {
                'label': 'Milestone Name',
                'name': 'milestone_name',
                'type': 'text',
                'value': values.get('milestone_name', 'Sprint Milestone'),
                'empty_text': 'Milestone name (if creating)',
                # Conditional visibility based on add_milestone
                'condition': 'add_milestone'
            },
            {
                'type': 'label',
                'value': '---'
            },
            {
                'type': 'label',
                'value': '*Tasks will be created under the selected project*'
            }
        ]

    def launch(self, event):
        """
        Execute action with form values.

        Args:
            event: Launch event with selection and form values

        Returns:
            dict: Result or updated interface for validation errors
        """
        selection = event['data'].get('selection', [])
        values = event['data'].get('values', {})

        if not selection:
            return {
                'success': False,
                'message': 'No project selected'
            }

        # If no values, show interface
        if not values:
            return {
                'items': self.interface(self.session, selection, values)
            }

        # Validate form input
        validation_error = self._validate_input(values)
        if validation_error:
            return {
                'success': False,
                'message': validation_error
            }

        try:
            # Get project entity
            project_id = selection[0]['entityId']
            project = self.session.query(
                f'Project where id is "{project_id}"'
            ).one()

            # Get status and type entities
            status = self.session.get('Status', values['status'])
            task_type = self.session.get('Type', values['task_type'])

            # Create milestone if requested
            milestone = None
            if values.get('add_milestone', False):
                milestone = self.session.create('Milestone', {
                    'name': values.get('milestone_name', 'Sprint Milestone'),
                    'project': project,
                    'start_date': self.session.query('select now()').one()
                })

            # Create tasks
            created_tasks = []
            task_count = int(values.get('task_count', 5))
            task_prefix = values.get('task_prefix', 'TASK_')
            priority = int(values.get('priority', 3))

            for i in range(1, task_count + 1):
                task_data = {
                    'name': f'{task_prefix}{i:03d}',
                    'parent': project,
                    'type': task_type,
                    'status': status,
                    'priority': priority
                }

                # Add milestone if created
                if milestone:
                    task_data['milestone'] = milestone

                task = self.session.create('Task', task_data)
                created_tasks.append(task)

                logger.info(f'Created task: {task["name"]}')

            # Commit all changes
            self.session.commit()

            message = f'Successfully created {len(created_tasks)} tasks'
            if milestone:
                message += f' under milestone "{milestone["name"]}"'

            return {
                'success': True,
                'message': message
            }

        except Exception as e:
            self.session.rollback()
            logger.error(f'Task creation failed: {e}', exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }

    def _validate_input(self, values):
        """
        Validate form input values.

        Args:
            values: Form values dictionary

        Returns:
            str: Error message if validation fails, None otherwise
        """
        task_count = values.get('task_count')
        if not task_count or task_count < 1 or task_count > 100:
            return 'Task count must be between 1 and 100'

        priority = values.get('priority')
        if priority and (priority < 1 or priority > 5):
            return 'Priority must be between 1 and 5'

        task_prefix = values.get('task_prefix', '')
        if not task_prefix.strip():
            return 'Task prefix cannot be empty'

        if values.get('add_milestone') and not values.get('milestone_name', '').strip():
            return 'Milestone name is required when creating milestone'

        return None


# ==============================================================================
# ADVANCED PATTERN: MULTI-STEP ACTION WITH PROGRESS
# ==============================================================================

class BatchProcessingAction(BaseAction):
    """
    Advanced action with multi-step processing and progress tracking.

    This demonstrates:
    - Asynchronous/background processing pattern
    - Progress reporting via notes
    - Error handling and recovery
    - Processing multiple entities in batches
    """

    label = 'Batch Process Assets'
    identifier = 'com.example.batch_process'
    description = 'Process multiple assets in batch'

    def register(self):
        """Register action."""
        self.session.event_hub.subscribe(
            'topic=ftrack.action.discover and source.user.username={0}'.format(
                self.session.api_user
            ),
            self.discover
        )

        self.session.event_hub.subscribe(
            'topic=ftrack.action.launch and data.actionIdentifier={0}'.format(
                self.identifier
            ),
            self.launch
        )

    def discover(self, event):
        """Show for multiple task selection."""
        selection = event['data'].get('selection', [])

        # Require at least 2 tasks
        if len(selection) < 2:
            return

        # All must be tasks
        if all(item.get('entityType') == 'task' for item in selection):
            return {
                'items': [{
                    'label': self.label,
                    'description': self.description,
                    'actionIdentifier': self.identifier
                }]
            }

    def launch(self, event):
        """Execute batch processing."""
        selection = event['data'].get('selection', [])

        try:
            # Create note for progress tracking
            user = self.session.query(
                f'User where username is "{self.session.api_user}"'
            ).one()

            project_id = selection[0].get('entityId')
            project = self.session.query(
                f'Project where id is "{project_id}"'
            ).first()

            progress_note = self.session.create('Note', {
                'content': 'Batch processing started...',
                'author': user,
                'category': 'Internal note'
            })

            # Add note to project if available
            if project:
                project['notes'].append(progress_note)

            self.session.commit()

            # Process in batches
            batch_size = 10
            total = len(selection)
            processed = 0
            failed = []

            for i in range(0, len(selection), batch_size):
                batch = selection[i:i + batch_size]

                # Process batch
                for item in batch:
                    try:
                        self._process_entity(item)
                        processed += 1
                    except Exception as e:
                        logger.error(f'Failed to process {item["entityId"]}: {e}')
                        failed.append(item['entityId'])

                # Update progress
                progress_pct = int((processed / total) * 100)
                progress_note['content'] = (
                    f'Batch processing: {progress_pct}% complete '
                    f'({processed}/{total} entities)'
                )
                self.session.commit()

            # Final update
            if failed:
                progress_note['content'] = (
                    f'Batch processing completed with errors.\n'
                    f'Processed: {processed}/{total}\n'
                    f'Failed: {len(failed)} entities'
                )
                success_status = False
                message = f'Completed with {len(failed)} errors'
            else:
                progress_note['content'] = (
                    f'Batch processing completed successfully.\n'
                    f'Processed: {processed}/{total} entities'
                )
                success_status = True
                message = f'Successfully processed {processed} entities'

            self.session.commit()

            return {
                'success': success_status,
                'message': message
            }

        except Exception as e:
            self.session.rollback()
            logger.error(f'Batch processing failed: {e}', exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }

    def _process_entity(self, item):
        """
        Process individual entity.

        Args:
            item: Entity item from selection
        """
        entity_id = item['entityId']
        entity = self.session.get('Task', entity_id)

        # Example processing: update metadata
        entity['metadata']['batch_processed'] = True
        entity['metadata']['processed_by'] = self.session.api_user

        # Add more processing logic here
        logger.info(f'Processed entity: {entity["name"]}')


# ==============================================================================
# ADVANCED PATTERN: CONTEXT-AWARE ACTION
# ==============================================================================

class ContextAwareAction(BaseAction):
    """
    Action that adapts based on selection context.

    This demonstrates:
    - Different behavior based on entity type
    - Hierarchical entity processing
    - Dynamic interface based on context
    - Entity relationship handling
    """

    label = 'Context Aware Action'
    identifier = 'com.example.context_aware'
    description = 'Smart action that adapts to selection'

    def register(self):
        """Register action."""
        self.session.event_hub.subscribe(
            'topic=ftrack.action.discover and source.user.username={0}'.format(
                self.session.api_user
            ),
            self.discover
        )

        self.session.event_hub.subscribe(
            'topic=ftrack.action.launch and data.actionIdentifier={0}'.format(
                self.identifier
            ),
            self.launch
        )

    def discover(self, event):
        """Show for projects, sequences, shots, or tasks."""
        selection = event['data'].get('selection', [])

        if not selection:
            return

        # Support multiple entity types
        supported_types = ['show', 'sequence', 'shot', 'task']
        entity_type = selection[0].get('entityType')

        if entity_type in supported_types:
            return {
                'items': [{
                    'label': self.label,
                    'description': f'{self.description} ({entity_type})',
                    'actionIdentifier': self.identifier
                }]
            }

    def interface(self, session, entities, values):
        """Return context-aware interface."""
        entity_type = entities[0].get('entityType')

        # Base interface elements
        interface = [
            {
                'type': 'label',
                'value': f'## Process {entity_type.title()}'
            }
        ]

        # Add entity-specific options
        if entity_type == 'show':
            interface.extend([
                {
                    'label': 'Include all sequences',
                    'name': 'include_sequences',
                    'type': 'boolean',
                    'value': values.get('include_sequences', True)
                },
                {
                    'label': 'Include all shots',
                    'name': 'include_shots',
                    'type': 'boolean',
                    'value': values.get('include_shots', False)
                }
            ])
        elif entity_type == 'task':
            interface.extend([
                {
                    'label': 'Update parent entities',
                    'name': 'update_parents',
                    'type': 'boolean',
                    'value': values.get('update_parents', True)
                }
            ])

        # Common options
        interface.append({
            'label': 'Operation',
            'name': 'operation',
            'type': 'enumerator',
            'data': [
                {'label': 'Add metadata', 'value': 'add_metadata'},
                {'label': 'Create report', 'value': 'create_report'},
                {'label': 'Update status', 'value': 'update_status'}
            ],
            'value': values.get('operation', 'add_metadata')
        })

        return interface

    def launch(self, event):
        """Execute context-aware action."""
        selection = event['data'].get('selection', [])
        values = event['data'].get('values', {})

        if not values:
            return {
                'items': self.interface(self.session, selection, values)
            }

        try:
            entity_type = selection[0].get('entityType')
            entity_id = selection[0]['entityId']

            # Get entities to process based on context
            entities = self._get_entities_for_context(
                entity_id,
                entity_type,
                values
            )

            # Perform operation
            operation = values.get('operation', 'add_metadata')
            result = self._perform_operation(entities, operation)

            self.session.commit()

            return {
                'success': True,
                'message': result
            }

        except Exception as e:
            self.session.rollback()
            logger.error(f'Context-aware action failed: {e}', exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }

    def _get_entities_for_context(self, entity_id, entity_type, values):
        """Get entities to process based on context."""
        entities = []

        if entity_type == 'show':
            # Get project
            project = self.session.get('Project', entity_id)
            entities.append(project)

            # Get sequences if requested
            if values.get('include_sequences'):
                sequences = self.session.query(
                    f'Sequence where project.id is "{entity_id}"'
                ).all()
                entities.extend(sequences)

            # Get shots if requested
            if values.get('include_shots'):
                shots = self.session.query(
                    f'Shot where project.id is "{entity_id}"'
                ).all()
                entities.extend(shots)
        else:
            # Single entity processing
            entity = self.session.get(entity_type.title(), entity_id)
            entities.append(entity)

        return entities

    def _perform_operation(self, entities, operation):
        """Perform the selected operation on entities."""
        if operation == 'add_metadata':
            for entity in entities:
                entity['metadata']['context_processed'] = True
            return f'Added metadata to {len(entities)} entities'

        elif operation == 'create_report':
            # Report generation logic
            return f'Generated report for {len(entities)} entities'

        elif operation == 'update_status':
            # Status update logic
            return f'Updated status for {len(entities)} entities'

        return 'Operation completed'


# ==============================================================================
# ACTION REGISTRATION AND MAIN LOOP
# ==============================================================================

def register(session):
    """
    Register all actions with the session.

    Args:
        session: ftrack_api.Session instance
    """
    # Instantiate actions
    actions = [
        SimpleStatusUpdateAction(session),
        AdvancedTaskCreationAction(session),
        BatchProcessingAction(session),
        ContextAwareAction(session)
    ]

    # Register each action
    for action in actions:
        action.register()
        logger.info(f'Registered action: {action.identifier}')

    return actions


def main():
    """Main entry point for action handler."""
    # Create session
    session = ftrack_api.Session()

    # Register actions
    actions = register(session)

    # Wait for events
    logger.info('Action handler started. Waiting for events...')
    session.event_hub.wait()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info('Action handler stopped by user')
        sys.exit(0)
    except Exception as e:
        logger.error(f'Action handler failed: {e}', exc_info=True)
        sys.exit(1)
