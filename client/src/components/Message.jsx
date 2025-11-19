import { Container, Row, Image } from "react-bootstrap";
import error from '../assets/error.png'
import "../styles/Message.css";

export default function Message(props){
    const { message } = props;
    return (
        <div className="message-container">
            <div className="message-content">
                {message.text}
            </div>
            <div className="message-meta">
                {message.sendAt}
            </div>
        </div>
    );
}