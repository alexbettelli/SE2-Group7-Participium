import { Container, Row, Image } from "react-bootstrap";
import error from '../assets/error.png'

export default function Message(props){
    const { message, user } = props;
    // Mostra i dati del messaggio
    return (
        <div style={{marginBottom: '1rem', padding: '0.5rem', borderBottom: '1px solid #eee'}}>
            <strong>Da:</strong> {message.sender} <br/>
            <strong>A:</strong> {message.receiver} <br/>
            <strong>Testo:</strong> {message.text} <br/>
            <span style={{fontSize: '0.8em', color: '#888'}}>{message.sendAt}</span>
        </div>
    );
}