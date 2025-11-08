

import { Table } from 'react-bootstrap';

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
                        <th> email </th>
                    </tr>
                </thead>
                <tbody>
                     {props.employees?.map((m)=>
                        <EmployeeRow key={m.id} 
                            username={m.username}
                            firstName={m.firstName}
                            lastName={m.lastName}
                            email={m.email}
                        ></EmployeeRow>
                    )}
                </tbody>
            </Table>
        </>
    );
}
          
function EmployeeRow (props) {
    return (
        <tr>
            <td> {props.username} </td>
            <td> {props.firstName} </td>
            <td> {props.lastName} </td>
            <td> {props.email} </td>
        </tr>
    );
}

