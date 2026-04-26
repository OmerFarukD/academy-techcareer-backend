import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_db_session_is_async(db_session):
    assert isinstance(db_session, AsyncSession)
