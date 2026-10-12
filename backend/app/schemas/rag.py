"""Contracts for shared knowledge documents stored in ChromaDB."""

from pydantic import BaseModel, ConfigDict, Field, model_validator


class KnowledgeFields(BaseModel):
    domain: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=20, max_length=20000)
    source: str = Field(
        min_length=3,
        max_length=500,
        description="Honest provenance for this entry, such as an internal note title or a real URL.",
    )

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class KnowledgeCreate(KnowledgeFields):
    pass


class KnowledgeUpdate(BaseModel):
    domain: str | None = Field(default=None, min_length=1, max_length=80)
    title: str | None = Field(default=None, min_length=3, max_length=200)
    content: str | None = Field(default=None, min_length=20, max_length=20000)
    source: str | None = Field(default=None, min_length=3, max_length=500)

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @model_validator(mode="after")
    def require_an_update(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update.")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Knowledge fields cannot be cleared; provide a value instead.")
        return self


class KnowledgeOut(KnowledgeFields):
    id: str
    created_at: str
    updated_at: str


class KnowledgeStatus(BaseModel):
    status: str
    collection: str
    embedding_model: str
    documents: int

