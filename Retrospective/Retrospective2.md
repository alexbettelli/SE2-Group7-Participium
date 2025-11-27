# RETROSPECTIVE #2 (Team 7)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done : 5 - 5
- Total points committed vs. done : 36 - 36
- Nr of hours planned vs. spent (as a team) : 96 - 92h 52m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                    | # Tasks | Points | Hours est. | Hours actual |
| ------------------------ | ------- | ------ | ---------- | ------------ |
| _Uncategorized_          | 16      |        | 1w 1d 6h   | 1w 1d 4h 15m |
| #6 Report Review         | 5       | 5      | 1d         | 7h 10m       |
| #7 Approved Reports List | 5       | 13     | 1d 1h      | 1d 15m       |
| #8 List Assigned Reports | 3       | 2      | 5h         | 5h 43m       |
| #9 Account Configuration | 3       | 3      | 5h 30m     | 5h 5m        |
| #11 Update Report Status | 10      | 13     | 1d 6h 30m  | 1d 6h 24m    |

- Hours per task average, standard deviation (estimate and actual)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Estimation | 2h 17m | 2h 43m |
| Actual     | 2h 12m | 2h 32m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1 : -0,032638889

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 =  -0,032638889$$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

$$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,089087302$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 6h
  - Total hours spent: 5h 20m
  - Nr of automated unit test cases: 33
- E2E testing:
  - Total hours estimated: 6h
  - Total hours spent: 5h 5m
  - Nr of test cases: 66
- Code review
  - Total hours estimated: 2h
  - Total hours spent: 2h
- Total Coverage: 84.69%

## ASSESSMENT

- What did go wrong in the sprint?

  - Tests were performed only in the last few days;
  - Quality of tests decreased due to the previous issue (lower coverage than in Sprint 1)

- What caused your errors in estimation (if any)?

  - Very little error in the estimations

- What lessons did you learn (both positive and negative) in this sprint?

  - We achieved a good level of accuracy in estimating tasks
  - The later the testing phase starts, the lower the quality of the tests, especially as the project increases in size and complexity.

- Which improvement goals set in the previous retrospective were you able to achieve?

  - We improved an already good task estimation error, especially relatively to documentation and code merging operations.

- Which ones you were not able to achieve? Why?

  - Earlier deadline to write and perform tests: as decided in the previous retrospective, we introduced a deadline for coding tasks to leave more time for testing. However, we were not able to meet it.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  - We should improve communication between members writing code and members writing tests so that the two tasks can be performed in parallel.

  - We should increase test coverage also by writing code that is easy to test.

- One thing you are proud of as a Team!!

  - We are all very proud that as a team we chose to focus on the quality of our work instead of the quality. Instead of rushing through the user stories, we selected the right amount of work to let us deliver a product we can be proud of.
    We are also grateful for Claudio's efforts in collecting photos for the demo.
