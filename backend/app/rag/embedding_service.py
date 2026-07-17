import os
from langchain_huggingface import HuggingFaceEmbeddings

class EmbeddingService:
    @staticmethod
    def get_embeddings():
        """Returns the configured embedding model using HuggingFace (Local & Free)."""
        # Using a fast, local embedding model that doesn't require an API key
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
