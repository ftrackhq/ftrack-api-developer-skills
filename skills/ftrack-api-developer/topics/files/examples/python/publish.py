"""Publish a version with files, an image sequence, a thumbnail and review media.

Usage: python publish.py <task_id> <movie> [<sequence like /r/shot.%04d.exr [1001-1010]>] [<thumbnail.jpg>]
Reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY. Creates data in ftrack.
"""

import sys

import ftrack_api
import ftrack_api.symbol


def get_or_create_asset(session, task, name, type_name):
    asset = session.query(
        'select id from Asset where name is "{0}" and parent.id is "{1}"'.format(name, task["parent"]["id"])
    ).first()
    if asset:
        return asset
    asset_type = session.query('AssetType where name is "{0}"'.format(type_name)).one()
    # The asset lives on the task's parent (shot, asset build, folder...), not on the task.
    return session.create("Asset", {"name": name, "type": asset_type, "parent": task["parent"]})


def publish(session, task_id, movie, sequence=None, thumbnail=None):
    task = session.query(
        'select name, parent.name from Task where id is "{0}"'.format(task_id)
    ).one()
    asset = get_or_create_asset(session, task, "main", "Upload")
    version = session.create("AssetVersion", {"asset": asset, "task": task, "comment": "Published from script"})
    session.commit()

    # AssetVersion.create_component defaults to location=None; ask for the preferred location.
    version.create_component(movie, data={"name": "movie"}, location="auto")
    if sequence:
        version.create_component(sequence, data={"name": "frames"}, location="auto")
    session.commit()

    if thumbnail:
        version.create_thumbnail(thumbnail)

    job = version.encode_media(movie)       # asynchronous server job
    session.commit()
    return version, job


def describe(session, version):
    server = session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID)
    components = session.query(
        'select name, file_type from Component where version_id is "{0}"'.format(version["id"])
    ).all()
    for component in components:
        location = session.pick_location(component)
        # Encode outputs have no location until the job is done.
        print(component["name"], component["file_type"], "in", location["name"] if location else "(pending)")
        if location and location["id"] == server["id"]:
            print("  url:", server.get_url(component))


if __name__ == "__main__":
    args = sys.argv[1:]
    with ftrack_api.Session() as session:
        version, job = publish(
            session, args[0], args[1],
            sequence=args[2] if len(args) > 2 else None,
            thumbnail=args[3] if len(args) > 3 else None,
        )
        print("Version", version["version"], "job", job["id"], job["status"])
        describe(session, version)
