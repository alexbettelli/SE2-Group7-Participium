# TEMPLATE FOR RETROSPECTIVE (Team ##)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done: 5 / 5
- Total points committed vs. done: 28 / 28
- Nr of hours planned vs. spent (as a team): 96h / 90h 06m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                | # Tasks | Points | Hours est. | Hours actual |
| -------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_      | 13      | 0      | 55h 30m    | 49h 18m      |
| Citizen registration | 3       | 2      | 5h         | 5h 20m       |
| Administrator setup  | 5       | 3      | 8h 30m     | 7h 25m       |
| Role assignment      | 3       | 2      | 5h 30m     | 6h           |
| Geolocalization      | 3       | 8      | 7h         | 5h 40m       |
| Report compilation   | 6       | 13     | 14h 30m    | 16h 26m      |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean   | StDev  |
| ---------- | ------ | ------ |
| Estimation | 2h 54m | 2h 28m |
| Actual     | 2h 43m | 2h 24m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0,06489$$

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

  $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0,15387$$

## QUALITY MEASURESW

- Unit Testing:
  - Total hours estimated: 6h
  - Total hours spent: 6h
  - Nr of automated unit test cases: 14
- E2E testing:
  - Total hours estimated: 6h
  - Total hours spent: 6h 45m
  - Nr of test cases: 34
  - Total coverage: 92.89%
- Code review
  - Total hours estimated: 1h 30m
  - Total hours spent: 1h 20m

## ASSESSMENT

- What did go wrong in the sprint?

  - Too many hours were estimated for documentation and code merging;
  - Tests were performed only in the last few days;
  - Map-related tasks were overestimated, because they represented a feature none of us had ever faced.

- What caused your errors in estimation (if any)?

  - Our previous sprint experience led us to overestimate the time needed for code merging;
  - Excessive caution on tasks and problems we had never faced.;
  - The documentation task was equally assigned to every member of the group, even though those working on the client-side and style had less to mention in the README.

- What lessons did you learn (both positive and negative) in this sprint?

  - As a team, we should be more confident in our ability to approach and overcome new challenges;
  - If no deadline is set for the whole team, testing activities are performed too late in the sprint.

- Which improvement goals set in the previous retrospective were you able to achieve?

  - We were able to define more specific tasks and improved our balance in coding, testing, and documentation efforts;
  - Merge conflicts (and the hours needed to solve them) were drastically reduced, thanks to a better organization and a common structure.

- Which ones you were not able to achieve? Why?

  - We achieved all the improvements we set in the previous sprint.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two

  - Achieve a more precise estimation for documentation and code merging;
  - Implement tests earlier in the sprint.

- One thing you are proud of as a Team!!
  - We proved once again that our teamwork is reliable and efficient, generating a high-quality product that met our expectations.
