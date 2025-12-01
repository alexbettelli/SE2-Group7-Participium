import { 
    login, 
    registrate, 
    logOut 
} from './LoggingAPI.mjs';
import { 
    submitReport,
    getAllReports,     
    getAssignedReports, 
    getUnassignedReports, 
    assignReportToOfficer, 
    rejectReport, 
    getMyReports, 
    getReportStatuses, 
    updateReportStatus 
} from './ReportAPI.mjs';
import { 
    createNewEmployee, 
    getUnassignedEmployees, 
    assignEmployeeToOffice, 
    getUserInfo,
    updateProfile, 
    deleteProfilePhoto 
} from './UserAPI.mjs';
import { 
    setReadNotifications, 
    submitNotification 
} from './NotificationAPI.mjs';
import { 
    getCategories,
    getOffices, 
    getRoles 
} from './GenericAPI.mjs';

const API = {
    login, 
    registrate, 
    createNewEmployee, 
    getUnassignedEmployees, 
    getOffices, 
    getRoles,
    assignEmployeeToOffice, 
    getUserInfo, 
    submitReport, 
    logOut, 
    getCategories,
    getAllReports, 
    getUnassignedReports, 
    assignReportToOfficer,
    rejectReport,
    getMyReports, 
    getReportStatuses,
    updateReportStatus,
    updateProfile, 
    getAssignedReports, 
    deleteProfilePhoto,
    setReadNotifications,
    submitNotification
};

export default API;