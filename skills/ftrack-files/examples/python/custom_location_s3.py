#!/usr/bin/env python3
"""
Ftrack Custom Location Example

This example demonstrates how to create a custom location for ftrack
that stores files in S3 storage.
"""

import ftrack_api
import os
import hashlib
import tempfile
from ftrack_api.entity.location import Location
from ftrack_api.exception import LocationError


class CustomS3Location(Location):
    """Custom location implementation for S3 storage."""

    def __init__(self, session, prefix):
        """Initialize custom location."""
        super(CustomS3Location, self).__init__(session, prefix)

        # Configuration
        self.bucket_name = "your-ftrack-bucket"
        self.region = "us-west-2"
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        # Initialize S3 client
        import boto3

        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
        )

        # Local cache for temporary files
        self.local_cache = tempfile.mkdtemp()

    def get_filesystem_path(self, component):
        """Get filesystem path for component."""
        # Generate consistent path based on component
        if "file" in component and "path" in component["file"]:
            return os.path.join(self.local_cache, component["file"]["path"])

        # Fallback path generation
        file_name = component.get("name", "unknown")
        return os.path.join(self.local_cache, file_name)

    def add_file(self, component, destination, file):
        """Upload file to S3 storage."""
        # Generate S3 key
        s3_key = self._generate_s3_key(component)

        # Upload to S3
        try:
            self.s3.upload_file(file, self.bucket_name, s3_key)

            # Update component metadata
            component["file"] = {"path": s3_key, "size": os.path.getsize(file)}

            # Store file type
            _, ext = os.path.splitext(s3_key)
            component["file_type"] = ext[1:] if ext else "unknown"

        except Exception as e:
            raise LocationError(
                "Failed to upload file to S3: {0}".format(e),
                details={"component": component, "file": file, "error": str(e)},
            )

    def remove_file(self, component):
        """Remove file from S3 storage."""
        if "file" in component and "path" in component["file"]:
            s3_key = component["file"]["path"]
            try:
                self.s3.delete_object(Bucket=self.bucket_name, Key=s3_key)
                return True
            except Exception as e:
                raise LocationError(
                    "Failed to delete file from S3: {0}".format(e),
                    details={"component": component, "error": str(e)},
                )
        return False

    def get_url(self, component):
        """Get download URL for component."""
        if "file" in component and "path" in component["file"]:
            s3_key = component["file"]["path"]
            return self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=3600,
            )
        return None

    def _generate_s3_key(self, component):
        """Generate consistent S3 key for component."""
        # Use component ID for consistency
        component_id = component.get("id", "unknown")

        # Get file extension
        original_name = component.get("name", "file")
        _, ext = os.path.splitext(original_name)

        # Generate path: prefix/component_id/filename.ext
        return os.path.join(
            self.prefix,
            component_id[:2],  # First 2 chars for sharding
            f"{component_id}{ext}",
        )

    def get_container(self, component):
        """Get container for component."""
        # Return the bucket name as container
        return self.bucket_name

    def add_container(self, container):
        """Add container (create bucket)."""
        try:
            self.s3.create_bucket(
                Bucket=container,
                CreateBucketConfiguration={"LocationConstraint": self.region},
            )
            return True
        except Exception as e:
            logging.error(f"Failed to create bucket: {e}")
            return False

    def remove_container(self, container):
        """Remove container (delete bucket)."""
        try:
            # Empty bucket first
            objects = self.s3.list_objects_v2(Bucket=container)
            if "Contents" in objects:
                delete_keys = [{"Key": obj["Key"]} for obj in objects["Contents"]]
                self.s3.delete_objects(
                    Bucket=container, Delete={"Objects": delete_keys}
                )

            # Delete bucket
            self.s3.delete_bucket(Bucket=container)
            return True
        except Exception as e:
            logging.error(f"Failed to delete bucket: {e}")
            return False

    def list_containers(self):
        """List available containers (buckets)."""
        try:
            response = self.s3.list_buckets()
            return [bucket["Name"] for bucket in response["Buckets"]]
        except Exception as e:
            logging.error(f"Failed to list buckets: {e}")
            return []

    def list(self, container):
        """List components in container."""
        try:
            response = self.s3.list_objects_v2(Bucket=container)
            if "Contents" in response:
                return [obj["Key"] for obj in response["Contents"]]
            return []
        except Exception as e:
            logging.error(f"Failed to list objects: {e}")
            return []


class CustomLocationPlugin(object):
    """Plugin to register custom location."""

    def __init__(self, session):
        self.session = session

    def register(self):
        """Register custom location."""
        # Check if already registered
        existing = self.session.query(
            'Location where name is "Custom S3 Storage"'
        ).first()

        if existing:
            logging.info("Custom location already registered")
            return existing

        # Create and register new location
        location = CustomS3Location(self.session, prefix="custom-s3")

        # Set location properties
        location["name"] = "Custom S3 Storage"
        location["description"] = "S3-based storage for ftrack assets"
        location["structure"] = {"type": "hierarchical", "separator": "/"}

        # Register with session
        self.session.locations.add(location)
        self.session.commit()

        logging.info("Custom S3 location registered successfully")
        return location


if __name__ == "__main__":
    # Example usage
    import ftrack_api

    # Create session
    session = ftrack_api.Session()

    # Register custom location
    plugin = CustomLocationPlugin(session)
    location = plugin.register()

    print(f"Registered location: {location['name']}")
    print(f"Location ID: {location['id']}")
