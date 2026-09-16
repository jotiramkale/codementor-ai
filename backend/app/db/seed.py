"""
app/db/seed.py

Populates a freshly-migrated database with the same 29 problems the
frontend's problemsMockData.js has used since Phase 5, transcribed
field-for-field (not regenerated or paraphrased) so the real backend
and the frontend's mock catalog agree exactly if compared side by side.
The 6 problems with a full written statement (Two Sum, Valid
Parentheses, Reverse Linked List, Binary Search, Climbing Stairs, Merge
Intervals) keep their real description/examples/constraints/hints/
starter_code; the other 23 get the same DEFAULT_STARTER_CODE fallback
the frontend uses, and a placeholder description consistent with what
ProblemDetail.jsx already tells students for those problems ("full
statement not yet written").

Also creates two demo accounts (a student and an admin) so signin can
be tested immediately after seeding, matching the frontend's demo
admin-checkbox accounts conceptually — but for real, since a real
backend can't take a client's word for who's an admin (see
app/schemas/auth.py's docstring). Passwords here are for local
development only; never seed real credentials like this in anything
resembling production.

Run with: python -m app.db.seed  (after migrations have been applied)
"""

from app.auth.security import hash_password
from app.db.session import SessionLocal
from app.models.problem import Problem
from app.models.user import User

DEFAULT_STARTER_CODE = {
    "python": "def solve():\n    # Write your solution here\n    pass\n",
    "javascript": "function solve() {\n  // Write your solution here\n}\n",
    "java": "class Solution {\n    public void solve() {\n        // Write your solution here\n    }\n}\n",
    "cpp": "class Solution {\npublic:\n    void solve() {\n        // Write your solution here\n    }\n};\n",
}

PLACEHOLDER_DESCRIPTION = (
    "Full problem statement not yet written for this demo problem — matches what ProblemDetail.jsx "
    "already tells students on the frontend for the same 23 problems."
)

# Transcribed directly from src/data/problemsMockData.js — same ids,
# titles, difficulties, topics, and estimated times, in the same order.
PROBLEMS = [
    {
        "id": 1,
        "title": "Two Sum",
        "difficulty": "Easy",
        "topic": "Arrays",
        "estimated_time": "15m",
        "description": (
            "Given an array of integers nums and an integer target, return the indices of the two "
            "numbers that add up to target. Each input has exactly one solution, and the same element "
            "can't be used twice."
        ),
        "expected_input": "An array of integers nums, and an integer target.",
        "expected_output": "An array of two indices [i, j] such that nums[i] + nums[j] == target.",
        "examples": [
            {"input": "nums = [2, 7, 11, 15], target = 9", "output": "[0, 1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"}
        ],
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Exactly one valid answer exists"],
        "hints": [
            "A brute-force check of every pair works but is O(n^2) — can you do better with a hash map?",
            "Try storing each number's index as you scan, and check if target minus the current number has already been seen.",
        ],
        "starter_code": {
            "python": "def two_sum(nums, target):\n    # Write your solution here\n    pass\n",
            "javascript": "function twoSum(nums, target) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n",
        },
        "ai_recommended": False,
    },
    {"id": 2, "title": "Best Time to Buy and Sell Stock", "difficulty": "Easy", "topic": "Arrays", "estimated_time": "15m"},
    {"id": 3, "title": "Valid Anagram", "difficulty": "Easy", "topic": "Strings", "estimated_time": "10m"},
    {"id": 4, "title": "Longest Palindromic Substring", "difficulty": "Medium", "topic": "Strings", "estimated_time": "30m"},
    {
        "id": 5,
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "topic": "Strings",
        "estimated_time": "25m",
    },
    {
        "id": 6,
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "topic": "Linked List",
        "estimated_time": "15m",
        "description": "Given the head of a singly linked list, reverse the list, and return the new head.",
        "expected_input": "The head node of a singly linked list.",
        "expected_output": "The head node of the reversed list.",
        "examples": [{"input": "head = [1, 2, 3, 4, 5]", "output": "[5, 4, 3, 2, 1]", "explanation": "The list is reversed end to end."}],
        "constraints": ["The number of nodes is in the range [0, 5000]", "-5000 <= Node.val <= 5000"],
        "hints": [
            "Try tracking three pointers as you walk the list: the previous node, the current node, and the next node.",
            "An iterative approach uses O(1) extra space; a recursive one is more concise but uses O(n) call stack space.",
        ],
        "starter_code": {
            "python": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse_list(head):\n    # Write your solution here\n    pass\n",
            "javascript": "function reverseList(head) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        return nullptr;\n    }\n};\n",
        },
        "ai_recommended": False,
    },
    {"id": 7, "title": "Merge Two Sorted Lists", "difficulty": "Easy", "topic": "Linked List", "estimated_time": "15m"},
    {
        "id": 8,
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topic": "Stack",
        "estimated_time": "10m",
        "description": (
            "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine "
            "if the input string is valid. A string is valid if every opening bracket is closed by the "
            "same type of bracket, in the correct order."
        ),
        "expected_input": "A string s made up only of bracket characters.",
        "expected_output": "A boolean — true if the brackets are validly matched and nested, false otherwise.",
        "examples": [
            {"input": 's = "()[]{}"', "output": "true", "explanation": "Each bracket type is opened and closed in order."},
            {"input": 's = "(]"', "output": "false", "explanation": "The brackets do not match."},
        ],
        "constraints": ["1 <= s.length <= 10^4", "s consists only of bracket characters"],
        "hints": [
            "A stack is a natural fit here — think about what happens when you see a closing bracket.",
            "Push opening brackets onto a stack; on a closing bracket, check that the top of the stack matches.",
        ],
        "starter_code": {
            "python": "def is_valid(s):\n    # Write your solution here\n    pass\n",
            "javascript": "function isValid(s) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};\n",
        },
        "ai_recommended": False,
    },
    {"id": 9, "title": "Min Stack", "difficulty": "Medium", "topic": "Stack", "estimated_time": "25m"},
    {"id": 10, "title": "Implement Queue using Stacks", "difficulty": "Easy", "topic": "Queue", "estimated_time": "15m"},
    {"id": 11, "title": "Sliding Window Maximum", "difficulty": "Hard", "topic": "Queue", "estimated_time": "40m"},
    {"id": 12, "title": "Group Anagrams", "difficulty": "Medium", "topic": "Hashing", "estimated_time": "20m"},
    {"id": 13, "title": "Subarray Sum Equals K", "difficulty": "Medium", "topic": "Hashing", "estimated_time": "25m", "ai_recommended": True},
    {
        "id": 14,
        "title": "Merge Intervals",
        "difficulty": "Medium",
        "topic": "Sorting",
        "estimated_time": "25m",
        "description": (
            "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping "
            "intervals and return an array of the non-overlapping intervals that cover all the intervals "
            "in the input."
        ),
        "expected_input": "An array of [start, end] interval pairs.",
        "expected_output": "An array of merged, non-overlapping [start, end] intervals, sorted by start time.",
        "examples": [
            {
                "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
                "output": "[[1,6],[8,10],[15,18]]",
                "explanation": "Intervals [1,3] and [2,6] overlap, so they merge into [1,6].",
            }
        ],
        "constraints": ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i"],
        "hints": [
            "Sorting the intervals by start time first makes overlaps easy to detect in a single pass.",
            "Walk through the sorted intervals and merge into the last interval in your result whenever the current one overlaps it.",
        ],
        "starter_code": {
            "python": "def merge(intervals):\n    # Write your solution here\n    pass\n",
            "javascript": "function merge(intervals) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};\n",
        },
        "ai_recommended": False,
    },
    {"id": 15, "title": "Kth Largest Element in an Array", "difficulty": "Medium", "topic": "Sorting", "estimated_time": "20m", "ai_recommended": True},
    {
        "id": 16,
        "title": "Binary Search",
        "difficulty": "Easy",
        "topic": "Searching",
        "estimated_time": "10m",
        "description": (
            "Given a sorted array of integers nums and a target value, return the index of the target if "
            "it exists, or -1 if it does not. Your solution must run in O(log n) time."
        ),
        "expected_input": "A sorted array of integers nums, and an integer target.",
        "expected_output": "The index of target in nums, or -1 if not present.",
        "examples": [
            {"input": "nums = [-1, 0, 3, 5, 9, 12], target = 9", "output": "4", "explanation": "9 appears at index 4."}
        ],
        "constraints": ["1 <= nums.length <= 10^4", "nums is sorted in ascending order", "All elements are distinct"],
        "hints": [
            "Keep a low and high pointer and repeatedly check the midpoint.",
            "Update low or high based on whether the midpoint value is smaller or larger than the target.",
        ],
        "starter_code": {
            "python": "def search(nums, target):\n    # Write your solution here\n    pass\n",
            "javascript": "function search(nums, target) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};\n",
        },
        "ai_recommended": False,
    },
    {"id": 17, "title": "Search in Rotated Sorted Array", "difficulty": "Medium", "topic": "Searching", "estimated_time": "25m"},
    {"id": 18, "title": "Generate Parentheses", "difficulty": "Medium", "topic": "Recursion", "estimated_time": "20m"},
    {"id": 19, "title": "Permutations", "difficulty": "Medium", "topic": "Recursion", "estimated_time": "20m"},
    {"id": 20, "title": "Binary Tree Level Order Traversal", "difficulty": "Medium", "topic": "Trees", "estimated_time": "20m"},
    {"id": 21, "title": "Validate Binary Search Tree", "difficulty": "Medium", "topic": "Trees", "estimated_time": "20m"},
    {"id": 22, "title": "Number of Islands", "difficulty": "Medium", "topic": "Graphs", "estimated_time": "25m", "ai_recommended": True},
    {"id": 23, "title": "Course Schedule", "difficulty": "Medium", "topic": "Graphs", "estimated_time": "30m", "ai_recommended": True},
    {
        "id": 24,
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "topic": "Dynamic Programming",
        "estimated_time": "10m",
        "description": (
            "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how "
            "many distinct ways can you reach the top?"
        ),
        "expected_input": "An integer n, the number of steps.",
        "expected_output": "An integer — the number of distinct ways to reach step n.",
        "examples": [{"input": "n = 3", "output": "3", "explanation": "The ways are: 1+1+1, 1+2, 2+1."}],
        "constraints": ["1 <= n <= 45"],
        "hints": [
            "The number of ways to reach step n is the sum of the ways to reach step n-1 and step n-2 — sound familiar?",
            "This is the Fibonacci sequence in disguise. You can solve it with O(1) extra space using two running variables.",
        ],
        "starter_code": {
            "python": "def climb_stairs(n):\n    # Write your solution here\n    pass\n",
            "javascript": "function climbStairs(n) {\n  // Write your solution here\n}\n",
            "java": "class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n}\n",
            "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n};\n",
        },
        "ai_recommended": True,
    },
    {"id": 25, "title": "Longest Increasing Subsequence", "difficulty": "Medium", "topic": "Dynamic Programming", "estimated_time": "30m"},
    {"id": 26, "title": "Jump Game", "difficulty": "Medium", "topic": "Greedy", "estimated_time": "20m"},
    {"id": 27, "title": "Gas Station", "difficulty": "Medium", "topic": "Greedy", "estimated_time": "25m"},
    {"id": 28, "title": "N-Queens", "difficulty": "Hard", "topic": "Backtracking", "estimated_time": "40m"},
    {"id": 29, "title": "Combination Sum", "difficulty": "Medium", "topic": "Backtracking", "estimated_time": "25m"},
]


def _problem_kwargs(entry: dict) -> dict:
    """Fills in the placeholder shape for the 23 problems that only have id/title/difficulty/topic/estimated_time."""
    return {
        "id": entry["id"],
        "title": entry["title"],
        "difficulty": entry["difficulty"],
        "topic": entry["topic"],
        "estimated_time": entry["estimated_time"],
        "description": entry.get("description", PLACEHOLDER_DESCRIPTION),
        "expected_input": entry.get("expected_input"),
        "expected_output": entry.get("expected_output"),
        "examples": entry.get("examples", []),
        "constraints": entry.get("constraints", []),
        "hints": entry.get("hints", []),
        "starter_code": entry.get("starter_code", DEFAULT_STARTER_CODE),
        "ai_recommended": entry.get("ai_recommended", False),
    }


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(Problem).count() > 0:
            print("Problems table is not empty — skipping seed to avoid duplicates.")
            return

        for entry in PROBLEMS:
            db.add(Problem(**_problem_kwargs(entry)))

        if db.query(User).filter(User.email == "student@example.com").first() is None:
            db.add(
                User(
                    name="Demo Student",
                    email="student@example.com",
                    password_hash=hash_password("changeme123"),
                    role="student",
                )
            )
        if db.query(User).filter(User.email == "admin@example.com").first() is None:
            db.add(
                User(
                    name="Demo Admin",
                    email="admin@example.com",
                    password_hash=hash_password("changeme123"),
                    role="admin",
                )
            )

        db.commit()
        print(f"Seeded {len(PROBLEMS)} problems and 2 demo users (student@example.com / admin@example.com, both changeme123).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
