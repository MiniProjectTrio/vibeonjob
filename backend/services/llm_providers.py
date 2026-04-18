"""
llm_providers.py — Strategy Pattern LLM Abstraction Layer

Provides a pluggable, order-configurable LLM provider chain so the application
gracefully falls back between providers when one is unavailable or overloaded.

Design pattern:
  Strategy   — Each provider (Gemini, Groq) implements LLMProvider.generate()
  Chain      — LLMEngine tries providers in order, falling back on failure.

Configuration (via environment variables):
  LLM_PROVIDER_ORDER  — Comma-separated provider names, e.g. "gemini,groq" (default)
  GOOGLE_API_KEY       — Required for GeminiProvider
  GEMINI_MODEL         — Override Gemini model (default: gemini-2.0-flash)
  GROQ_API_KEY         — Required for GroqProvider
"""

import os
import time
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger("vibeonjob.services.llm_providers")


# ═══════════════════════════════════════════════════════════════════════════════
# Abstract Base — every LLM provider must implement this interface
# ═══════════════════════════════════════════════════════════════════════════════

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name used in logs and config."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if this provider has the required credentials configured."""
        ...

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Send a prompt to the LLM and return the raw text response.

        Args:
            prompt: The full prompt string to send.

        Returns:
            Raw text response from the model.

        Raises:
            Exception: On any API or network failure.
        """
        ...


# ═══════════════════════════════════════════════════════════════════════════════
# Concrete Strategy — Google Gemini
# ═══════════════════════════════════════════════════════════════════════════════

class GeminiProvider(LLMProvider):
    """Google Gemini provider using the google-genai SDK."""

    def __init__(self):
        self._api_key = os.getenv("GOOGLE_API_KEY", "")
        self._model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate(self, prompt: str) -> str:
        from google import genai

        logger.debug(f"[{self.name}] Creating client for model '{self._model}'...")
        client = genai.Client(api_key=self._api_key)

        response = client.models.generate_content(
            model=self._model,
            contents=prompt,
        )
        return response.text


# ═══════════════════════════════════════════════════════════════════════════════
# Concrete Strategy — Groq (Llama 3.3 70B)
# ═══════════════════════════════════════════════════════════════════════════════

class GroqProvider(LLMProvider):
    """Groq provider using the Groq SDK (OpenAI-compatible chat completions)."""

    def __init__(self):
        self._api_key = os.getenv("GROQ_API_KEY", "")
        self._model = "llama-3.3-70b-versatile"

    @property
    def name(self) -> str:
        return "groq"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate(self, prompt: str) -> str:
        from groq import Groq

        logger.debug(f"[{self.name}] Creating client for model '{self._model}'...")
        client = Groq(api_key=self._api_key)

        # Use non-streaming mode — we need the full JSON response at once
        completion = client.chat.completions.create(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise JSON generator. You must respond with "
                        "ONLY valid JSON — no markdown fences, no commentary, no "
                        "prose before or after the JSON object."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.7,
            max_completion_tokens=16384,
            top_p=1,
            stream=False,
        )
        return completion.choices[0].message.content


# ═══════════════════════════════════════════════════════════════════════════════
# Provider Registry — maps name → class for dynamic construction
# ═══════════════════════════════════════════════════════════════════════════════

_PROVIDER_REGISTRY: dict[str, type[LLMProvider]] = {
    "gemini": GeminiProvider,
    "groq": GroqProvider,
}


# ═══════════════════════════════════════════════════════════════════════════════
# LLM Engine — Chain of Responsibility orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

class LLMEngine:
    """
    Orchestrator that tries LLM providers in order with per-provider retries.

    Usage:
        engine = create_default_engine()
        raw_text = engine.generate(prompt)
    """

    def __init__(
        self,
        providers: list[LLMProvider],
        max_retries: int = 3,
        retry_base_delay: float = 1.5,
    ):
        self.providers = providers
        self.max_retries = max_retries
        self.retry_base_delay = retry_base_delay

        available = [p.name for p in providers if p.is_available()]
        unavailable = [p.name for p in providers if not p.is_available()]

        logger.info(
            f"LLMEngine initialised | chain order: {[p.name for p in providers]} | "
            f"available: {available} | unavailable (no API key): {unavailable}"
        )

    def __repr__(self) -> str:
        chain = " → ".join(
            f"{p.name}{'✓' if p.is_available() else '✗'}"
            for p in self.providers
        )
        return f"LLMEngine({chain})"

    def generate(self, prompt: str) -> str:
        """
        Try each provider in order. For each provider, attempt up to
        max_retries with exponential backoff. Fall back to the next
        provider when all retries are exhausted.

        Args:
            prompt: The full prompt string.

        Returns:
            Raw text response from the first successful provider.

        Raises:
            ValueError: If all providers fail.
        """
        last_error = None
        prompt_preview = prompt[:100].replace("\n", " ")

        for provider in self.providers:
            if not provider.is_available():
                logger.warning(
                    f"[{provider.name}] Skipping — API key not configured"
                )
                continue

            logger.info(f"[{provider.name}] Attempting generation...")

            for attempt in range(1, self.max_retries + 1):
                logger.info(
                    f"[{provider.name}] Attempt {attempt}/{self.max_retries}..."
                )
                t_start = time.time()

                try:
                    result = provider.generate(prompt)
                    elapsed = time.time() - t_start
                    logger.info(
                        f"[{provider.name}] Success on attempt {attempt} "
                        f"({elapsed:.2f}s, {len(result)} chars)"
                    )
                    return result

                except Exception as e:
                    elapsed = time.time() - t_start
                    logger.error(
                        f"[{provider.name}] Attempt {attempt} failed after "
                        f"{elapsed:.2f}s: {type(e).__name__}: {e}"
                    )
                    last_error = e

                    if attempt < self.max_retries:
                        delay = self.retry_base_delay * (2 ** (attempt - 1))
                        logger.warning(f"[{provider.name}] Retrying in {delay:.1f}s...")
                        time.sleep(delay)

            logger.warning(
                f"[{provider.name}] All {self.max_retries} attempts exhausted. "
                f"Falling back to next provider..."
            )

        # All providers failed
        available_names = [p.name for p in self.providers if p.is_available()]
        logger.critical(
            f"All LLM providers failed: {available_names}. "
            f"Last error: {last_error}"
        )
        raise ValueError(
            f"All LLM providers ({', '.join(available_names)}) failed after "
            f"retries. Last error: {last_error}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Factory — builds the default engine from environment config
# ═══════════════════════════════════════════════════════════════════════════════

def create_default_engine() -> LLMEngine:
    """
    Build an LLMEngine from the LLM_PROVIDER_ORDER environment variable.

    Examples:
        LLM_PROVIDER_ORDER=gemini,groq   → try Gemini first, then Groq
        LLM_PROVIDER_ORDER=groq,gemini   → try Groq first, then Gemini
        LLM_PROVIDER_ORDER=groq          → Groq only, no fallback

    Defaults to "gemini,groq" if not set.
    """
    order_str = os.getenv("LLM_PROVIDER_ORDER", "gemini,groq")
    provider_names = [name.strip().lower() for name in order_str.split(",")]

    providers: list[LLMProvider] = []
    for name in provider_names:
        cls = _PROVIDER_REGISTRY.get(name)
        if cls is None:
            logger.warning(
                f"Unknown provider '{name}' in LLM_PROVIDER_ORDER — skipping. "
                f"Available: {list(_PROVIDER_REGISTRY.keys())}"
            )
            continue
        providers.append(cls())

    if not providers:
        raise ValueError(
            f"No valid providers in LLM_PROVIDER_ORDER='{order_str}'. "
            f"Available: {list(_PROVIDER_REGISTRY.keys())}"
        )

    return LLMEngine(providers=providers)
