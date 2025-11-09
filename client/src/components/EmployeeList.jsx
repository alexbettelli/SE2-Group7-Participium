import { Table, Button, Form } from 'react-bootstrap';
import { useState } from 'react';

export default function UnassignedEmployeeList (props) {
    return (
        <>
          <h2>Unassigned Employees {props.employees.length === 0 ? " - None" : ` - ${props.employees.length}`}</h2>
          <Table striped hover>
                <thead>
                    <tr>
                        <th> Username </th>
                        <th> First Name </th>
                        <th> Last Name</th>
                        <th> Email </th>
                        <th> Assign to role </th>
                        <th> Assign to office </th>
                    </tr>
                </thead>
                <tbody>
                     {props.employees?.map((m)=>
                        <EmployeeRow key={m.id} 
                            employee={m}
                            roles = {props.roles || []}
                            offices={props.offices || []}
                            onAssign={props.onAssign}
                        />
                    )}
                </tbody>
            </Table>
        </>
    );
}
          
function EmployeeRow (props) {
    const { employee, roles, offices, onAssign } = props;
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedOffice, setSelectedOffice] = useState('');

    const handleAssign = async () => {
        if (!selectedRole) return;
        try {
            // support async onAssign
            await onAssign?.(employee.id, selectedOffice, selectedRole);
            setSelectedOffice('');
            setSelectedRole('');
        } catch (e) {
            console.error('Assign failed', e);
        }
    };

    return (
        <tr>
            <td>{employee.username}</td>
            <td>{employee.firstName}</td>
            <td>{employee.lastName}</td>
            <td>{employee.email}</td>

            <td style={{ minWidth: 240 }}>
                <Form.Select size="sm" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    <option value="">-- choose role --</option>
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.type}</option>
                    ))}
                </Form.Select>
            </td>
            
            {selectedRole === '3' ? (
                <td style={{ minWidth: 240, color: '#666', textAlign: 'center' }}>— no office required —</td>
            ) : (
                <td style={{ minWidth: 240 }}>
                    <Form.Select size="sm" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)}>
                        <option value="">-- choose office --</option>
                        {offices.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </Form.Select>
                </td>
            )}

            <td style={{ width: 120 }}>
                <Button size="sm" onClick={handleAssign} disabled={!selectedRole}>
                    Assign
                </Button>
            </td>
        </tr>
    );
}

