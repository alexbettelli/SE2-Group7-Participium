import { Table, Form } from 'react-bootstrap';
import { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/EmployeeList.css';
import OfficeDropdown from './OfficeDropdown.jsx';

export default function UnassignedEmployeeList(props) {
    return (
        <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p className="employee-count" style={{ textAlign: 'center', width: '100%', color: 'var(--color-wine-light)', fontWeight: 600, marginBottom: '1rem' }}>
                Total: {props.employees.length}
            </p>
            <Table className="employee-list-table" hover style={{ tableLayout: 'fixed', margin: '0 auto' }}>
                <thead>
                    <tr style={{ textAlign: 'center' }}>
                        <th> Username </th>
                        <th> First Name </th>
                        <th> Last Name</th>
                        <th> Choose the role </th>
                        <th> Assign to  </th>
                        {props.employees.length !== 0 && <th></th>}
                    </tr>
                </thead>
                <tbody>
                    {props.employees?.map((m) =>
                        <EmployeeRow key={m.id}
                            employee={m}
                            roles={props.roles || []}
                            offices={props.offices || []}
                            externalOffices={props.externalOffices || []}
                            onAssign={props.onAssign}
                        />
                    )}
                </tbody>
            </Table>
        </div>
    );
}

function EmployeeRow(props) {
    const { employee, roles, offices, externalOffices, onAssign } = props;
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedOffices, setSelectedOffices] = useState([]);

    // Reset office when role is set to default
    const handleRoleChange = (e) => {
        const value = e.target.value;
        setSelectedRole(value);
        if (value === '') {
            setSelectedOffices([]);
        }
    };

    const handleAssign = async () => {
        if (!selectedRole) return;
        try {
            // support async onAssign
            await onAssign?.(employee.id, selectedOffices, selectedRole);
            setSelectedOffices([]);
            setSelectedRole('');

        } catch (e) {
            console.error('Assign failed', e);
        }
    };

    const handleOfficeSelection = (officeId) => {
        setSelectedOffices(prev => [...prev, officeId]);
    };

    const handleOfficeRemoval = (officeId) => {
        setSelectedOffices(prev => prev.filter(id => id !== officeId));
    };

    return (
        <tr>
            <td>{employee.username}</td>
            <td>{employee.firstName}</td>
            <td>{employee.lastName}</td>

            <td style={{ minWidth: 240 }}>
                <Form.Select
                    size="sm"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className={selectedRole === '' ? 'employee-select-unselected' : 'employee-select'}
                >
                    <option value="">-- choose role --</option>
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.type}</option>
                    ))}
                </Form.Select>
            </td>

            {selectedRole === '3' && (
                <td style={{ minWidth: 240, textAlign: 'center' }}>
                    <span className="no-office-badge">— no office required —</span>
                </td> 
            )}
            {selectedRole === '4' && (
                <td style={{ minWidth: 240 }}>
                    <OfficeDropdown 
                        offices = {offices}
                        selectedOffices={selectedOffices}
                        onSelect = {handleOfficeSelection} 
                        onDeselect ={handleOfficeRemoval}
                    />
                </td>
            )}
            {selectedRole === '6' && (
                <td style={{ minWidth: 240 }}>
                    <Form.Select
                        size="sm"
                        value={selectedOffices[0] || ''}
                        onChange={(e) => setSelectedOffices([e.target.value])}
                        className={selectedOffices[0] === '' ? 'employee-select-unselected' : 'employee-select'}
                    >
                        <option value="">-- choose company --</option>
                        {externalOffices.map(eo => (
                            <option key={eo.id} value={eo.id}>{eo.name}</option>
                        ))}
                    </Form.Select>
                </td>
            )}
            {!selectedRole && (
                <td style={{ minWidth: 240, textAlign: 'center' }}>
                    <span className="no-office-badge">— select a role first —</span>
                </td>
            )}

            <td style={{ width: 120 }}>
                <button
                    className="assign-button"
                    onClick={handleAssign}
                    disabled={
                        !selectedRole ||
                        (selectedRole !== '3' && !selectedOffices.length) ||
                        (selectedRole === '6' && !selectedOffices[0])
                    }
                >
                    Assign
                </button>
            </td>
        </tr>
    );
}

UnassignedEmployeeList.propTypes = {
    employees: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired
    })).isRequired,
    roles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired
    })).isRequired,
    offices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired,
    externalOffices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired,
    onAssign: PropTypes.func.isRequired
};

EmployeeRow.propTypes = {
    employee: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired
    }).isRequired,
    roles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired
    })).isRequired,
    offices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired,
    externalOffices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired,
    onAssign: PropTypes.func.isRequired
};

