import { Container, Row, Image } from "react-bootstrap";
import { useEffect, useState } from "react";
import { getReportChatMessages } from "../api/API.mjs";
import error from '../assets/error.png'
import '../styles/MyReportsPage.css';
import Message from "./Message.jsx";

export default function ChatPage(props){
    const { report, user } = props;
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (report?.id) {
            setLoading(true);
            getReportChatMessages(report.id)
                .then(setMessages)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [report]);

    if (loading) return <div>Caricamento chat...</div>;
    if (error) return <div>Errore: {error}</div>;

    return (
        <div>
            <h1 className="page-title">Chat for: {report.title}</h1>
            <hr className="title-divider" />
            <div>
                {messages.length === 0 ? (
                    <div>Nessun messaggio nella chat.</div>
                ) : (
                    messages.map(msg => (
                        <Message key={msg.id} message={msg} user={user} />
                    ))
                )}
            </div>
        </div>
    );
}