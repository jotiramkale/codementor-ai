"""The ten demo knowledge entries from the Phase 13 frontend retriever."""

SEED_KNOWLEDGE = [
    {
        "id": "kb-1",
        "domain": "DSA concepts",
        "title": "What a hash map buys you",
        "content": "A hash map stores key-value pairs and gives average O(1) lookup, insert, and delete by computing an index from the key. It trades that speed for extra memory, and in the worst case (many collisions) lookups can degrade to O(n).",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-2",
        "domain": "algorithms",
        "title": "Binary search, in one paragraph",
        "content": "Binary search finds a target in a sorted array by repeatedly halving the search range: compare the middle element to the target and discard the half that can't contain it. Each step cuts the remaining range in half, giving O(log n) instead of O(n) for a linear scan.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-3",
        "domain": "complexity",
        "title": "Big-O is about growth, not exact speed",
        "content": "Big-O describes how an algorithm's running time or memory grows as input size grows, ignoring constant factors. An O(n) algorithm can be slower in practice than an O(n^2) one on a small input, but O(n) wins once n is large enough.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-4",
        "domain": "patterns",
        "title": "The two-pointer pattern",
        "content": "Two-pointer problems use two indices moving through a structure (often a sorted array or a string) instead of nested loops. Common shapes: pointers starting at both ends and moving inward, or both starting at the same end moving at different speeds.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-5",
        "domain": "patterns",
        "title": "Sliding window, when it applies",
        "content": "Sliding window problems ask for something about every contiguous subarray or substring of a given (or variable) size. Instead of recomputing from scratch for each window, adjust the running result as the window edges move, usually getting O(n) instead of O(n*k).",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-6",
        "domain": "common mistakes",
        "title": "Off-by-one errors",
        "content": "The most common source of off-by-one bugs is a loop or index boundary: using < where you meant <=, or starting a loop at 0 when the problem is 1-indexed. If a solution fails only on the first or last element, check loop boundaries before re-reading the whole algorithm.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-7",
        "domain": "common mistakes",
        "title": "Forgetting edge cases",
        "content": "Empty input, a single-element input, and duplicate values are three edge cases that break many otherwise-correct solutions. Testing these before submitting catches a large share of solutions whose logic seems right but still fails.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-8",
        "domain": "hints",
        "title": "What makes a good hint",
        "content": "A good hint narrows the search space without handing over the answer: it points at a technique or a missing observation, not a line of code. Graduated hints move from a conceptual clue to a stronger direction and then near-solution guidance.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-9",
        "domain": "interview patterns",
        "title": "What interviewers usually watch for",
        "content": "Beyond a correct final answer, interviewers typically notice whether you clarify ambiguous requirements before coding, talk through your approach's complexity, and test your own solution against an edge case unprompted.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
    {
        "id": "kb-10",
        "domain": "learning roadmaps",
        "title": "A reasonable topic order",
        "content": "A common learning order is Arrays and Strings first (they underlie almost everything else), then Hashing, then Linked Lists/Stacks/Queues, then Trees and Graphs, then Dynamic Programming and Greedy last, since those build on comfort with the earlier structures.",
        "source": "CodeMentor AI curated seed knowledge (demo entry)",
    },
]
