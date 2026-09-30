from google import genai
from google.genai import types
from app.core.config import settings

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.fallback_models = [m.strip() for m in settings.GEMINI_FALLBACK_MODELS.split(",") if m.strip()]

        if self.api_key and self.api_key != "your_key_here":
            # Give up on a slow model after 15s so the fallback models get a turn
            self.client = genai.Client(
                api_key=self.api_key,
                http_options=types.HttpOptions(timeout=15000)
            )
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

        # Format history for Gemini (roles: 'user' and 'model')
        formatted_history = []
        if history:
            for msg in history:
                # Map roles
                role = "user" if msg["role"] == "user" else "model"
                formatted_history.append(
                    types.Content(role=role, parts=[types.Part(text=msg["content"])])
                )

        # The newest model is sometimes overloaded ("503 high demand"),
        # so fall back to older Flash models before giving up.
        models = [self.model_name] + [m for m in self.fallback_models if m != self.model_name]
        for model_name in models:
            try:
                chat = self.client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(system_instruction=system_instruction),
                    history=formatted_history
                )
                response = chat.send_message(message)

                return {
                    "answer": response.text,
                    "sources": []
                }

            except Exception as e:
                print(f"Gemini API Error ({model_name}): {e}")

        return {
            "answer": "AI Assistant is temporarily unavailable. Please try again.",
            "sources": []
        }
