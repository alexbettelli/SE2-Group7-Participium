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
- **`type`** (TEXT, UNIQUE) -> Descriptive name of the user type

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
- **`userId`** (INTEGER, FK → user.id): ID of the citizen who submitted the report. Always stored even for anonymous reports.
- **`anonymous`** (INTEGER, DEFAULT 0): Flag indicating if the report is anonymous (1 = anonymous, 0 = not anonymous). When anonymous, the user's name is not visible in public reports, but the userId is still stored for internal tracking.
- **`catId`** (INTEGER, FK → report_category.id): Type of issue reported.
- **`statusId`** (INTEGER, FK → report_status.id): Current lifecycle status of the report.
- **`officeId`** (INTEGER, FK → office.id, NULLABLE): Office currently handling the report.Null if report is not yet assigned
- **`employeeId`** (INTEGER, FK → user.id, NULLABLE): ID of the employee assigned to handle the report. Null if no employee is assigned yet.
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
- **`senderId`** (INTEGER, FK → user.id, NULLABLE): The user who sent the notification. NULL for automatic/system messages.
- **`receiverId`** (INTEGER, FK → user.id): The user receiving the notification.
- **`text`** (TEXT): Content of the notification.
- **`channelId`** (INTEGER): Delivery channel id (platform, email, Telegram).
- **`sendAt`** (TEXT, DEFAULT CURRENT_TIMESTAMP): Timestamp when notification was sent.
- **`isRead`** (INTEGER, DEFAULT 0): Flag indicating if the notification has been read (1 = read, 0 = unread).

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

<br>

- **POST** `/employees`
  **Description**: Creation of a new employee account, requires the user calling the API to be admin
  **Request body**:

```
    [
      {
        "username": "marioRossi",
        "password": "Password123!",
        "email": "mario.rossi@example.com",
        "firstName": "Mario",
        "lastName": "Rossi"
      }
    ]
```

**Response**: `200 OK` (success),`401 Unauthorized`, `403 Forbidden`, `409 Conflict` (username already exists), or `503 Service unavailable` (Saving error).

  <br>

- **GET** `/employees/unassigned`
  **Description**: Retrieve all employees not already assigned to a role
  **Response**: `200 OK` (success), `401 Unauthorized`, `403 Forbidden` or `503 Service unavailable`.
  **Response body**:

```
    [
      {
        "username": "marioRossi",
        "email": "mario.rossi@example.com",
        "firstName": "Mario",
        "lastName": "Rossi",
        "typeId": 5,
        "allowEmailNotification":1,
        "telegramUsername": NULL,
        "imageUrl": NULL,
      },
      {
        ...
      },
      ...
    ]
```

<br>

- **POST** `/employees/assign`
  **Description**: Assign employee to a role and an office
  **Request body**:

```
    [
      {
        "employeeId" : 4,
        "roleId": 4,
        "officeId": 2
      }
    ]
```

**Response**: `200 OK` (success), `401 Unauthorized`, `403 Forbidden`, or `503 Service unavailable` (Saving error).

  <br>

- **GET** `/offices`
  **Description**: Retrieve list of all offices
  **Response**: `200 OK` (success), `401 Unauthorized`, `403 Forbidden`, or `503 Service unavailable` .
  **Response body**:

```
    [
      {
        "id": 1,
        "name": "Office for Road Maintenance",
        "catId": 1
      },
      {
        "id": 2,
        "name": "Office for Waste Management",
        "catId": 2
      },
      ...
    ]
```

  <br>

- **GET** `/roles`
  **Description**: Retrieve list of roles assignable to employees
  **Response**: `200 OK` (success), `401 Unauthorized`, `403 Forbidden`, or `503 Service unavailable`.
  **Response body**:

```
    [
      {
        "id" : 3,
        "type": "Municipal Public Relations Officer",
      },
      {
        "id" : 4,
        "type": "Techinal Office Staff Member",
      }
    ]
```

  <br>
  
 - **GET** `\categories`
**Description** : Retrieve list of valid categories for report creation
**Response** : `200 OK (success)`, `401 Unauthorized`,`503 Service unavailable`
 **Response body** :

```
[
   {
       "id": 1,
       "categoryName": "Roads and Infrastructure"
   },
   {
       "id": 2,
       "categoryName": "Waste and Cleanliness"
   },
   {
       "id": 3,
       "categoryName": "Green Areas and Public Parks"
   },
   {
       "id": 4,
       "categoryName": "Public Transport and Mobility"
   }
]
```

## Main React Components

- `AuthenticateForm` (in `Authentication.js`):

  - **Scope**: Manage log in and registration of users

- `NewEmployeeForm` (in `NewEmployeeFrom.jsx`):

  - **Scope**: Creation form for a new employee in the admin page

- `UnassignedEmployeeList` (in `EmployeeList.jsx`):

  - **Scope**: Shows to the admin list of all assignable employees and allow assignement

- `ReportOverview` (in `ReportOverview.jsx` / `ReportOverviewPage.jsx`):

  - **Scope**: Displays the report after submission (post-submission preview).

- `CitizenPage` (in `CitizenPage.jsx`):

  - **Scope**: Main interface for citizens to submit reports about city issues. This component integrates three key features:

- **Map Display**: The component uses Leaflet to render an interactive map centered on Turin (coordinates 45.0703, 7.6868). The map displays OpenStreetMap tiles and provides users with a visual way to explore the city and identify problem locations. The map is fully interactive, allowing users to zoom, pan, and navigate to different areas of the city. The component loads and displays the official administrative boundaries of the City of Turin using a GeoJSON file (`/geo/torino.geojson`) based on OpenStreetMap relation [43992](https://www.openstreetmap.org/relation/43992). The boundary is displayed as a green outlined polygon with semi-transparent fill, and the map automatically adjusts its view to fit the city boundaries when loaded.

- **Location Selection**: When users click on the map, the component first validates that the selected location is within the City of Turin boundaries using Turf.js for point-in-polygon checking. If a user attempts to select a location outside the city boundaries, an alert message is displayed: "Please select a location inside the City of Turin." Only clicks within the official city boundaries are processed. Once a valid location is selected, the component places a marker at that exact location and automatically retrieves the corresponding street address using OpenStreetMap's Nominatim reverse geocoding API. The selected coordinates (latitude and longitude) are stored, and the address is displayed in a location info box. Users can see both the precise coordinates and the human-readable address before proceeding. If they want to change their selection, they can click the "Reset Location" button to clear the marker and start over.

- **Submit Report Form**: Once a location is selected, a comprehensive form appears that allows users to provide details about the issue. The form includes:

  - A required title field (5-100 characters)
  - A required description field (10-255 characters)
  - A category dropdown with 9 predefined options (Water Supply, Architectural Barriers, Sewer System, Public Lighting, Waste, Road Signs and Traffic Lights, Roads and Urban Furnishings, Public Green Areas and Playgrounds, and Other)
  - An image upload section that accepts 1-3 photos with live previews and the ability to remove individual images before submission
  - An anonymous checkbox option that allows citizens to submit reports without their name being visible in public reports. When checked, the report's `anonymous` flag is set to 1 in the database, but the `userId` is still stored for internal tracking purposes.

  The form performs client-side validation to ensure all required fields are filled correctly and that image constraints are met. Upon successful submission, users are redirected to the report overview page to see their submitted report.

## User account verification
The creation of a user account requires the verification of it through an OTP code sent to the email. This procedure requires several steps:
1. Creating a temporary user.
2. Generating and sending a 6-character OTP.
3. Optionally resending a new OTP (minimum delay: 1 minute).
4. Verifying the OTP and creating the final user account.

### Registration flow overview
#### Endpoints
- `/users/temporary`: creates temporary user + sends OTP via email.
- `/otp/resend`: it is optional, and it consists on resending the OTP. It can be done after a minimum time of 1 minute of the previous sending.
- `/users/temporary/verify`: verifies OTP and creates the final user

### Environment variables
| Variable | Description | Default |
|----------|-------------|---------|
| `OTP_EXPIRATION_MINUTES` | How long the OTP is valid | `30` |

### Email delivery system
The application uses **Nodemailer** with Gmail SMTP to send OTP emails.  
A custom HTML email template is built using **Handlebars**, and CSS is inlined using **Juice**.

Each email contains:
- The user’s full name
- Their username
- A 6-character OTP (letters + numbers)

Example OTP: `A9F3BD`

### Security notes
- OTP validity period is configurable through the environment variable.
- Resending an OTP is rate-limited (1 minute cooldown).
- Server never exposes nor stores the plain OTP, but it is stored in the user session in the hashed form thanks to **bcrypt**

## Users

- **Admin user**

  **username** : admin
  **password** : adminpassword

<br>

- **Citizen user**

  **username** : Itacyma
  **password** : ClaudioMartini

  **username** : Bette99
  **password** : alexbettelli

<br>

- **Public Relations Municipal Officer**

  **username** : carla.rossi
  **password** : CarlaRossi

  <br>

- **Technical Office staff member**

  **username** : federico.romano
  **password** : FedericoRomano

  **username** : alessia.riva
  **password** : AlessiaRiva

<br>





# Running Docker Containers

This guide explains how to run the Docker containers for the repository `338059/se2-participium` using Docker Compose or individual Docker commands.

---

## Prerequisites

* [Docker](https://www.docker.com/) installed
* [Docker Compose](https://docs.docker.com/compose/) installed (optional, only for the Compose method)
*  Make a folder for the project
```bash
mkdir <folder_name>
cd <folder_name>
```
---
## Method 1: Docker Compose (recommended)

### Step 1 - Download file docker-compose.yml

* Direct download
```bash
curl -L -o docker-compose.yml https://raw.githubusercontent.com/alexbettelli/SE2-Group7-Participium/main/docker-compose.yml
```
* Download manually by [GitHub](https://github.com/alexbettelli/SE2-Group7-Participium/tree/main)


### Step 2 - Pull the Docker Compose
```bash
docker compose pull
```

### Step 3- Start the containers:

```bash
docker-compose up -d
```
### Step 4 -  Access the application
Open the browser on http://localhost:5173

### Step 5 - Stop and remove the containers:


```bash
docker-compose down
docker-compose down -v
```
**Attention: `docker-compose down -v` removes all the volumes and data**

---

## Method 2: Individual Docker Commands

If you prefer to run containers manually:

### Step 1 Pull the Docker Images
First, download the required Docker images:

```bash
docker pull 338059/se2-participium:server-latest
docker pull 338059/se2-participium:client-latest
```

---
### Step 2 Run the single Docker Images
```bash
# Start the server
docker run -d --name participium-server -p 3001:3001 -v participium-db:/app/data -v participium-uploads:/app/uploads -e NODE_ENV=production -e BASE_URL=http://localhost:3001 -e CORS_ORIGIN=http://localhost:5173 338059/se2-participium:server-latest


# Start the client
docker run -d --name participium-client -p 5173:80 -e VITE_API_URL=http://localhost:3001 --link participium-server:server 338059/se2-participium:client-latest

```
### Step 3 - Access the application
Open the browser on http://localhost:5173

### Step 4 Stop and remove the containers:

```bash
docker stop participium-server participium-client
docker rm participium-server participium-client
```
**Attention: `docker rm participium-server participium-client` removes all the volumes and data**

---

## 5. Notes

* Default ports: **3001** for the server, **5173** for the client.
* Volumes `participium-db` and `participium-uploads` persist data across container restarts(not removes).
* Useful commands:

```bash
docker-compose restart
docker logs participium-server
docker logs participium-client
```

---

These instructions allow you to easily run the project using either Docker Compose or standalone Docker commands.

