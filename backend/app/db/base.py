"""
app/db/base.py

The declarative base every model in app/models/ inherits from.
Kept in its own tiny file (rather than inside session.py) so
Alembic's migration autogeneration can import just this, without
pulling in the engine/session machinery.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
