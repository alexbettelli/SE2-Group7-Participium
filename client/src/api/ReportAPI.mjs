const SERVER_URL = 'http://localhost:3001';

const submitReport = async (reportData) => {
    const formData = new FormData();
    formData.append('title', reportData.title);
    formData.append('description', reportData.description);
    formData.append('latitude', reportData.latitude);
    formData.append('longitude', reportData.longitude);
    formData.append('address', reportData.address);
    formData.append('catId', reportData.catId);
    formData.append('anonymous', reportData.anonymous ? 'true' : 'false');

    reportData.images.forEach(image => {
        formData.append('images', image);
    });

    const res = await fetch(SERVER_URL + '/users/reports', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (res.ok) {
        const data = await res.json();
        return data;
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.message || 'Error submitting report');
    }
};
const getAllReports = async () => {
    const res = await fetch(SERVER_URL + '/reports', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });
    if (res.ok) {
        const reports = await res.json();
        return reports;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching reports');
    }
}
const getMyReports = async () => {
    const res = await fetch(SERVER_URL + '/users/myreports', {
        method: 'GET',
        credentials: 'include'
    });
    if (res.ok) {
        const reports = await res.json();
        return reports;
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.error || 'Error fetching user reports');
    }
};
const rejectReport = async (reportId, userId, reason) => {
    const res = await fetch(SERVER_URL + '/reports/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportId, userId, reason })
    });
    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error rejecting report');
    }
}
const getReportStatuses = async () => {
    const res = await fetch(`${SERVER_URL}/reports/statuses`, { credentials: "include" });
    if (res.ok) return await res.json();
    else throw new Error('Error fetching report statuses');
};
const updateReportStatus = async (reportId, statusId) => {
    const res = await fetch(`${SERVER_URL}/reports/${reportId}?statusId=${statusId}`, { method: 'PATCH', credentials: 'include' });
    if (res.ok) {
        const data = await res.json();
        return {
            ok: data.ok || true,
            notification: data.notification || null
        };
    } else {
        throw new Error('Error updating report status');
    }
};
const getAssignedReports = async () => {
    const res = await fetch(`${SERVER_URL}/reports/assigned`, { credentials: 'include' });
    const json = await res.json();
    console.log(json);
    if (res.ok) return json;
    else return { error: json.error || 'Error fetching assigned reports' };
};
const getUnassignedReports = async () => {
    const res = await fetch(SERVER_URL + '/reports/unassigned', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });
    if (res.ok) {
        const reports = await res.json();
        return reports;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching unassigned reports');
    }
};
const assignReportToOfficer = async (reportId, userId, categoryId, officeId, officerId) => {
    const res = await fetch(SERVER_URL + '/reports/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportId, userId, categoryId, officeId, officerId })
    });
    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error assigning report to officer');
    }
};

const getExternalOfficeAssignedReports = async () => {
    const res = await fetch(SERVER_URL + '/reports/external-office-assigned', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    if (res.ok) {
        return await res.json();
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching office assigned reports');
    }
};
const getExternalMaintainerMyReports = async () => {
    const res = await fetch(SERVER_URL + '/reports/external-maintainer-my', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    if (res.ok) {
        return await res.json();
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error fetching my reports');
    }
};
const updateExternalMaintainerReportStatus = async (reportId, statusId) => {
    const res = await fetch(`${SERVER_URL}/reports/external-maintainer/${reportId}?statusId=${statusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    if (res.ok) {
        const data = await res.json();
        return {
            ok: data.ok || true,
            notification: data.notification || null,
            comment: data.comment || null
        };
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error updating report status');
    }   
};

const assignReportToExternalOffice = async (reportId, externalOfficeId) => {
    const res = await fetch(SERVER_URL + '/reports/assignExternal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportId, externalOfficeId })
    });
    if (res.ok) {
        return;
    } else {
        const errMessage = await res.json();
        throw new Error(errMessage.error || 'Error assigning report to external office');
    }
};

const ReportAPI = {
    submitReport,
    getAllReports,
    getMyReports,
    rejectReport,
    getReportStatuses,
    updateReportStatus,
    getAssignedReports,
    getUnassignedReports,
    assignReportToOfficer,
    getExternalOfficeAssignedReports,
    getExternalMaintainerMyReports,
    updateExternalMaintainerReportStatus,
    assignReportToExternalOffice
};

export default ReportAPI;