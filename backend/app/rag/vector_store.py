import os
from langchain_chroma import Chroma
from app.rag.embedding_service import EmbeddingService

class VectorStoreService:
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.embeddings = EmbeddingService.get_embeddings()
        
    def get_vector_store(self) -> Chroma:
        """Returns the Chroma vector store instance."""
        return Chroma(
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )
        
    def add_documents(self, documents):
        """Adds documents to the vector store."""
        vector_store = self.get_vector_store()
        vector_store.add_documents(documents)
