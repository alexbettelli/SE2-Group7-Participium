const getStatusClass = (status) => {
    switch (status) {
        case 'Assigned':
            return 'status-assigned';
        case 'Resolved':
            return 'status-resolved';
        case 'Pending Approval':
            return 'status-pending';
        case 'Rejected':
            return 'status-rejected';
        case 'In Progress':
            return 'status-in-progress';
        default:
            return 'status-suspended';
    }
};

export default getStatusClass;