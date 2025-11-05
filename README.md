# SE2-Group7-Participium
## Students:
- s338059 BETTELLI ALEX
- s339054 GENNARO AURORA
- s342730 FUSILLI DAMIANO
- s343608 MARTINI CLAUDIO
- s337235 SCAPELLATO SAMUELE
- S343873 ZUHAL DIDEM AYTAC
---

## Database Tables
### Table `user_type`
Defines the type of users in the system (Citizen, Admin, MunicipalOfficer, TechnicalOperator).
  - **`id`** (INTEGER, PK, AUTOINCREMENT)-> Unique identifier for the user type.
  - **`type`** (TEXT, UNIQUE) ->  Descriptive name of the user type

### Table: `user`
Stores all registered users of the platform, including citizens and municipal staff.
  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the user.
  - **`username`** (TEXT, UNIQUE): Chosen username for login and identification.
  - **`password`**(TEXT): Hashed password.
  - **`email`** (TEXT, UNIQUE): User's email address.
  - **`firstName`** (TEXT): User's first name.
  - **`lastName`** (TEXT): User's last name.
  - **`typeId`** (INTEGER, FK → user_type.id): User role type (Citizen, Admin, Technician).
  - **`allowEmailNotification`** (INTEGER, DEFAULT 1): 1 if the user accepts email notifications.
  - **`telegramUsername`** (TEXT, NULLABLE): Optional Telegram username for bot integration.
  - **`imageUrl`** (TEXT, NULLABLE): Optional profile image URL.

### TABLE: report_category
Defines all categories of issues that citizens can report.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the category.
  - **`categoryName`** (TEXT, UNIQUE): Category name.


### TABLE: report_status
Lists all possible statuses of a report throughout its lifecycle.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the status.
  - **`statusName`** (TEXT, UNIQUE): Status label (Pending Approval, Assigned, In Progress, Suspended, Rejected, Resolved).


### TABLE: office
  Represents municipal offices or departments responsible for handling reports.
  Each office may be associated with a specific report category.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the office.
  - **`name`** (TEXT): Name of the office.
  - **`catId`** (INTEGER, FK → report_category.id): Category assigned to this office.


### TABLE: office_employee
  Shows the association between office and employee.

  - **`officeId`** INTEGER)
  - **`userid`** (INTEGER): Associated user(only TechnicalOperator)



### TABLE: report
  Stores all citizen reports about city issues, including their details, location,
  current status, and responsible office.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the report.
  - **`title`** (TEXT): Short title of the report.
  - **`description`** (TEXT): Detailed description of the issue.
  - **`latitude`** (REAL): Geographic latitude of the problem location.
  - **`longitude`** (REAL): Geographic longitude of the problem location.
  - **`address`** (TEXT, NULLABLE): address of the problem location. (We can get it with an API to OpenStreetMap (ChatGPT said so))
  - **`userId`** (INTEGER, FK → user.id, NULLABLE): ID of the citizen who submitted the report. NULL id mean anonymous
  - **`catId`** (INTEGER, FK → report_category.id): Type of issue reported.
  - **`statusId`** (INTEGER, FK → report_status.id): Current lifecycle status of the report.
  - **`officeId`** (INTEGER, FK → office.id, NULLABLE): Office currently handling the report.Null if report is not yet assigned
  - **`createdAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): Creation timestamp.
  - **`updatedAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): Last modification timestamp.
  - **`rejectReason`** (TEXT, NULLABLE): mandatory reason in case of rejection



### TABLE: comment
  Contains conversation messages between users (citizens or operators)
  about a specific report. Enables communication and clarification. 

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the comment.
  - **`reportId`** (INTEGER, FK → report.id): The report this comment belongs to.
  - **`userId`**(INTEGER, FK → user.id): The author of the comment.
  - **`text`** (TEXT): The content of the comment.
  - **`createdAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): When the comment was created.



### TABLE: report_image
  Stores one or more image URLs attached to a report. Each report can have one up to three images.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the image.
  - **`reportId`** (INTEGER, FK → report.id): Associated report.
  - **`imageUrl`** (TEXT): URL or path to the uploaded image.
  - **`uploadedAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): Upload timestamp.



### TABLE: notification
  Manages all system notifications exchanged between users.
  Notifications are triggered when report status changes, messages are sent,
  or administrative actions occur.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the notification.
  - **`reportId`** (INTEGER, FK → report.id): Optional reference to a related report.
  - **`senderId`** (INTEGER, FK → user.id): The user or system actor who sent the notification.
  - **`receiverId`** (INTEGER, FK → user.id): The user receiving the notification.
  - **`text`** (TEXT): Content of the notification.
  - **`channelId`** (INTEGER): Delivery channel id (platform, email, Telegram).
  - **`sendAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): Timestamp when notification was sent.


### TABLE: channel
  Defines all the channels able to send messages.

  - **`id`** (INTEGER, PK, AUTOINCREMENT): Unique identifier for the channel.
  - **`name`** (TEXT): Name of the channel. (Platform, email, telegram)



## React Client Application Routes
<!-- EXAMPLE
- Route `/`: .................................
-->

## API Server
- **POST** `/user`

  **Description**: Create a new user account

  **Request body**:
    ```
    [
      {
        "username": "marioRossi",
        "password": "Password123!",  
        "email": "mario.rossi@example.com",
        "firstName": "Mario",
        "lastName": "Rossi",
        "typeId": 1
      }
    ]
    ```
  
  **Response**: `201 OK` (success), `409 Conflict` (username already exists), or `503 Service unavailable` (Saving error).

  
<!--
- **POST** `/user`

  **Description**: Create a new user account

  **Request body**:..... JSON 
  **Query parameters**:........... JSON
  **Response**: `200 OK` (success), `404 Not Found` (.....), or `500 Internal Server Error` (tgeneric error).

  **Response body**:
    ```
    [
      {
        ....        
      },
      ...
    ]
    ```
-->

## Main React Components

- `AuthenticateForm` (in `Authentication.js`):  
  - **Scope**: Manage log in and registration of users



