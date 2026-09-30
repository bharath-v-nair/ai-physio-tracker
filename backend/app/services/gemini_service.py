from google import genai
from google.genai import types
from app.core.config import settings

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL

        if self.api_key and self.api_key != "your_key_here":
            self.client = genai.Client(api_key=self.api_key)
            self.is_configured = True
        else:
            self.client = None
            self.is_configured = False

    def get_chat_response(self, message: str, system_instruction: str, history: list = None) -> dict:
        """
        Calls Gemini API with the given message, system instruction, and chat history.
        Returns the response string.
        """
        if not self.is_configured:
            return {
                "answer": "AI Assistant is temporarily unavailable. Please configure GEMINI_API_KEY.",
                "sources": []
            }

        try:
            # Format history for Gemini (roles: 'user' and 'model')
            formatted_history = []
            if history:
                for msg in history:
                    # Map roles
                    role = "user" if msg["role"] == "user" else "model"
                    formatted_history.append(
                        types.Content(role=role, parts=[types.Part(text=msg["content"])])
                    )

            chat = self.client.chats.create(
                model=self.model_name,
                config=types.GenerateContentConfig(system_instruction=system_instruction),
                history=formatted_history
            )
            response = chat.send_message(message)

            return {
                "answer": response.text,
                "sources": []
            }

        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {
                "answer": "AI Assistant is temporarily unavailable. Please try again.",
                "sources": []
            }
