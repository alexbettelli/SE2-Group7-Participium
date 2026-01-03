# RETROSPECTIVE #3 (Team 7)

=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 4 - 4
- Total points committed vs done : 26 - 26
- Nr of hours planned vs spent (as a team) : 96h - 93h 45m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

### Detailed statistics

| Story                                     | # Tasks | Points | Hours est. | Hours actual |
| ----------------------------------------- | ------- | ------ | ---------- | ------------ |
| #0                                        | 23      | -      | 1w 4d      | 1w 4d        |
| #24 Assign report to external maintainers | 3       | 8      | 6h         | 5h           |
| #25 External maintainers update status    | 3       | 2      | 5h         | 4h 50m       |
| #26 Exchange info and comments            | 3       | 8      | 7h 30m     | 6h 40m       |
| #27 Confirmation code                     | 4       | 8      | 5h 30m     | 5h 15m       |

- Hours per task (average, standard deviation)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Estimation | 2h 40m | 3h 18m |
| Actual     | 2h 36m | 3h 12m |

- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1: 0.024

  $$\frac{\sum_i estimation_{task_i}}{\sum_i spent_{task_i}} - 1 =  0.024$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated : 5h
  - Total hours spent: 5h 25m
  - Nr of automated unit test cases: 86
  - Coverage (if available): 87.25%
- Integration testing:
  - Total hours estimated: 5h
  - Total hours spent: 4h 15m
  - Nr of automated unit test cases: 78
  - Coverage (if available): 82.34%
- Code review:
  - Total hours estimated: 1h
  - Total hours spent: 1h 20m
- **Total Coverage: 86.78% (164 test cases)**

  > **Note: Code review was also used for E2E simulation on the UI**

- Technical Debt management:
  - Strategy adopted: Code coverage >= 80% and fix previous issues to obtain at least all B grades in maintainability and reliability
  - Total hours estimated at sprint planning: 3h(documentation) + 6h(fix issues) + 1h 30m(manage test coverage) = 10h 30m
  - Total hours spent: 3h + 6h 30m + 1h 50m = 11h 20m

## ASSESSMENT

- What caused your errors in estimation (if any)?

  - Very minimal errors in the estimations

- What lessons did you learn (both positive and negative) in this sprint?

  - We should be mindful about the quality of the code we write to reduce over time the overall technical debt.
  - Dividing the workload evenly during the sprint and adding fixed deadlines leads to better results.

- Which improvement goals set in the previous retrospective were you able to achieve?
  - The coding phase was completed earlier, allowing for more accurate and thorough testing.
  - Communication between team members was improved.
- Which ones you were not able to achieve? Why?

  - All goals set in the previous retrospective were successfully achieved.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  - Allocate more time and attention to addressing technical debt issues.

- One thing you are proud of as a Team!!
  - The team is proud of prioritizing the quality of the work. During this sprint, even though the focus was on fixing and refactoring the code to achieve greater accuracy and reliability, we managed to keep up with the development of new stories.
