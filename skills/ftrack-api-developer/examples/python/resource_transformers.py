#!/usr/bin/env python3
"""
Ftrack Resource Identifier Transformer Examples

This module demonstrates various resource identifier transformer implementations
for customizing how ftrack stores and retrieves file paths.
"""

import os
import re
import datetime
from ftrack_api.resource_identifier_transformer import ResourceIdentifierTransformer


class ProjectBasedTransformer(ResourceIdentifierTransformer):
    """Organize files by project and entity type."""

    def __init__(self, session):
        super(ProjectBasedTransformer, self).__init__(session)

    def encode(self, resource_identifier, context=None):
        """Transform to project-based structure for storage."""
        # Extract project info from context
        project_name = "unknown"
        entity_type = "unknown"

        if context and "component" in context:
            component = context["component"]
            # Get project from component's parent hierarchy
            if "project" in component:
                project_name = component["project"].get("name", "unknown")
            entity_type = component.get("entity_type", "unknown")

        # Create project-based path
        safe_project = project_name.replace(" ", "_").lower()
        return f"projects/{safe_project}/{entity_type.lower()}/{resource_identifier}"

    def decode(self, resource_identifier, context=None):
        """Restore original filename from project-based structure."""
        # Remove project/entity_type prefix
        parts = resource_identifier.split("/")
        if len(parts) >= 3:
            return "/".join(parts[3:])  # Return original filename
        return resource_identifier


class VersionedFileTransformer(ResourceIdentifierTransformer):
    """Add version numbers to filenames."""

    def __init__(self, session):
        super(VersionedFileTransformer, self).__init__(session)

    def encode(self, resource_identifier, context=None):
        """Add version to filename for storage."""
        # Get version from component context
        version = 1
        if context and "component" in context:
            component = context["component"]
            version = component.get("version", 1)

        # Add version to filename
        base, ext = os.path.splitext(resource_identifier)
        return f"{base}_v{version:03d}{ext}"

    def decode(self, resource_identifier, context=None):
        """Remove version from filename for local use."""
        # Remove version suffix
        import re

        match = re.match(r"(.+)_v\d+(\..+)$", resource_identifier)
        if match:
            return match.group(1) + match.group(2)
        return resource_identifier


class DateBasedTransformer(ResourceIdentifierTransformer):
    """Organize files by date."""

    def __init__(self, session):
        super(DateBasedTransformer, self).__init__(session)

    def encode(self, resource_identifier, context=None):
        """Transform to date-based structure for storage."""
        # Use current date or context date
        date_obj = datetime.datetime.now()
        if context and "date" in context:
            date_obj = context["date"]
        elif context and "component" in context:
            # Try to get date from component metadata
            component = context["component"]
            if "metadata" in component and "date" in component["metadata"]:
                date_obj = component["metadata"]["date"]

        date_str = date_obj.strftime("%Y/%m/%d")
        return f"archive/{date_str}/{resource_identifier}"

    def decode(self, resource_identifier, context=None):
        """Remove date prefix for local use."""
        # Remove archive/YYYY/MM/DD/ prefix
        parts = resource_identifier.split("/")
        if len(parts) >= 4 and parts[0] == "archive":
            return "/".join(parts[4:])  # Return original filename
        return resource_identifier


class ContextAwareTransformer(ResourceIdentifierTransformer):
    """Transformer that uses full context for complex rules."""

    def __init__(self, session):
        super(ContextAwareTransformer, self).__init__(session)

    def encode(self, resource_identifier, context=None):
        """Apply context-aware transformation for storage."""
        # Extract all relevant context
        project_name = "unknown"
        entity_type = "unknown"
        entity_id = "unknown"
        version = 1
        user = "unknown"

        if context and "component" in context:
            component = context["component"]

            # Get project from component hierarchy
            if "project" in component:
                project_name = component["project"].get("name", "unknown")

            entity_type = component.get("entity_type", "unknown")
            entity_id = component.get("id", "unknown")
            version = component.get("version", 1)

            # Get user from session if available
            if hasattr(self.session, "api_user"):
                user = self.session.api_user

        # Create complex path structure
        safe_project = project_name.replace(" ", "_").lower()

        path_parts = [
            "ftrack",
            safe_project,
            entity_type.lower(),
            entity_id[:2],  # First 2 chars for sharding
            entity_id,
            f"v{version:03d}",
            user,
            resource_identifier,  # Original filename
        ]

        return os.path.join(*path_parts)

    def decode(self, resource_identifier, context=None):
        """Extract original filename from transformed path."""
        # Reverse the transformation
        parts = resource_identifier.split(os.sep)
        if len(parts) >= 2:
            return parts[-1]  # Return original filename
        return resource_identifier


def test_transformer(transformer, test_cases):
    """Test transformer with various inputs."""
    from ftrack_api.resource_identifier import ResourceIdentifier

    print(f"\nTesting {transformer.__class__.__name__}:")
    print("=" * 60)

    for original, context, expected_encode, expected_decode in test_cases:
        # Test encode
        encoded = transformer.encode(original, context)

        # Test decode
        decoded = transformer.decode(encoded, context)

        print(f"Original: {original}")
        print(f"Context: {context}")
        print(f"Encoded: {encoded}")
        print(f"Expected: {expected_encode}")
        print(f"Encode Match: {encoded == expected_encode}")
        print(f"Decoded: {decoded}")
        print(f"Expected: {expected_decode}")
        print(f"Decode Match: {decoded == expected_decode}")
        print("-" * 60)


if __name__ == "__main__":
    # Create mock session for testing
    class MockSession:
        api_user = "test_user"

    session = MockSession()

    # Test ProjectBasedTransformer
    project_transformer = ProjectBasedTransformer(session)
    project_test_cases = [
        (
            "character_model.fbx",
            {
                "component": {
                    "project": {"name": "My Project"},
                    "entity_type": "Asset",
                    "version": 2,
                }
            },
            "projects/my_project/asset/character_model.fbx",
            "character_model.fbx",
        ),
        (
            "shot_010_comp.v05.nk",
            {
                "component": {
                    "project": {"name": "Commercial X"},
                    "entity_type": "Task",
                    "version": 5,
                }
            },
            "projects/commercial_x/task/shot_010_comp.v05.nk",
            "shot_010_comp.v05.nk",
        ),
    ]

    test_transformer(project_transformer, project_test_cases)

    # Test VersionedFileTransformer
    version_transformer = VersionedFileTransformer(session)
    version_test_cases = [
        ("model.obj", {"component": {"version": 3}}, "model_v003.obj", "model.obj"),
        (
            "texture.png",
            {"component": {"version": 15}},
            "texture_v015.png",
            "texture.png",
        ),
    ]

    test_transformer(version_transformer, version_test_cases)

    print("\nAll tests completed!")
