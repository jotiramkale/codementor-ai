/**
 * problemsMockData.js
 *
 * A believable but entirely fabricated problem catalog for Phase 5.
 * Real problems, test cases, and per-user solved/attempt state arrive
 * with the real backend (Phase 19+/20) — this is enough variety across
 * topics and difficulties to make the filters meaningful to try out.
 */

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Stack',
  'Queue',
  'Hashing',
  'Sorting',
  'Searching',
  'Recursion',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
]

export const MOCK_PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays',
    estimatedTime: '15m',
    attempts: 2,
    bestTime: '9m 12s',
    solved: true,
    aiRecommended: false,
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution, and the same element can't be used twice.",
    expectedInput: 'An array of integers nums, and an integer target.',
    expectedOutput: 'An array of two indices [i, j] such that nums[i] + nums[j] == target.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists'],
    hints: [
      'A brute-force check of every pair works but is O(n^2) — can you do better with a hash map?',
      "Try storing each number's index as you scan, and check if target minus the current number has already been seen.",
    ],
    starterCode: {
      python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass\n',
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n',
    },
  },
  { id: 2, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Arrays', estimatedTime: '15m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 3, title: 'Valid Anagram', difficulty: 'Easy', topic: 'Strings', estimatedTime: '10m', attempts: 1, bestTime: '7m 40s', solved: true, aiRecommended: false },
  { id: 4, title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', estimatedTime: '30m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
  { id: 5, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Strings', estimatedTime: '25m', attempts: 1, bestTime: null, solved: false, aiRecommended: false },

  {
    id: 6,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    topic: 'Linked List',
    estimatedTime: '15m',
    attempts: 1,
    bestTime: '11m 05s',
    solved: true,
    aiRecommended: false,
    description: 'Given the head of a singly linked list, reverse the list, and return the new head.',
    expectedInput: 'The head node of a singly linked list.',
    expectedOutput: 'The head node of the reversed list.',
    examples: [{ input: 'head = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]', explanation: 'The list is reversed end to end.' }],
    constraints: ['The number of nodes is in the range [0, 5000]', '-5000 <= Node.val <= 5000'],
    hints: [
      'Try tracking three pointers as you walk the list: the previous node, the current node, and the next node.',
      'An iterative approach uses O(1) extra space; a recursive one is more concise but uses O(n) call stack space.',
    ],
    starterCode: {
      python: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse_list(head):\n    # Write your solution here\n    pass\n',
      javascript: 'function reverseList(head) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        return nullptr;\n    }\n};\n',
    },
  },
  { id: 7, title: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked List', estimatedTime: '15m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  {
    id: 8,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    estimatedTime: '10m',
    attempts: 1,
    bestTime: '6m 20s',
    solved: true,
    aiRecommended: false,
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. A string is valid if every opening bracket is closed by the same type of bracket, in the correct order.",
    expectedInput: 'A string s made up only of bracket characters.',
    expectedOutput: 'A boolean — true if the brackets are validly matched and nested, false otherwise.',
    examples: [
      { input: 's = "()[]{}"', output: 'true', explanation: 'Each bracket type is opened and closed in order.' },
      { input: 's = "(]"', output: 'false', explanation: 'The brackets do not match.' },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists only of bracket characters'],
    hints: [
      'A stack is a natural fit here — think about what happens when you see a closing bracket.',
      'Push opening brackets onto a stack; on a closing bracket, check that the top of the stack matches.',
    ],
    starterCode: {
      python: 'def is_valid(s):\n    # Write your solution here\n    pass\n',
      javascript: 'function isValid(s) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};\n',
    },
  },
  { id: 9, title: 'Min Stack', difficulty: 'Medium', topic: 'Stack', estimatedTime: '25m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 10, title: 'Implement Queue using Stacks', difficulty: 'Easy', topic: 'Queue', estimatedTime: '15m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
  { id: 11, title: 'Sliding Window Maximum', difficulty: 'Hard', topic: 'Queue', estimatedTime: '40m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 12, title: 'Group Anagrams', difficulty: 'Medium', topic: 'Hashing', estimatedTime: '20m', attempts: 2, bestTime: '17m 30s', solved: true, aiRecommended: false },
  { id: 13, title: 'Subarray Sum Equals K', difficulty: 'Medium', topic: 'Hashing', estimatedTime: '25m', attempts: 1, bestTime: null, solved: false, aiRecommended: true },

  {
    id: 14,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Sorting',
    estimatedTime: '25m',
    attempts: 1,
    bestTime: '19m 45s',
    solved: true,
    aiRecommended: false,
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    expectedInput: 'An array of [start, end] interval pairs.',
    expectedOutput: 'An array of merged, non-overlapping [start, end] intervals, sorted by start time.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Intervals [1,3] and [2,6] overlap, so they merge into [1,6].',
      },
    ],
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start_i <= end_i'],
    hints: [
      'Sorting the intervals by start time first makes overlaps easy to detect in a single pass.',
      'Walk through the sorted intervals and merge into the last interval in your result whenever the current one overlaps it.',
    ],
    starterCode: {
      python: 'def merge(intervals):\n    # Write your solution here\n    pass\n',
      javascript: 'function merge(intervals) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};\n',
    },
  },
  { id: 15, title: 'Kth Largest Element in an Array', difficulty: 'Medium', topic: 'Sorting', estimatedTime: '20m', attempts: 1, bestTime: null, solved: false, aiRecommended: true },

  {
    id: 16,
    title: 'Binary Search',
    difficulty: 'Easy',
    topic: 'Searching',
    estimatedTime: '10m',
    attempts: 1,
    bestTime: '5m 10s',
    solved: true,
    aiRecommended: false,
    description:
      'Given a sorted array of integers nums and a target value, return the index of the target if it exists, or -1 if it does not. Your solution must run in O(log n) time.',
    expectedInput: 'A sorted array of integers nums, and an integer target.',
    expectedOutput: 'The index of target in nums, or -1 if not present.',
    examples: [
      { input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', output: '4', explanation: '9 appears at index 4.' },
    ],
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted in ascending order', 'All elements are distinct'],
    hints: [
      'Keep a low and high pointer and repeatedly check the midpoint.',
      'Update low or high based on whether the midpoint value is smaller or larger than the target.',
    ],
    starterCode: {
      python: 'def search(nums, target):\n    # Write your solution here\n    pass\n',
      javascript: 'function search(nums, target) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};\n',
    },
  },
  { id: 17, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topic: 'Searching', estimatedTime: '25m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 18, title: 'Generate Parentheses', difficulty: 'Medium', topic: 'Recursion', estimatedTime: '20m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
  { id: 19, title: 'Permutations', difficulty: 'Medium', topic: 'Recursion', estimatedTime: '20m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 20, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topic: 'Trees', estimatedTime: '20m', attempts: 1, bestTime: '14m 55s', solved: true, aiRecommended: false },
  { id: 21, title: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Trees', estimatedTime: '20m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 22, title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs', estimatedTime: '25m', attempts: 0, bestTime: null, solved: false, aiRecommended: true },
  { id: 23, title: 'Course Schedule', difficulty: 'Medium', topic: 'Graphs', estimatedTime: '30m', attempts: 0, bestTime: null, solved: false, aiRecommended: true },

  {
    id: 24,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    estimatedTime: '10m',
    attempts: 0,
    bestTime: null,
    solved: false,
    aiRecommended: true,
    description:
      'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach the top?',
    expectedInput: 'An integer n, the number of steps.',
    expectedOutput: 'An integer — the number of distinct ways to reach step n.',
    examples: [{ input: 'n = 3', output: '3', explanation: 'The ways are: 1+1+1, 1+2, 2+1.' }],
    constraints: ['1 <= n <= 45'],
    hints: [
      'The number of ways to reach step n is the sum of the ways to reach step n-1 and step n-2 — sound familiar?',
      'This is the Fibonacci sequence in disguise. You can solve it with O(1) extra space using two running variables.',
    ],
    starterCode: {
      python: 'def climb_stairs(n):\n    # Write your solution here\n    pass\n',
      javascript: 'function climbStairs(n) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n};\n',
    },
  },
  { id: 25, title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', estimatedTime: '30m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 26, title: 'Jump Game', difficulty: 'Medium', topic: 'Greedy', estimatedTime: '20m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
  { id: 27, title: 'Gas Station', difficulty: 'Medium', topic: 'Greedy', estimatedTime: '25m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },

  { id: 28, title: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', estimatedTime: '40m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
  { id: 29, title: 'Combination Sum', difficulty: 'Medium', topic: 'Backtracking', estimatedTime: '25m', attempts: 0, bestTime: null, solved: false, aiRecommended: false },
]

/**
 * Fallback starter code for the 23 problems that don't have a full
 * problem statement (and therefore no problem-specific signature) yet.
 * A generic `solve()` shape so the editor always has something sensible
 * to start from.
 */
export const DEFAULT_STARTER_CODE = {
  python: 'def solve():\n    # Write your solution here\n    pass\n',
  javascript: 'function solve() {\n  // Write your solution here\n}\n',
  java: 'class Solution {\n    public void solve() {\n        // Write your solution here\n    }\n}\n',
  cpp: 'class Solution {\npublic:\n    void solve() {\n        // Write your solution here\n    }\n};\n',
}
