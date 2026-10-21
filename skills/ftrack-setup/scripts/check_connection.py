"""Check that ftrack-python-api is installed and can reach the server.

Reads FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY. Never prints the key.
Exit code 0 on success, 1 on failure.
"""

import os
import sys

REQUIRED = ("FTRACK_SERVER", "FTRACK_API_USER", "FTRACK_API_KEY")


def main():
    missing = [name for name in REQUIRED if not os.environ.get(name) and not (name == "FTRACK_API_KEY" and os.environ.get("FTRACK_APIKEY"))]
    if missing:
        print("Missing environment variables: " + ", ".join(missing))
        return 1

    try:
        import ftrack_api
    except ImportError:
        print("ftrack_api is not installed for " + sys.executable)
        print("Install with: " + sys.executable + " -m pip install ftrack-python-api")
        return 1

    print("ftrack-python-api " + getattr(ftrack_api, "__version__", "unknown") + " on Python " + sys.version.split()[0])

    try:
        with ftrack_api.Session(auto_connect_event_hub=False) as session:
            version = session.server_information.get("version", "unknown")
            user = session.query(
                'select username from User where username is "{0}"'.format(session.api_user)
            ).first()
            print("Connected to " + session.server_url + " (ftrack " + str(version) + ")")
            print("API user: " + (user["username"] if user else session.api_user))
    except Exception as error:
        print("Connection failed: {0}: {1}".format(type(error).__name__, error))
        return 1

    try:
        import ftrack_action_handler  # noqa: F401
        print("ftrack-action-handler is installed")
    except ImportError:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
