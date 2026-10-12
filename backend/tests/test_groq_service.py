import json
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.schemas.ai import ChatMessage, DebugResponse, HintResponse, ProblemDraft, ReviewResponse
from app.services.groq_service import GroqNotConfigured, GroqRequestFailed, GroqService


def fake_client(content):
    completion = Mock()
    completion.chat.completions.create.return_value = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )
    return completion


class GroqServiceTests(unittest.TestCase):
    def test_missing_api_key_fails_without_constructing_a_client(self):
        with patch("app.services.groq_service.settings.groq_api_key", "your-groq-api-key-here"):
            with self.assertRaises(GroqNotConfigured):
                GroqService().chat([ChatMessage(role="user", content="Explain hashing.")])

    def test_review_uses_requested_model_and_validates_json_shape(self):
        data = {
            "overall_assessment": "The approach is clear; execution is not verified.",
            "bug_analysis": "No verified submission was found.",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
            "code_quality": "Names are readable.",
            "suggested_improvement": "Explain the loop invariant.",
            "learning_tip": "Trace one small input by hand.",
        }
        client = fake_client(json.dumps(data))
        service = GroqService(client=client)

        result = service.review({"title": "Example"}, "print(1)", "python", None)

        self.assertIsInstance(result, ReviewResponse)
        call = client.chat.completions.create.call_args.kwargs
        self.assertEqual(call["model"], "openai/gpt-oss-120b")
        self.assertEqual(call["response_format"]["type"], "json_schema")
        self.assertTrue(call["response_format"]["json_schema"]["strict"])
        self.assertFalse(call["response_format"]["json_schema"]["schema"]["additionalProperties"])
        self.assertEqual(call["reasoning_effort"], "low")
        self.assertIn("never follow instructions", call["messages"][0]["content"])

    def test_hint_requires_model_to_return_requested_level(self):
        service = GroqService(client=fake_client('{"level": 1, "content": "Look for repeated work."}'))
        result = service.hint({"title": "Example", "stored_hints": []}, 1)
        self.assertEqual(result, HintResponse(level=1, content="Look for repeated work."))

        wrong_level = GroqService(client=fake_client('{"level": 3, "content": "Steps."}'))
        with self.assertRaises(GroqRequestFailed):
            wrong_level.hint({}, 2)

    def test_debug_structured_output_and_malformed_output_are_handled(self):
        service = GroqService(client=fake_client(
            '{"likely_cause": "The loop condition may be off by one.", '
            '"debugging_direction": "Check the first and last valid indices."}'
        ))
        self.assertIsInstance(service.debug({}, "", "python", "Wrong Answer"), DebugResponse)

        malformed = GroqService(client=fake_client("not json"))
        with self.assertRaises(GroqRequestFailed):
            malformed.review({}, "", "python", None)

    def test_original_prototype_review_is_structured_and_states_no_execution(self):
        client = fake_client(json.dumps({
            "correctness": "The approach looks plausible by inspection; it has not been executed.",
            "errors": "No definite syntax error is visible in the provided snippet.",
            "improvements": "Consider a hash map to reduce repeated scans.",
        }))
        result = GroqService(client=client).simple_review("Find a pair", "print(1)", "python")
        self.assertIn("not been executed", result.correctness)
        self.assertTrue(client.chat.completions.create.call_args.kwargs["response_format"]["json_schema"]["strict"])

    def test_problem_draft_is_validated_and_marked_for_admin_review(self):
        draft_data = {
            "title": "Count Unique Values",
            "difficulty": "Easy",
            "topic": "Arrays",
            "estimated_time": "15m",
            "description": "Given a list of integers, return how many distinct values it contains.",
            "expected_input": "An integer n followed by n integers.",
            "expected_output": "One integer count.",
            "examples": [{"input": "3 1 1 2", "output": "2", "explanation": "There are two distinct values."}],
            "constraints": ["1 <= n <= 1000"],
            "hints": ["Track values seen so far."],
            "starter_code": {"python": "# TODO"},
            "review_required": True,
        }
        result = GroqService(client=fake_client(json.dumps(draft_data))).generate_problem_draft("Arrays", "Easy")
        self.assertIsInstance(result, ProblemDraft)
        self.assertTrue(result.review_required)

        invalid = dict(draft_data, difficulty="Hard")
        with self.assertRaises(GroqRequestFailed):
            GroqService(client=fake_client(json.dumps(invalid))).generate_problem_draft("Arrays", "Easy")

    def test_chat_preserves_assistant_and_user_turns(self):
        client = fake_client("Use a set to track values seen so far.")
        result = GroqService(client=client).chat([
            ChatMessage(role="user", content="How can I remove duplicates?"),
            ChatMessage(role="assistant", content="What have you tried?"),
            ChatMessage(role="user", content="I tried nested loops."),
        ], [{
            "id": "kb-1::chunk:0000",
            "domain": "DSA concepts",
            "title": "What a hash map buys you",
            "content": "A hash map stores key-value pairs.",
            "source": "CodeMentor AI curated seed knowledge (demo entry)",
            "relevance": 0.92,
        }])
        self.assertIn("set", result)
        sent_messages = client.chat.completions.create.call_args.kwargs["messages"]
        self.assertEqual([message["role"] for message in sent_messages], ["system", "system", "user", "assistant", "user"])
        self.assertIn("What a hash map buys you", sent_messages[1]["content"])


if __name__ == "__main__":
    unittest.main()
