import { Container, Row, Image } from "react-bootstrap";
import error from '../assets/error.png'

export default function ChatPage(props){
    const { report, user } = props;
    return (
        <h1> Report: {report.title}</h1>
    );
}