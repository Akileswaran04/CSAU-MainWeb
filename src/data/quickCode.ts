/* ============================================================
   QUICK CODE - the archive of the club's five-week MCQ series.

   Every string below is copied from the archive's own documents
   (QuickCode - About.docx, the Week 01 question set, the solution
   docs and the Week 02 results / top-performer docs). Roll numbers,
   emails and phone numbers from those docs and from the form
   responses are left out on purpose.

   Sets: "OB" = Orange & Brown tags (1st & 2nd years),
         "RG" = Red & Grey tags (3rd & 4th years).
   ============================================================ */

/** A paragraph of a question, or a code / pseudocode block. */
export type QCBlock = string | { code: string };

export interface QCQuestion {
  n: number;
  title: string;
  /** difficulty, when the doc gives one */
  level?: string;
  prompt: QCBlock[];
  /** verbatim, letter included ("A. ..."); may span lines */
  options: string[];
  /** verbatim; starts with the correct letter */
  answer: string;
  explanation: string[];
}

export interface QCSet {
  /** the .docx under /public */
  file: string;
  /** the doc's own title lines */
  header: string[];
  questions: QCQuestion[];
}

export interface QCRank {
  rank: string;
  name: string;
  score: string;
  time: string;
}

export interface QCWeek {
  id: string;
  label: string;
  questionSet?: { file: string; header: string[]; notes: { label: string; lines: string[] }[] };
  sets: { tag: string; set: QCSet }[];
  results?: {
    header: string[];
    summary: { head: string[]; rows: string[][] };
    years: { year: string; ranks: QCRank[]; note?: string }[];
    notes: string[];
  };
  topPerformers?: { header: string[]; head: string[]; rows: string[][]; summary: string };
  winners?: { src: string; alt: string }[];
}

export const QC_ABOUT = {
  title: "About the Event",
  paragraphs: [
    "Quick Code is a five-week weekly MCQ challenge series organised by the Computer Society of Anna University (CSAU) to strengthen students' programming knowledge, core computer science fundamentals, and problem-solving abilities through short, time-bound challenges.",
    "Each week, participants are presented with five multiple-choice questions to be answered within five minutes, encouraging quick thinking, conceptual clarity, and consistent engagement with technical concepts.",
    "The series incorporates a continuous recognition mechanism to appreciate participants for their performance and consistency. Weekly winners are announced through CSAU's Instagram Stories, while participants demonstrating consistent participation, the fastest response times, and high scores are recognised through dedicated appreciation posters. A cumulative leaderboard tracks performance across all five weeks, culminating in final rankings and recognition for outstanding and consistent performers.",
    "Through its combination of competitive learning, regular participation, and public recognition, Quick Code aims to make technical learning engaging while encouraging students to continuously improve their programming and computer science skills.",
  ],
  poster: { src: "/images/quick-code/poster.webp", width: 1080, height: 1333 },
};

const W1_SOL: QCSet = {
  file: "/quick-code/W1_SOL.docx",
  header: [
    "QUICKCODE // 01",
    "Week 1 — Questions, Correct Answers & Explanations"
  ],
  questions: [
    {
      n: 1,
      title: "TIME & SPACE COMPLEXITY",
      prompt: [
        "What are the Time Complexity and Auxiliary Space Complexity of the following code?",
        {
          code: "int count = 0;\nfor (int i = 1; i <= n; i *= 2) {\n    for (int j = 0; j < i; j++) {\n        count++;\n    }\n}"
        }
      ],
      options: [
        "A. Time: O(n log n), Space: O(1)",
        "B. Time: O(n), Space: O(1)",
        "C. Time: O(log n), Space: O(n)",
        "D. Time: O(n²), Space: O(1)"
      ],
      answer: "B. Time: O(n), Space: O(1)",
      explanation: [
        "The outer loop takes values 1, 2, 4, 8, ... up to n. The inner loop runs i times for each outer-loop value.",
        "Total work = 1 + 2 + 4 + 8 + ... + n, which is a geometric series with total O(n).",
        "Only a constant number of variables are used, so the auxiliary space complexity is O(1)."
      ]
    },
    {
      n: 2,
      title: "PREDICT THE OUTPUT",
      prompt: [
        "What will be the output of the following code?",
        {
          code: "int x = 5;\ncout << x++ + ++x;"
        }
      ],
      options: [
        "A. 11",
        "B. 12",
        "C. 13",
        "D. The behavior is not well-defined"
      ],
      answer: "D. The behavior is not well-defined",
      explanation: [
        "The expression modifies x twice in the same expression: once through x++ and once through ++x.",
        "The operands of + do not provide a safe sequencing relationship for these modifications, so the expression has undefined / not well-defined behavior in C++. Therefore, a specific output cannot be reliably predicted."
      ]
    },
    {
      n: 3,
      title: "FIND THE OOP BUG",
      prompt: [
        "What is the problem with the following code?",
        {
          code: "class Animal {\npublic:\n    void sound() {\n        cout << \"Animal\";\n    }\n};\n\nclass Dog : public Animal {\npublic:\n    void sound() {\n        cout << \"Dog\";\n    }\n};\n\nAnimal* a = new Dog();\na->sound();"
        }
      ],
      options: [
        "A. The code will print Dog because of inheritance",
        "B. The code will print Animal because sound() is not declared virtual",
        "C. The code will result in a compilation error",
        "D. The code will print both AnimalDog"
      ],
      answer: "B. The code will print Animal because sound() is not declared virtual",
      explanation: [
        "The pointer type is Animal*, and sound() is not declared virtual. Therefore, the call is resolved using the static type Animal rather than the runtime object type Dog.",
        "To achieve runtime polymorphism, the base-class function should be declared virtual. Then a->sound() would call Dog::sound()."
      ]
    },
    {
      n: 4,
      title: "CHOOSE THE CORRECT ALGORITHMIC APPROACH",
      prompt: [
        "You are given a sorted array of integers and a target value x. You need to determine whether x exists in the array. The array can contain up to 10⁷ elements, and you want the most efficient approach. Which should you choose?"
      ],
      options: [
        "A. Linear Search",
        "B. Binary Search",
        "C. Bubble Sort followed by Linear Search",
        "D. DFS"
      ],
      answer: "B. Binary Search",
      explanation: [
        "Because the array is already sorted, Binary Search is the best choice.",
        "Each comparison removes approximately half of the remaining search space, giving O(log n) time complexity. This is much more efficient than Linear Search, which takes O(n), especially for an array containing up to 10⁷ elements."
      ]
    },
    {
      n: 5,
      title: "CHOOSE THE APPROPRIATE DATA STRUCTURE",
      prompt: [
        "You are building a feature that receives a continuous stream of numbers. At any point, you need to quickly retrieve the largest number seen so far, while also allowing new numbers to be inserted efficiently. Which data structure is most appropriate?"
      ],
      options: [
        "A. Queue",
        "B. Stack",
        "C. Max Heap / Priority Queue",
        "D. Linked List"
      ],
      answer: "C. Max Heap / Priority Queue",
      explanation: [
        "A Max Heap keeps the largest element at the top, allowing the maximum value to be retrieved in O(1) time.",
        "Inserting a new number takes O(log n), making it efficient for a continuous stream. A Queue, Stack, and Linked List do not provide equally efficient direct access to the largest element."
      ]
    }
  ]
};

const W2_OB_SOL: QCSet = {
  file: "/quick-code/W2_OB_SOL.docx",
  header: [
    "QuickCode // 02 — Set 2",
    "Quick Challenge. Sharp Thinking."
  ],
  questions: [
    {
      n: 1,
      title: "Recursive Function",
      level: "Easy",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "FUNCTION CountDown(n)\n    IF n = 0\n        RETURN\n    PRINT n\n    CountDown(n - 1)\nEND FUNCTION"
        },
        "If CountDown(4) is called, how many numbers will be printed?"
      ],
      options: [
        "A. 3",
        "B. 4",
        "C. 5",
        "D. 8"
      ],
      answer: "B",
      explanation: [
        "The function prints 4, 3, 2, and 1 before reaching 0. Therefore, 4 numbers are printed."
      ]
    },
    {
      n: 2,
      title: "Data Structure",
      level: "Easy",
      prompt: [
        "A system receives tasks in the following order:",
        "Task A → Task B → Task C → Task D",
        "The system must always process the oldest waiting task first.",
        "Which data structure is most suitable?"
      ],
      options: [
        "A. Stack",
        "B. Queue",
        "C. Tree",
        "D. Graph"
      ],
      answer: "B",
      explanation: [
        "A queue follows FIFO (First In, First Out), so the oldest waiting task is processed first."
      ]
    },
    {
      n: 3,
      title: "Algorithmic Approach",
      level: "Medium",
      prompt: [
        "You are given a sorted list of 1,000,000 numbers.",
        "You need to determine whether the number 725 exists in the list.",
        "Which approach would generally be the most efficient?"
      ],
      options: [
        "A. Check every number from the beginning until 725 is found",
        "B. Start from the last number and move backwards",
        "C. Repeatedly check the middle element and eliminate half of the remaining list",
        "D. Compare every possible pair of numbers"
      ],
      answer: "C",
      explanation: [
        "Because the list is sorted, binary search can repeatedly eliminate half of the remaining elements, giving O(log n) search time."
      ]
    },
    {
      n: 4,
      title: "Predict the Output",
      level: "Medium",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "SET x = 5\nSET y = 2\nWHILE x > 0\n    x = x - y\n    PRINT x\nEND WHILE"
        },
        "What will be printed?"
      ],
      options: [
        "A.\n3\n1\n-1",
        "B.\n5\n3\n1",
        "C.\n3\n1",
        "D.\n2\n1\n0"
      ],
      answer: "A",
      explanation: [
        "Starting with x = 5, the loop subtracts 2 each time and prints the new value: 3, then 1, then -1. The loop stops after x becomes -1 because x > 0 is then false."
      ]
    },
    {
      n: 5,
      title: "Most Efficient Approach",
      level: "Tricky",
      prompt: [
        "You are given a list of numbers:",
        "8, 3, 5, 3, 2, 8, 4",
        "You need to determine whether any number appears more than once.",
        "Which approach is generally the most efficient?"
      ],
      options: [
        "A. Compare every number with every other number",
        "B. Sort the list and check neighboring elements",
        "C. Keep track of numbers already seen and check each new number against them",
        "D. Check only the first and last elements"
      ],
      answer: "C",
      explanation: [
        "By keeping track of numbers already seen, each new number can be checked against that collection. With an appropriate lookup structure, this takes expected O(n) time, making it more efficient than comparing every pair."
      ]
    }
  ]
};

const W2_RG_SOL: QCSet = {
  file: "/quick-code/W2_RG_SOL.docx",
  header: [
    "QuickCode // 02",
    "Quick Challenge. Sharp Thinking."
  ],
  questions: [
    {
      n: 1,
      title: "Recursive Function",
      level: "Easy",
      prompt: [
        "Consider the following function:",
        {
          code: "void fun(int n) {\n    if (n <= 0)\n        return;\n    cout << n << \" \";\n    fun(n - 1);\n}"
        },
        "If fun(5) is called, how many times is fun() called in total, including the initial call?"
      ],
      options: [
        "A. 4",
        "B. 5",
        "C. 6",
        "D. 10"
      ],
      answer: "C — 6",
      explanation: [
        "The calls are:",
        "fun(5) → fun(4) → fun(3) → fun(2) → fun(1) → fun(0)"
      ]
    },
    {
      n: 2,
      title: "Appropriate Data Structure",
      level: "Easy",
      prompt: [
        "You are designing a browser's Back button.",
        "Every time a user visits a new page, the current page is stored. When the user clicks Back, the most recently visited page should be retrieved first.",
        "Which data structure is most appropriate?"
      ],
      options: [
        "A. Queue",
        "B. Stack",
        "C. Heap",
        "D. Hash Table"
      ],
      answer: "B — Stack",
      explanation: [
        "This follows LIFO (Last In, First Out)."
      ]
    },
    {
      n: 3,
      title: "Choose the Correct Algorithmic Approach",
      level: "Medium",
      prompt: [
        "You are given an array of positive integers and need to find whether there exists a contiguous subarray whose sum is exactly K.",
        "Which approach is most appropriate when all array elements are positive?"
      ],
      options: [
        "A. Sliding Window / Two Pointers",
        "B. DFS",
        "C. Merge Sort",
        "D. Binary Search directly on the array"
      ],
      answer: "A — Sliding Window / Two Pointers",
      explanation: [
        "Because all numbers are positive, increasing the right pointer increases the sum and moving the left pointer decreases it, allowing the window to be adjusted efficiently."
      ]
    },
    {
      n: 4,
      title: "Most Efficient Approach",
      level: "Medium",
      prompt: [
        "You need to answer 100,000 queries of the form:",
        "\"How many times does the number x occur in the array?\"",
        "The array contains 100,000 integers and does not change between queries.",
        "Which approach is most efficient?"
      ],
      options: [
        "A. For every query, scan the entire array",
        "B. Sort the array and perform binary searches for each query",
        "C. Build a frequency hash map once, then answer each query using it",
        "D. Use nested loops to compare every query with every element"
      ],
      answer: "C",
      explanation: [
        "Building the frequency map takes expected O(n), after which each query can be answered in expected O(1)."
      ]
    },
    {
      n: 5,
      title: "OOP Bug",
      level: "Tricky",
      prompt: [
        "Consider the following C++ code:",
        {
          code: "class Base {\npublic:\n    virtual void show() {\n        cout << \"Base\";\n    }\n};\nclass Derived : public Base {\npublic:\n    void show() {\n        cout << \"Derived\";\n    }\n};\nint main() {\n    Base* ptr = new Derived();\n    delete ptr;\n}"
        },
        "What is the main issue with this code?"
      ],
      options: [
        "A. show() should not be virtual",
        "B. Derived cannot inherit from Base",
        "C. Base should have a virtual destructor",
        "D. The pointer should be of type Derived*"
      ],
      answer: "C — Base should have a virtual destructor",
      explanation: [
        "Since an object of Derived is being deleted through a Base*, the base class should have a virtual destructor to ensure proper destruction of the derived object."
      ]
    }
  ]
};

const W3_OB_SOL: QCSet = {
  file: "/quick-code/W3_OB_SOL.docx",
  header: [
    "QuickCode // 03 — Orange & Brown Set",
    "Quick Challenge. Sharp Thinking."
  ],
  questions: [
    {
      n: 1,
      title: "Logical Tracing",
      level: "Easy",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "SET A = 8\nSET B = 5\nIF A > B\n    SET A = A - B\nELSE\n    SET B = B - A\nPRINT A\nPRINT B"
        },
        "What will be printed?"
      ],
      options: [
        "A. 3, 5",
        "B. 8, 3",
        "C. 5, 3",
        "D. 3, 8"
      ],
      answer: "A — 3, 5",
      explanation: [
        "Since A (8) is greater than B (5), A becomes 8 - 5 = 3. B remains 5. Therefore, the output is 3, 5."
      ]
    },
    {
      n: 2,
      title: "Pattern Recognition",
      level: "Easy",
      prompt: [
        "Consider the following sequence:",
        "2, 6, 12, 20, 30, ?",
        "Which number should come next?"
      ],
      options: [
        "A. 36",
        "B. 40",
        "C. 42",
        "D. 44"
      ],
      answer: "C — 42",
      explanation: [
        "The differences are 4, 6, 8, 10, so the next difference is 12. Therefore, 30 + 12 = 42."
      ]
    },
    {
      n: 3,
      title: "Logical Thinking",
      level: "Medium",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "SET count = 0\nFOR each number from 1 to 10\n    IF number is divisible by 2\n        count = count + 1\nPRINT count"
        },
        "What will be printed?"
      ],
      options: [
        "A. 4",
        "B. 5",
        "C. 6",
        "D. 10"
      ],
      answer: "B — 5",
      explanation: [
        "The even numbers from 1 to 10 are 2, 4, 6, 8, and 10. Therefore, count becomes 5."
      ]
    },
    {
      n: 4,
      title: "Algorithmic Thinking",
      level: "Medium",
      prompt: [
        "You have 8 boxes, and exactly one box contains a heavier object.",
        "You have a weighing machine that can compare the weight of objects placed on its two sides.",
        "What is the minimum number of weighings needed to guarantee finding the heavier box?"
      ],
      options: [
        "A. 1",
        "B. 2",
        "C. 3",
        "D. 4"
      ],
      answer: "C — 3",
      explanation: [
        "Split the 8 boxes into groups of 3, 3, and 2. Weigh two groups of 3. If they are equal, the heavier box is among the remaining 2; otherwise, it is in the heavier group. Continue splitting the remaining candidates. Three weighings are sufficient in the worst case."
      ]
    },
    {
      n: 5,
      title: "Logical Reasoning",
      level: "Tricky",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "SET x = 1\nREPEAT 5 TIMES\n    x = x × 2\n    IF x > 5\n        x = x - 3"
        },
        "After the loop finishes, what is the value of x?"
      ],
      options: [
        "A. 5",
        "B. 7",
        "C. 9",
        "D. 11"
      ],
      answer: "D — 11",
      explanation: [
        "Starting with x = 1, the values after each iteration are 2, 4, 5, 7, and 11. Therefore, the final value of x is 11."
      ]
    }
  ]
};

const W3_RG_SOL: QCSet = {
  file: "/quick-code/W3_RG_SOL.docx",
  header: [
    "QuickCode // 03 — Red & Grey Set",
    "Quick Challenge. Sharp Thinking."
  ],
  questions: [
    {
      n: 1,
      title: "Data Structures",
      level: "Medium",
      prompt: [
        "You need to design a data structure that supports these three operations:",
        "Insert(x) → Insert an element x",
        "Delete(x) → Delete an element x",
        "GetMin() → Return the minimum element",
        "All three operations should ideally run in O(log n) time.",
        "Which data structure is most appropriate?"
      ],
      options: [
        "A. Stack",
        "B. Queue",
        "C. Min-Heap",
        "D. Hash Set"
      ],
      answer: "C — Min-Heap",
      explanation: [
        "A min-heap supports insertion and deletion of the minimum element in O(log n), while retrieving the minimum element takes O(1)."
      ]
    },
    {
      n: 2,
      title: "Graph Algorithms",
      level: "Medium",
      prompt: [
        "Consider an unweighted graph where every edge has the same cost.",
        "You need to find the shortest path from a source vertex to every other reachable vertex.",
        "Which algorithm is most appropriate?"
      ],
      options: [
        "A. Depth First Search (DFS)",
        "B. Breadth First Search (BFS)",
        "C. Dijkstra's Algorithm",
        "D. Kruskal's Algorithm"
      ],
      answer: "B — Breadth First Search (BFS)",
      explanation: [
        "BFS explores the graph level by level. In an unweighted graph, the first time a vertex is reached, it is reached through the shortest possible path. DFS does not guarantee shortest paths."
      ]
    },
    {
      n: 3,
      title: "Algorithmic Approach",
      level: "Medium–Hard",
      prompt: [
        "You are given an array of n integers and need to determine whether two elements have a sum equal to K.",
        "You are allowed to use additional memory.",
        "Which approach gives the best expected time complexity among the following?"
      ],
      options: [
        "A. Check every pair of elements",
        "B. Sort the array and use two pointers",
        "C. Store previously seen elements in a hash-based structure",
        "D. Use binary search for every possible pair"
      ],
      answer: "C — Store previously seen elements in a hash-based structure",
      explanation: [
        "A hash-based structure allows each element to be checked against the required complement in expected O(1), giving expected O(n) total time."
      ]
    },
    {
      n: 4,
      title: "Data Structures & Algorithms",
      level: "Hard",
      prompt: [
        "You need to process these operations on a collection of integers:",
        "Insert(x) → Insert x",
        "Delete(x) → Delete one occurrence of x",
        "Find(x) → Check whether x exists",
        "FindMin() → Return the minimum element",
        "The collection may contain duplicate values, and all operations should be performed efficiently.",
        "Which option is most suitable?"
      ],
      options: [
        "A. Hash Set",
        "B. Stack",
        "C. Balanced Binary Search Tree / Multiset",
        "D. Simple Array"
      ],
      answer: "C — Balanced Binary Search Tree / Multiset",
      explanation: [
        "A balanced BST-based multiset supports duplicates while maintaining ordered elements, allowing search, insertion, deletion, and finding the minimum efficiently, typically in O(log n)."
      ]
    },
    {
      n: 5,
      title: "Complexity Analysis",
      level: "Tricky",
      prompt: [
        "Consider this pseudocode:",
        {
          code: "FUNCTION solve(n)\n    i = 1\n    WHILE i ≤ n\n        j = i\n        WHILE j ≤ n\n            PRINT(j)\n            j = j + i\n        i = i × 2\nEND FUNCTION"
        },
        "What is the tightest asymptotic time complexity of solve(n)?"
      ],
      options: [
        "A. O(n)",
        "B. O(n log n)",
        "C. O(n²)",
        "D. O(log² n)"
      ],
      answer: "A — O(n)",
      explanation: [
        "The outer loop doubles i, giving O(log n) iterations. For each value of i, the inner loop runs about n/i times. The total work is n + n/2 + n/4 + ... = O(n)."
      ]
    }
  ]
};

const W4_OB_SOL: QCSet = {
  file: "/quick-code/W4_OB_SOL.docx",
  header: [
    "QuickCode — Week 4",
    "Orange & Brown Tags — 1st & 2nd Years",
    "Time: 5 minutes | Questions: 5 | Solutions"
  ],
  questions: [
    {
      n: 1,
      title: "Binary Search",
      prompt: [
        "You have a sorted list:",
        "[2, 5, 8, 12, 16, 21, 25]",
        "You want to find the number 21. Which approach is most efficient?"
      ],
      options: [
        "A. Check every element from left to right",
        "B. Start from the middle and repeatedly eliminate half of the remaining elements",
        "C. Compare only the first and last elements",
        "D. Rearrange the list and then search"
      ],
      answer: "B",
      explanation: [
        "Because the list is sorted, binary search repeatedly eliminates half of the remaining elements, making it more efficient than checking elements one by one."
      ]
    },
    {
      n: 2,
      title: "Stack",
      prompt: [
        "A stack initially contains:",
        "10, 20, 30",
        "where 30 is at the top.",
        "The following operations are performed:",
        "• POP",
        "• PUSH 40",
        "• POP",
        "What element will be removed by the second POP?"
      ],
      options: [
        "A. 10",
        "B. 20",
        "C. 30",
        "D. 40"
      ],
      answer: "D",
      explanation: [
        "The first POP removes 30. PUSH 40 puts 40 on top. Therefore, the second POP removes 40."
      ]
    },
    {
      n: 3,
      title: "Logical Tracing",
      prompt: [
        "Start with n = 2.",
        "Repeat 3 times:",
        "• multiply n by 2",
        "• subtract 1",
        "What is the final value of n?"
      ],
      options: [
        "A. 7",
        "B. 9",
        "C. 11",
        "D. 15"
      ],
      answer: "B",
      explanation: [
        "Starting with 2: after the first iteration n = 3, after the second n = 5, and after the third n = 9. Therefore, the answer is B."
      ]
    },
    {
      n: 4,
      title: "Queue",
      prompt: [
        "A queue initially contains:",
        "10 → 20 → 30 → 40",
        "where 10 is at the front.",
        "The following operations are performed:",
        "• DEQUEUE",
        "• ENQUEUE 50",
        "• DEQUEUE",
        "What will be at the front of the queue after these operations?"
      ],
      options: [
        "A. 20",
        "B. 30",
        "C. 40",
        "D. 50"
      ],
      answer: "B",
      explanation: [
        "The first DEQUEUE removes 10. ENQUEUE 50 adds 50 to the rear. The second DEQUEUE removes 20. Therefore, 30 is now at the front."
      ]
    },
    {
      n: 5,
      title: "Linked List",
      prompt: [
        "A linked list contains:",
        "10 → 20 → 30 → 40",
        "You want to insert 25 between 20 and 30. Which links need to change?"
      ],
      options: [
        "A. Only the link from 20",
        "B. Only the link from 30",
        "C. The links from 20 and 25",
        "D. The links from 10 and 30"
      ],
      answer: "C",
      explanation: [
        "The link from 20 must point to 25, and the new node 25 must point to 30. Therefore, two links change."
      ]
    }
  ]
};

const W4_RG_SOL: QCSet = {
  file: "/quick-code/W4_RG_SOL.docx",
  header: [
    "QuickCode — Week 4",
    "Red & Grey Tags — 3rd & 4th Years",
    "Time: 5 minutes | Questions: 5"
  ],
  questions: [
    {
      n: 1,
      title: "Time Complexity",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "i = 1\nwhile i <= n:\n    j = 1\n    while j <= i:\n        print(j)\n        j = j * 2\n    i = i * 2"
        },
        "What is the tightest time complexity?"
      ],
      options: [
        "A. O(log n)",
        "B. O((log n)²)",
        "C. O(n)",
        "D. O(n log n)"
      ],
      answer: "B. O((log n)²)",
      explanation: []
    },
    {
      n: 2,
      title: "Two Pointers",
      prompt: [
        "A sorted array is given:",
        "[2, 4, 7, 9, 13, 18]",
        "You need to determine whether two different elements sum to 20.",
        "Which approach can solve this in O(n) time?"
      ],
      options: [
        "A. Compare every possible pair",
        "B. Use two pointers, one at each end, moving based on the current sum",
        "C. Use binary search for every element",
        "D. Use nested loops and skip duplicate values"
      ],
      answer: "B. Use two pointers, one at each end",
      explanation: []
    },
    {
      n: 3,
      title: "Graph Algorithms",
      prompt: [
        "You are given a weighted graph with non-negative edge weights.",
        "You need to find the shortest distance from one source vertex to every other vertex.",
        "Which algorithm is most appropriate?"
      ],
      options: [
        "A. BFS",
        "B. DFS",
        "C. Dijkstra's Algorithm",
        "D. Topological Sort"
      ],
      answer: "C. Dijkstra's Algorithm",
      explanation: []
    },
    {
      n: 4,
      title: "Stack / Expression Evaluation",
      prompt: [
        "Consider the postfix expression:",
        {
          code: "5 3 2 * +"
        },
        "What is the final result when this expression is evaluated using a stack?"
      ],
      options: [
        "A. 11",
        "B. 16",
        "C. 21",
        "D. 25"
      ],
      answer: "A. 11",
      explanation: []
    },
    {
      n: 5,
      title: "Recursion / Complexity",
      prompt: [
        "Consider:",
        {
          code: "FUNCTION solve(n):\n    if n <= 1:\n        return\n    solve(n - 1)\n    solve(n - 1)"
        },
        "What is the approximate time complexity?"
      ],
      options: [
        "A. O(n)",
        "B. O(n log n)",
        "C. O(2ⁿ)",
        "D. O(n²)"
      ],
      answer: "C. O(2ⁿ)",
      explanation: []
    }
  ]
};

const W5_OB_SOL: QCSet = {
  file: "/quick-code/W5_OB_SOL.docx",
  header: [
    "QUICKCODE // 05",
    "ORANGE & BROWN TAGS",
    "Organiser copy — questions with answers and explanations"
  ],
  questions: [
    {
      n: 1,
      title: "Predict the Output",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "x = 3\ny = 2\n\nrepeat 3 times:\n    x = x + y\n    y = y + 1\n\nprint(x)"
        },
        "What is the output?"
      ],
      options: [
        "A. 9",
        "B. 12",
        "C. 15",
        "D. 18"
      ],
      answer: "B. 12",
      explanation: [
        "Initially, x = 3 and y = 2. After the first iteration, x = 5 and y = 3. After the second, x = 8 and y = 4. After the third, x = 12 and y = 5. Therefore, the output is 12."
      ]
    },
    {
      n: 2,
      title: "Data Structures",
      prompt: [
        "A printer receives multiple documents. It should print them in the same order in which they were submitted.",
        "Which data structure is most suitable?"
      ],
      options: [
        "A. Stack",
        "B. Queue",
        "C. Max-Heap",
        "D. Binary Search Tree"
      ],
      answer: "B. Queue",
      explanation: [
        "A queue follows FIFO (First In, First Out). The document submitted first is printed first, preserving the order of submission."
      ]
    },
    {
      n: 3,
      title: "Searching Algorithms",
      prompt: [
        "You have a sorted array containing 10,000 integers. You want to find a particular value efficiently.",
        "Which algorithm is most suitable?"
      ],
      options: [
        "A. Linear Search",
        "B. Bubble Sort",
        "C. Binary Search",
        "D. Depth-First Search"
      ],
      answer: "C. Binary Search",
      explanation: [
        "Binary search repeatedly divides the search range in half. Since the array is sorted, it can locate the target in O(log n) time, making it more efficient than linear search for large arrays."
      ]
    },
    {
      n: 4,
      title: "Sorting",
      prompt: [
        "A single complete pass of Bubble Sort is performed in ascending order on the array:",
        "[6, 2, 5, 1, 4]",
        "What will the array look like after that pass?"
      ],
      options: [
        "A. [2, 5, 1, 4, 6]",
        "B. [2, 6, 5, 1, 4]",
        "C. [1, 2, 4, 5, 6]",
        "D. [2, 1, 4, 5, 6]"
      ],
      answer: "A. [2, 5, 1, 4, 6]",
      explanation: [
        "Compare adjacent elements from left to right and swap whenever they are out of order: [6,2,5,1,4] → [2,6,5,1,4] → [2,5,6,1,4] → [2,5,1,6,4] → [2,5,1,4,6]. The largest element, 6, moves to the last position."
      ]
    },
    {
      n: 5,
      title: "Arrays and Logic",
      prompt: [
        "An array contains the elements:",
        "[4, 7, 2, 9, 5]",
        "You reverse the order of the elements. What is the resulting array?"
      ],
      options: [
        "A. [5, 9, 2, 7, 4]",
        "B. [4, 5, 2, 7, 9]",
        "C. [9, 7, 5, 2, 4]",
        "D. [5, 7, 2, 9, 4]"
      ],
      answer: "A. [5, 9, 2, 7, 4]",
      explanation: [
        "Reversing an array places the last element first, the second-last element second, and so on. The original first element becomes the last element."
      ]
    }
  ]
};

const W5_RG_SOL: QCSet = {
  file: "/quick-code/W5_RG_SOL.docx",
  header: [
    "QUICKCODE // 05",
    "RED & GREY TAGS",
    "Organiser copy — questions with answers and explanations"
  ],
  questions: [
    {
      n: 1,
      title: "Time Complexity",
      prompt: [
        "Consider the following pseudocode:",
        {
          code: "for i = 1 to n:\n    j = i\n    while j > 1:\n        j = j / 2"
        },
        "What is the tightest time complexity?"
      ],
      options: [
        "A. O(n)",
        "B. O(log n)",
        "C. O(n log n)",
        "D. O(n²)"
      ],
      answer: "C. O(n log n)",
      explanation: [
        "For each i, the inner loop runs approximately log₂(i) times. Summing this over i = 1 to n gives Θ(n log n)."
      ]
    },
    {
      n: 2,
      title: "Algorithmic Approach",
      prompt: [
        "You are given an unsorted array of n integers. You need to determine whether two different elements have a sum equal to a given value K.",
        "Which approach guarantees O(n log n) time complexity?"
      ],
      options: [
        "A. Compare every pair of elements.",
        "B. Sort the array, then use two pointers.",
        "C. Use binary search for every possible pair.",
        "D. Use recursion to generate all pairs."
      ],
      answer: "B. Sort the array, then use two pointers.",
      explanation: [
        "Sorting takes O(n log n), and the two-pointer scan takes O(n), so the overall time complexity is O(n log n)."
      ]
    },
    {
      n: 3,
      title: "Data Structures",
      prompt: [
        "A task scheduler must repeatedly select the task with the highest priority. New tasks can arrive at any time, and after processing a task, the scheduler must efficiently select the next highest-priority task.",
        "Which data structure is the most suitable?"
      ],
      options: [
        "A. Stack",
        "B. Queue",
        "C. Max-Heap",
        "D. Hash Set"
      ],
      answer: "C. Max-Heap",
      explanation: [
        "A max-heap supports insertion and removal of the highest-priority task in O(log n), and the maximum can be inspected in O(1)."
      ]
    },
    {
      n: 4,
      title: "Recursion",
      prompt: [
        "Consider the following recursive function:",
        {
          code: "solve(n):\n    if n <= 1:\n        return\n    solve(n / 2)\n    solve(n / 2)"
        },
        "What is its tightest time complexity, assuming integer division and constant work per call?"
      ],
      options: [
        "A. O(log n)",
        "B. O(n)",
        "C. O(n log n)",
        "D. O(2ⁿ)"
      ],
      answer: "B. O(n)",
      explanation: [
        "The recurrence is T(n) = 2T(n/2) + O(1), giving O(n) total work."
      ]
    },
    {
      n: 5,
      title: "Graph Algorithms",
      prompt: [
        "You are given a weighted graph with non-negative edge weights. You need to find the shortest distance from a source vertex to every other vertex.",
        "Which algorithm is the standard choice?"
      ],
      options: [
        "A. Prim's Algorithm",
        "B. Kruskal's Algorithm",
        "C. Dijkstra's Algorithm",
        "D. Binary Search"
      ],
      answer: "C. Dijkstra's Algorithm",
      explanation: [
        "Dijkstra's algorithm computes shortest paths from a source when all edge weights are non-negative."
      ]
    }
  ]
};

const OB = "Orange & Brown Tags — 1st & 2nd Years";
const RG = "Red & Grey Tags — 3rd & 4th Years";

export const QC_WEEKS: QCWeek[] = [
  {
    id: "week-01",
    label: "WEEK 01",
    questionSet: {
      file: "/quick-code/QuickCode_01_Week_1_Question_Set.docx",
      header: ["QUICKCODE // 01", "Week 1 — Quick Challenge. Sharp Thinking.", "MCQ Question Set | 5 Questions"],
      notes: [
        { label: "Purpose", lines: ["A short, thinking-oriented programming challenge covering five core problem-solving concepts."] },
        {
          label: "Submission Note",
          lines: [
            "The question set is designed to assess practical reasoning rather than direct recall. It covers complexity analysis, code-output prediction, object-oriented programming, algorithm selection, and data-structure selection.",
          ],
        },
        {
          label: "Difficulty Profile",
          lines: [
            "Q1 — Moderate: requires summation reasoning across a doubling loop.",
            "Q2 — Tricky: tests understanding of C++ expression evaluation rules.",
            "Q3 — Moderate: tests static binding versus virtual dispatch.",
            "Q4 — Easy: tests algorithm selection for a sorted array.",
            "Q5 — Easy–Moderate: tests matching operations to a suitable data structure.",
          ],
        },
      ],
    },
    sets: [{ tag: "", set: W1_SOL }],
  },
  {
    id: "week-02",
    label: "WEEK 02",
    sets: [
      { tag: OB, set: W2_OB_SOL },
      { tag: RG, set: W2_RG_SOL },
    ],
    results: {
      header: [
        "Top Performers in Week 02 Quick Code",
        "Year-wise ranking based on Score and Completion Time",
        "Assessment response data – 12–13 September 2026",
      ],
      summary: {
        head: ["Year", "Top Score", "Fastest Top-5 Time", "Eligible Top-5 Entries"],
        rows: [
          ["4th Year", "5/5", "2m 58s", "2"],
          ["3rd Year", "5/5", "1m 29s", "5"],
          ["2nd Year", "5/5", "1m 36s", "5"],
          ["1st Year", "5/5", "2m 12s", "5"],
        ],
      },
      years: [
        {
          year: "4th Year",
          ranks: [
            { rank: "1st", name: "Haribhrasath C V", score: "5/5", time: "2m 58s" },
            { rank: "2nd", name: "Mohammed Rayhan R", score: "5/5", time: "4m 20s" },
          ],
          note: "Note: Only 2 unique in-time eligible performer(s) from 4th Year were present in the supplied spreadsheets; therefore a full five-person ranking is not possible without additional submissions.",
        },
        {
          year: "3rd Year",
          ranks: [
            { rank: "1st", name: "Bavishya N", score: "5/5", time: "1m 29s" },
            { rank: "2nd", name: "Sabarirajan R", score: "5/5", time: "3m 07s" },
            { rank: "3rd", name: "Sreehari V P", score: "5/5", time: "3m 45s" },
            { rank: "4th", name: "Akshaya K", score: "5/5", time: "4m 05s" },
            { rank: "5th", name: "Yazhini C", score: "5/5", time: "4m 44s" },
          ],
        },
        {
          year: "2nd Year",
          ranks: [
            { rank: "1st", name: "MONICA G", score: "5/5", time: "1m 36s" },
            { rank: "2nd", name: "SHRIYA K", score: "5/5", time: "2m 12s" },
            { rank: "3rd", name: "Tarika P", score: "5/5", time: "2m 21s" },
            { rank: "4th", name: "Raeed", score: "5/5", time: "2m 25s" },
            { rank: "5th", name: "Vigneshwaran R", score: "5/5", time: "2m 27s" },
          ],
        },
        {
          year: "1st Year",
          ranks: [
            { rank: "1st", name: "N D Magima", score: "5/5", time: "2m 12s" },
            { rank: "2nd", name: "Ahmed Anas H", score: "5/5", time: "2m 18s" },
            { rank: "3rd", name: "Ragavendraa K", score: "5/5", time: "2m 19s" },
            { rank: "4th", name: "Suriya Verma S", score: "5/5", time: "2m 46s" },
            { rank: "5th", name: "Sachin Vijaykumar", score: "5/5", time: "3m 09s" },
          ],
        },
      ],
      notes: [
        "55 valid submission records were identified across the two supplied spreadsheets before de-duplication.",
        "50 unique roll numbers remained after consolidating repeated submissions.",
        "The ranking uses the recorded Score and Form Timer fields only; no additional performance metric has been introduced.",
      ],
    },
    topPerformers: {
      header: [
        "Consecutive Top Performers Week 1&2",
        "Students who appeared in the Top 5 in both Week 01 and Week 02",
      ],
      head: ["Year", "Student", "Week 01 Rank", "Week 02 Rank"],
      rows: [
        ["1st Year", "Ragavendraa K", "1st", "3rd"],
        ["2nd Year", "MONICA G", "5th", "1st"],
        ["3rd Year", "Sabarirajan R", "5th", "2nd"],
        ["4th Year", "Haribhrasath C V", "3rd", "1st"],
      ],
      summary: "4 students appeared in the Top 5 consecutively across Week 01 and Week 02.",
    },
    winners: [
      { src: "/images/quick-code/week2-winners-1.webp", alt: "Quick Code Orange Tags Winners week 2" },
      { src: "/images/quick-code/week2-winners-2.webp", alt: "Quick Code Brown Tags Winners week 2" },
      { src: "/images/quick-code/week2-winners-3.webp", alt: "Quick Code Red Tags Winners week 2" },
    ],
  },
  {
    id: "week-03",
    label: "WEEK 03",
    sets: [
      { tag: OB, set: W3_OB_SOL },
      { tag: RG, set: W3_RG_SOL },
    ],
  },
  {
    id: "week-04",
    label: "WEEK 04",
    sets: [
      { tag: OB, set: W4_OB_SOL },
      { tag: RG, set: W4_RG_SOL },
    ],
  },
  {
    id: "week-05",
    label: "WEEK 05",
    sets: [
      { tag: OB, set: W5_OB_SOL },
      { tag: RG, set: W5_RG_SOL },
    ],
  },
];
