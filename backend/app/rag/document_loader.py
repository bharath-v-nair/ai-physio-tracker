import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import DirectoryLoader
from langchain_core.documents import Document
from typing import List

class KnowledgeBaseLoader:
    def __init__(self, directory_path: str = "./knowledge_base"):
        self.directory_path = directory_path

    def load_documents(self) -> List[Document]:
        """Loads all PDFs in the knowledge base directory."""
        if not os.path.exists(self.directory_path):
            os.makedirs(self.directory_path)
            return []
            
        loader = DirectoryLoader(
            self.directory_path, 
            glob="**/*.pdf", 
            loader_cls=PyPDFLoader
        )
        return loader.load()
