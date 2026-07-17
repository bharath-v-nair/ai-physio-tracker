import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from app.rag.vector_store import VectorStoreService
from app.rag.prompt_builder import PromptBuilder

class ChatService:
    def __init__(self):
        self.vector_store_service = VectorStoreService()
        api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(
            model="llama3-8b-8192",
            groq_api_key=api_key,
            temperature=0.3
        ) if api_key and api_key != "your-groq-api-key-here" else None

    def get_response(self, question: str, user_context: str) -> dict:
        """
        Retrieves context, builds prompt, and generates a response using Gemini.
        Returns the response string and the sources used.
        """
        if not self.llm:
            return {
                "answer": "I'm currently running in offline mode because a valid Groq API key is not configured. Please add it to the backend environment variables to enable AI responses.",
                "sources": []
            }

        try:
            vector_store = self.vector_store_service.get_vector_store()
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
            
            # Retrieve documents
            docs = retriever.invoke(question)
            retrieved_context = "\n\n".join([d.page_content for d in docs])
            
            sources = []
            for d in docs:
                source_meta = d.metadata.get("source", "Unknown Document")
                if source_meta not in sources:
                    sources.append(source_meta)

            # Build Prompt
            prompt_template = PromptTemplate(
                template=PromptBuilder.build_rag_prompt(user_context, retrieved_context),
                input_variables=["question"]
            )
            
            # Format and execute
            prompt = prompt_template.format(question=question)
            response = self.llm.invoke(prompt)
            
            return {
                "answer": response.content,
                "sources": sources
            }
            
        except Exception as e:
            print(f"RAG Generation Error: {e}")
            return {
                "answer": f"I encountered an error processing your request: {str(e)}",
                "sources": []
            }
